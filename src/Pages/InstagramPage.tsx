import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useDashboard } from "../store/DashboardContext";
import { Card, SectionTitle, KpiCard, Badge, Th, Td } from "../components/ui";
import { fmtK } from "../utils/format";
import type {
  InstagramData,
  InstagramMonthly,
  InstagramByType,
} from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e2e8f0",
};

const TYPE_COLORS: Record<string, string> = {
  Reel: "#3b82f6",
  Story: "#8b5cf6",
  Image: "#10b981",
  Carousel: "#f59e0b",
  Video: "#ec4899",
  Post: "#06b6d4",
};

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

function colorFor(cat: string) {
  return TYPE_COLORS[cat] ?? "#64748b";
}

function Empty({
  msg = "No Instagram data yet — connect your sheet",
}: {
  msg?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 0",
        color: "#475569",
        fontSize: 12,
      }}
    >
      {msg}
    </div>
  );
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}
function fmtNum(n: number) {
  return n.toLocaleString("en-IN");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InstagramPage() {
  const { state } = useDashboard();
  const insta = (state as any).instagram as InstagramData | null;
  const [activeTab, setActiveTab] = useState<"overview" | "reels" | "posts">(
    "overview",
  );

  const summary = insta?.summary;
  const monthly = insta?.monthly ?? [];
  const byType = insta?.byType ?? [];
  const topPosts = insta?.topPosts ?? [];
  const reels = insta?.reels ?? [];
  const hasData = monthly.length > 0;

  // ── Reach vs Followers monthly ────────────────────────────────────────────
  const reachVsFollowers = useMemo(
    () =>
      monthly.map((m) => ({
        month: m.month,
        reach: m.reach,
        follows: m.follows,
        nonFollower: Math.max(m.reach - m.follows, 0),
      })),
    [monthly],
  );

  // ── Saves + Shares per month ──────────────────────────────────────────────
  const savesShares = useMemo(
    () =>
      monthly.map((m) => ({
        month: m.month,
        saved: m.saved,
        shares: m.shares,
        likes: m.likes,
      })),
    [monthly],
  );

  // ── Tab style ─────────────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: active ? "rgba(139,92,246,0.2)" : "transparent",
    color: active ? "#a78bfa" : "#64748b",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      {summary && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
            }}
          >
            <KpiCard
              label="Total Followers Gained"
              value={fmtNum(summary.follows)}
              color="#8b5cf6"
              sub="from tracked posts"
            />
            <KpiCard
              label="Avg Engagement Rate"
              value={fmtPct(summary.avgEngRate)}
              color={
                summary.avgEngRate > 5
                  ? "#10b981"
                  : summary.avgEngRate > 2
                    ? "#f59e0b"
                    : "#ef4444"
              }
              sub="> 5% = excellent"
            />
            <KpiCard
              label="Total Reach"
              value={fmtK(summary.reach)}
              color="#3b82f6"
              sub="unique accounts"
            />
            <KpiCard
              label="Total Posts Tracked"
              value={fmtNum(summary.totalPosts)}
              color="#06b6d4"
              sub={`${summary.totalReels} reels · ${summary.totalImages} posts`}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
            }}
          >
            <KpiCard
              label="Total Saves"
              value={fmtK(summary.saved)}
              color="#f59e0b"
              sub="high intent signal"
            />
            <KpiCard
              label="Total Shares"
              value={fmtK(summary.shares)}
              color="#10b981"
              sub="viral potential"
            />
            <KpiCard
              label="Profile Visits"
              value={fmtK(summary.profileVisits)}
              color="#ec4899"
              sub="store traffic intent"
            />
            <KpiCard
              label="Total Views"
              value={fmtK(summary.views)}
              color="#6366f1"
              sub="video + reel views"
            />
          </div>
        </>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
        }}
      >
        {(["overview", "reels", "posts"] as const).map((t) => (
          <button
            key={t}
            style={tabStyle(activeTab === t)}
            onClick={() => setActiveTab(t)}
          >
            {t === "overview"
              ? "📈 Overview"
              : t === "reels"
                ? "🎥 Reels"
                : "🏆 Top Posts"}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* 1. Follower Growth */}
          <Card>
            <SectionTitle
              icon="📈"
              title="Follower Growth"
              subtitle="Cumulative follows gained from tracked content — spikes = viral moments"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={monthly}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="followGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="cum"
                    tickFormatter={fmtNum}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <YAxis
                    yAxisId="monthly"
                    orientation="right"
                    tickFormatter={fmtNum}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtNum(v), name]}
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    yAxisId="monthly"
                    dataKey="follows"
                    name="New Follows"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                    radius={[4, 4, 0, 0]}
                  />
                  <Area
                    yAxisId="cum"
                    type="monotone"
                    dataKey="cumulativeFollows"
                    name="Cumulative"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#followGrad)"
                    dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* 2. Engagement Rate by Post Type */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="❤️"
                title="Engagement Rate by Content Type"
                subtitle="Avg % engagement — reels typically highest"
              />
              {byType.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={byType}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      unit="%"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [
                        `${Number(v).toFixed(2)}%`,
                        "Avg Eng Rate",
                      ]}
                      labelFormatter={(l) => `Type: ${l}`}
                    />
                    <Bar
                      dataKey="avgEngRate"
                      name="Avg Eng Rate %"
                      radius={[6, 6, 0, 0]}
                    >
                      {byType.map((t, i) => (
                        <Cell key={i} fill={colorFor(t.category)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Post type distribution pie */}
            <Card>
              <SectionTitle
                icon="👥"
                title="Content Mix"
                subtitle="Posts by type — are you publishing enough reels?"
              />
              {byType.length === 0 ? (
                <Empty />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={byType}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        innerRadius={38}
                        paddingAngle={3}
                      >
                        {byType.map((t, i) => (
                          <Cell key={i} fill={colorFor(t.category)} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [v, "Posts"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    {byType.map((t) => (
                      <div
                        key={t.category}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10,
                          color: "#64748b",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: colorFor(t.category),
                            display: "inline-block",
                          }}
                        />
                        {t.category} ({t.count})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* 5. Saves & Shares */}
          <Card>
            <SectionTitle
              icon="🧲"
              title="Saves & Shares vs Likes"
              subtitle="Saves = high intent · Shares = viral — more valuable than likes"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart
                  data={savesShares}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtNum(v), name]}
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    dataKey="likes"
                    name="Likes"
                    fill="#64748b"
                    fillOpacity={0.4}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="saved"
                    name="Saves"
                    fill="#f59e0b"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="shares"
                    name="Shares"
                    fill="#10b981"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* 4. Profile Visits (→ website traffic) */}
          <Card>
            <SectionTitle
              icon="🛒"
              title="Profile Visits Trend"
              subtitle="Instagram → profile → store — traffic generation signal"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={monthly}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={fmtNum}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => [fmtNum(v), "Profile Visits"]}
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="profileVisits"
                    name="Profile Visits"
                    stroke="#ec4899"
                    strokeWidth={2.5}
                    fill="url(#pvGrad)"
                    dot={{ r: 4, fill: "#ec4899", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* 7. Reach vs Followers */}
          <Card>
            <SectionTitle
              icon="📊"
              title="Reach vs New Followers"
              subtitle="High reach + low follows = awareness not converting — check CTA"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={reachVsFollowers}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="reach"
                    tickFormatter={fmtK}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <YAxis
                    yAxisId="follows"
                    orientation="right"
                    tickFormatter={fmtNum}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtNum(v), name]}
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    yAxisId="reach"
                    dataKey="reach"
                    name="Total Reach"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="follows"
                    type="monotone"
                    dataKey="follows"
                    name="New Follows"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Avg Engagement Rate trend */}
          <Card>
            <SectionTitle
              icon="📉"
              title="Avg Engagement Rate Trend"
              subtitle="Monthly average — dropping = content fatigue or wrong time posting"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={monthly}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    unit="%"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => [
                      `${Number(v).toFixed(2)}%`,
                      "Avg Eng Rate",
                    ]}
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                  <ReferenceLine
                    y={5}
                    stroke="#10b981"
                    strokeDasharray="4 2"
                    strokeOpacity={0.4}
                  />
                  <ReferenceLine
                    y={2}
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeOpacity={0.4}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgEngRate"
                    name="Eng Rate %"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              {[
                { label: "> 5% Excellent", color: "#10b981" },
                { label: "2–5% Good", color: "#f59e0b" },
                { label: "< 2% Low", color: "#ef4444" },
              ].map((b) => (
                <div
                  key={b.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 10,
                    color: "#64748b",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: b.color,
                      display: "inline-block",
                    }}
                  />
                  {b.label}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ══════════════ REELS TAB ════════════════════════════════════════ */}
      {activeTab === "reels" && (
        <>
          {/* Reels Views trend */}
          <Card>
            <SectionTitle
              icon="🎥"
              title="Reels Views Over Time"
              subtitle="Your main growth engine — consistent views = algorithm favoring you"
            />
            {reels.length === 0 ? (
              <Empty msg="No Reels data found" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={reels}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    yAxisId="views"
                    tickFormatter={fmtK}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <YAxis
                    yAxisId="follows"
                    orientation="right"
                    tickFormatter={fmtNum}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtNum(v), name]}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    yAxisId="views"
                    dataKey="views"
                    name="Views"
                    fill="#3b82f6"
                    fillOpacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="follows"
                    type="monotone"
                    dataKey="follows"
                    name="Follows"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Reels Saves + Shares */}
          <Card>
            <SectionTitle
              icon="🧲"
              title="Reels: Saves & Shares"
              subtitle="High saves = tutorial / inspirational content working"
            />
            {reels.length === 0 ? (
              <Empty msg="No Reels data found" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={reels}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtNum(v), name]}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    dataKey="saved"
                    name="Saves"
                    fill="#f59e0b"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="shares"
                    name="Shares"
                    fill="#10b981"
                    fillOpacity={0.85}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="likes"
                    name="Likes"
                    fill="#64748b"
                    fillOpacity={0.4}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Reels table */}
          <Card>
            <SectionTitle
              icon="📋"
              title="All Reels Performance"
              subtitle="Sorted by views"
            />
            {reels.length === 0 ? (
              <Empty msg="No Reels data found" />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 3px",
                    fontSize: 12,
                    minWidth: 700,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Caption",
                        "Views",
                        "Likes",
                        "Saves",
                        "Shares",
                        "Reach",
                        "Follows",
                        "Eng %",
                      ].map((h) => (
                        <Th
                          key={h}
                          align={
                            h === "Date" || h === "Caption" ? "left" : "right"
                          }
                        >
                          {h}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...reels]
                      .sort((a, b) => b.views - a.views)
                      .map((r, i) => (
                        <tr key={i}>
                          <Td rowIndex={i}>
                            <span
                              style={{
                                fontSize: 10,
                                color: "#64748b",
                                fontFamily: "monospace",
                              }}
                            >
                              {r.date}
                            </span>
                          </Td>
                          <Td rowIndex={i}>
                            <a
                              href={r.permalink}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#a78bfa",
                                textDecoration: "none",
                                fontSize: 11,
                              }}
                            >
                              {r.caption || "—"}
                            </a>
                          </Td>
                          <Td
                            rowIndex={i}
                            align="right"
                            style={{ color: "#60a5fa", fontWeight: 700 }}
                          >
                            {fmtK(r.views)}
                          </Td>
                          <Td rowIndex={i} align="right">
                            {fmtK(r.likes)}
                          </Td>
                          <Td
                            rowIndex={i}
                            align="right"
                            style={{ color: "#f59e0b", fontWeight: 700 }}
                          >
                            {fmtK(r.saved)}
                          </Td>
                          <Td
                            rowIndex={i}
                            align="right"
                            style={{ color: "#10b981", fontWeight: 700 }}
                          >
                            {fmtK(r.shares)}
                          </Td>
                          <Td rowIndex={i} align="right">
                            {fmtK(r.reach)}
                          </Td>
                          <Td
                            rowIndex={i}
                            align="right"
                            style={{ color: "#8b5cf6" }}
                          >
                            {r.follows}
                          </Td>
                          <Td rowIndex={i} align="right">
                            <Badge
                              color={
                                r.engRate > 5
                                  ? "#10b981"
                                  : r.engRate > 2
                                    ? "#f59e0b"
                                    : "#ef4444"
                              }
                            >
                              {fmtPct(r.engRate)}
                            </Badge>
                          </Td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ══════════════ TOP POSTS TAB ═════════════════════════════════════ */}
      {activeTab === "posts" && (
        <>
          {/* By type performance comparison */}
          <Card>
            <SectionTitle
              icon="📊"
              title="Avg Metrics by Content Type"
              subtitle="Which format delivers best reach & saves?"
            />
            {byType.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={byType}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={fmtK}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtNum(v), name]}
                    labelFormatter={(l) => `Type: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    dataKey="avgReach"
                    name="Avg Reach"
                    fill="#3b82f6"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgSaved"
                    name="Avg Saves"
                    fill="#f59e0b"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgShares"
                    name="Avg Shares"
                    fill="#10b981"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgLikes"
                    name="Avg Likes"
                    fill="#64748b"
                    fillOpacity={0.5}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Top posts table */}
          <Card>
            <SectionTitle
              icon="🏆"
              title="Top Posts by Saves + Shares"
              subtitle="High saves = high-intent content — replicate these"
            />
            {topPosts.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 3px",
                    fontSize: 12,
                    minWidth: 680,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Caption",
                        "Type",
                        "Reach",
                        "Likes",
                        "Saves",
                        "Shares",
                        "Eng %",
                      ].map((h) => (
                        <Th
                          key={h}
                          align={
                            h === "Date" || h === "Caption" || h === "Type"
                              ? "left"
                              : "right"
                          }
                        >
                          {h}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((p: any, i: number) => (
                      <tr key={i}>
                        <Td rowIndex={i}>
                          <span
                            style={{
                              fontSize: 10,
                              color: "#64748b",
                              fontFamily: "monospace",
                            }}
                          >
                            {p.date}
                          </span>
                        </Td>
                        <Td rowIndex={i}>
                          <a
                            href={p.permalink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#a78bfa",
                              textDecoration: "none",
                              fontSize: 11,
                            }}
                          >
                            {p.caption || "—"}
                          </a>
                        </Td>
                        <Td rowIndex={i}>
                          <Badge color={colorFor(p.category)}>
                            {p.category}
                          </Badge>
                        </Td>
                        <Td rowIndex={i} align="right">
                          {fmtK(p.reach)}
                        </Td>
                        <Td rowIndex={i} align="right">
                          {fmtK(p.likes)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#f59e0b", fontWeight: 700 }}
                        >
                          {fmtK(p.saved)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#10b981", fontWeight: 700 }}
                        >
                          {fmtK(p.shares)}
                        </Td>
                        <Td rowIndex={i} align="right">
                          <Badge
                            color={
                              p.engRate > 5
                                ? "#10b981"
                                : p.engRate > 2
                                  ? "#f59e0b"
                                  : "#ef4444"
                            }
                          >
                            {fmtPct(p.engRate)}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
