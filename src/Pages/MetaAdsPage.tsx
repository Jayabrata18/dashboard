import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
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
import { fmt, fmtK } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetaMonthly {
  month: string;
  spent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  addToCart: number;
  checkouts: number;
  purchaseValue: number;
  video3s: number;
  frequency: number;
  roas: number;
  cpa: number;
  ctr: number;
  cvr: number;
  cpm: number;
}

interface MetaCampaign {
  campaign: string;
  spent: number;
  impressions: number;
  linkClicks: number;
  addToCart: number;
  checkouts: number;
  purchaseValue: number;
  roas: number;
  cpa: number;
  ctr: number;
  cvr: number;
}

interface MetaCreative {
  adname: string;
  adset: string;
  spent: number;
  impressions: number;
  linkClicks: number;
  checkouts: number;
  purchaseValue: number;
  ctr: number;
  roas: number;
}

interface MetaSummary {
  spent: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  addToCart: number;
  checkouts: number;
  purchaseValue: number;
  roas: number;
  cpa: number;
  ctr: number;
  cvr: number;
  cpm: number;
  atcRate: number;
}

interface MetaAdsData {
  summary: MetaSummary;
  monthly: MetaMonthly[];
  campaigns: MetaCampaign[];
  adCreatives: MetaCreative[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e2e8f0",
};

const fmtRoas = (n: number) => `${n.toFixed(2)}×`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtCur = (n: number) => fmt(n);

const ROAS_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];
function roasColor(r: number) {
  if (r >= 3) return "#10b981";
  if (r >= 2) return "#f59e0b";
  return "#ef4444";
}

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({
  msg = "No Meta Ads data yet — connect your sheet",
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

// ─────────────────────────────────────────────────────────────────────────────

export function MetaAdsPage() {
  const { state } = useDashboard();
  // Meta ads data comes from state — added to SheetApiResponse
  const meta: MetaAdsData | null = (state as any).metaAds ?? null;
  const [activeTab, setActiveTab] = useState<
    "overview" | "campaigns" | "creatives"
  >("overview");

  const summary = meta?.summary;
  const monthly = meta?.monthly ?? [];
  const campaigns = meta?.campaigns ?? [];
  const creatives = meta?.adCreatives ?? [];

  // Sort monthly chronologically
  const sortedMonthly = useMemo(() => {
    const ORDER = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return [...monthly].sort(
      (a, b) => ORDER.indexOf(a.month) - ORDER.indexOf(b.month),
    );
  }, [monthly]);

  // Frequency vs CTR scatter data
  const freqVsCtr = useMemo(
    () =>
      sortedMonthly
        .filter((m) => m.frequency > 0)
        .map((m) => ({
          month: m.month,
          frequency: m.frequency,
          ctr: m.ctr,
          cpa: m.cpa,
          spent: m.spent,
        })),
    [sortedMonthly],
  );

  // Video funnel data (latest month with video data)
  const videoMonth = useMemo(
    () => [...sortedMonthly].reverse().find((m) => m.video3s > 0),
    [sortedMonthly],
  );

  const hasData = monthly.length > 0;

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: active ? "rgba(59,130,246,0.2)" : "transparent",
    color: active ? "#60a5fa" : "#64748b",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
          }}
        >
          <KpiCard
            label="Total Ad Spend"
            value={fmtK(summary.spent)}
            color="#ef4444"
            sub="all time"
          />
          <KpiCard
            label="ROAS"
            value={fmtRoas(summary.roas)}
            color={roasColor(summary.roas)}
            sub="purchase value ÷ spend"
          />
          <KpiCard
            label="Revenue from Ads"
            value={fmtK(summary.purchaseValue)}
            color="#10b981"
            sub="purchases conversion value"
          />
          <KpiCard
            label="Cost per Purchase"
            value={fmt(summary.cpa)}
            color={
              summary.cpa < 500
                ? "#10b981"
                : summary.cpa < 1000
                  ? "#f59e0b"
                  : "#ef4444"
            }
            sub="CPA"
          />
        </div>
      )}

      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
          }}
        >
          <KpiCard
            label="Link Clicks"
            value={summary.linkClicks.toLocaleString("en-IN")}
            color="#3b82f6"
            sub="total"
          />
          <KpiCard
            label="CTR"
            value={fmtPct(summary.ctr)}
            color="#8b5cf6"
            sub="link click-through rate"
          />
          <KpiCard
            label="Conversion Rate"
            value={fmtPct(summary.cvr)}
            color="#06b6d4"
            sub="clicks → purchases"
          />
          <KpiCard
            label="Add-to-Cart Rate"
            value={fmtPct(summary.atcRate)}
            color="#f59e0b"
            sub="clicks → ATC"
          />
        </div>
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
        {(["overview", "campaigns", "creatives"] as const).map((t) => (
          <button
            key={t}
            style={tabStyle(activeTab === t)}
            onClick={() => setActiveTab(t)}
          >
            {t === "overview"
              ? "📈 Overview"
              : t === "campaigns"
                ? "🎯 Campaigns"
                : "🎨 Creatives"}
          </button>
        ))}
      </div>

      {/* ══════════════════ OVERVIEW TAB ══════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* 1. ROAS Trend */}
          <Card>
            <SectionTitle
              icon="📊"
              title="ROAS Trend"
              subtitle="Return on Ad Spend over time — scale if >2×, review if <1×"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={sortedMonthly}
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
                    yAxisId="roas"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickFormatter={(v) => `${v}×`}
                  />
                  <YAxis
                    yAxisId="spend"
                    orientation="right"
                    tickFormatter={fmtK}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) =>
                      name === "ROAS"
                        ? [`${Number(v).toFixed(2)}×`, name]
                        : [fmtK(v), name]
                    }
                    labelFormatter={(l) => `Month: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <ReferenceLine
                    yAxisId="roas"
                    y={1}
                    stroke="#ef4444"
                    strokeDasharray="4 2"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    yAxisId="roas"
                    y={2}
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeOpacity={0.5}
                  />
                  <ReferenceLine
                    yAxisId="roas"
                    y={3}
                    stroke="#10b981"
                    strokeDasharray="4 2"
                    strokeOpacity={0.4}
                  />
                  <Bar
                    yAxisId="spend"
                    dataKey="spent"
                    name="Ad Spend"
                    fill="#ef4444"
                    fillOpacity={0.35}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="roas"
                    type="monotone"
                    dataKey="roas"
                    name="ROAS"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={({ cx, cy, payload }) => (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={roasColor(payload.roas)}
                        stroke="none"
                      />
                    )}
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              {[
                { label: "< 1× Loss", color: "#ef4444" },
                { label: "1×–2× Breakeven", color: "#f59e0b" },
                { label: "> 2× Profitable", color: "#10b981" },
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

          {/* 2. Spend vs Revenue */}
          <Card>
            <SectionTitle
              icon="💰"
              title="Ad Spend vs Revenue"
              subtitle="Profitability gap — revenue should be significantly above spend"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={sortedMonthly}
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
                    tickFormatter={fmtK}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtK(v), name]}
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
                    dataKey="spent"
                    name="Ad Spend"
                    fill="#ef4444"
                    fillOpacity={0.75}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="purchaseValue"
                    name="Revenue"
                    fill="#10b981"
                    fillOpacity={0.75}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="roas"
                    name="ROAS"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                    yAxisId={undefined}
                    hide
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* 3. CPA Trend */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="🎯"
                title="Cost per Purchase (CPA) Trend"
                subtitle="Rising CPA = ad fatigue or audience saturation"
              />
              {!hasData ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={sortedMonthly.filter((m) => m.cpa > 0)}
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
                      tickFormatter={fmtK}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [fmt(v), "CPA"]}
                      labelFormatter={(l) => `Month: ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpa"
                      name="CPA"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* 5. Conversion Rate Trend */}
            <Card>
              <SectionTitle
                icon="🛒"
                title="Conversion Rate Trend"
                subtitle="Clicks → Purchases — low CVR = funnel/landing page issue"
              />
              {!hasData ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={sortedMonthly}
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
                      yAxisId="cvr"
                      unit="%"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="atc"
                      orientation="right"
                      unit="%"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) => [
                        `${Number(v).toFixed(2)}%`,
                        name,
                      ]}
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
                      yAxisId="cvr"
                      dataKey="checkouts"
                      name="Checkouts"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="cvr"
                      type="monotone"
                      dataKey="cvr"
                      name="CVR %"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="atc"
                      type="monotone"
                      dataKey="ctr"
                      name="CTR %"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* 6. Frequency vs Performance */}
          <Card>
            <SectionTitle
              icon="📣"
              title="Frequency vs CTR & CPA"
              subtitle="High frequency + falling CTR = ad fatigue — refresh creatives"
            />
            {freqVsCtr.length === 0 ? (
              <Empty msg="No frequency data" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart
                  data={freqVsCtr}
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
                    yAxisId="freq"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <YAxis
                    yAxisId="ctr"
                    orientation="right"
                    unit="%"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) =>
                      name === "Frequency"
                        ? [Number(v).toFixed(2), name]
                        : [`${Number(v).toFixed(2)}%`, name]
                    }
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
                    yAxisId="freq"
                    dataKey="frequency"
                    name="Frequency"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="ctr"
                    type="monotone"
                    dataKey="ctr"
                    name="CTR %"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Reach + Impressions + CPM */}
          <div
            style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="👥"
                title="Reach & Impressions Trend"
                subtitle="Audience size over time"
              />
              {!hasData ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={sortedMonthly}
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
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={44}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) => [
                        Number(v).toLocaleString("en-IN"),
                        name,
                      ]}
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
                      dataKey="impressions"
                      name="Impressions"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="reach"
                      name="Reach"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <SectionTitle
                icon="💸"
                title="CPM Trend"
                subtitle="Cost per 1,000 impressions"
              />
              {!hasData ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={sortedMonthly.filter((m) => m.cpm > 0)}
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
                      tickFormatter={fmt}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [fmt(v), "CPM"]}
                      labelFormatter={(l) => `Month: ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="cpm"
                      name="CPM"
                      stroke="#ec4899"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#ec4899", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </>
      )}

      {/* ══════════════════ CAMPAIGNS TAB ════════════════════════════════ */}
      {activeTab === "campaigns" && (
        <>
          {/* Campaign ROAS bar */}
          <Card>
            <SectionTitle
              icon="🎯"
              title="Campaign Performance"
              subtitle="ROAS by campaign — sorted by spend"
            />
            {campaigns.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(240, campaigns.length * 44)}
              >
                <BarChart
                  data={campaigns}
                  layout="vertical"
                  margin={{ left: 10, right: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={fmtK}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="campaign"
                    type="category"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtK(v), name]}
                    labelFormatter={(l) => `Campaign: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    dataKey="spent"
                    name="Spent"
                    fill="#ef4444"
                    fillOpacity={0.75}
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="purchaseValue"
                    name="Revenue"
                    fill="#10b981"
                    fillOpacity={0.75}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Campaign table */}
          <Card>
            <SectionTitle
              icon="📋"
              title="Campaign Deep-Dive"
              subtitle="All metrics per campaign"
            />
            {campaigns.length === 0 ? (
              <Empty />
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
                        "Campaign",
                        "Spent",
                        "Revenue",
                        "ROAS",
                        "CPA",
                        "CTR",
                        "CVR",
                        "ATC",
                        "Checkouts",
                      ].map((h) => (
                        <Th key={h} align={h === "Campaign" ? "left" : "right"}>
                          {h}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, i) => (
                      <tr key={c.campaign}>
                        <Td rowIndex={i}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#cbd5e1",
                              fontSize: 11,
                            }}
                          >
                            {c.campaign.length > 30
                              ? c.campaign.slice(0, 30) + "…"
                              : c.campaign}
                          </span>
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#f87171", fontWeight: 700 }}
                        >
                          {fmtK(c.spent)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#34d399", fontWeight: 700 }}
                        >
                          {fmtK(c.purchaseValue)}
                        </Td>
                        <Td rowIndex={i} align="right">
                          <Badge color={roasColor(c.roas)}>
                            {fmtRoas(c.roas)}
                          </Badge>
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#f1f5f9" }}
                        >
                          {fmt(c.cpa)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#94a3b8" }}
                        >
                          {fmtPct(c.ctr)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#94a3b8" }}
                        >
                          {fmtPct(c.cvr)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#94a3b8" }}
                        >
                          {c.addToCart.toLocaleString("en-IN")}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#94a3b8" }}
                        >
                          {c.checkouts.toLocaleString("en-IN")}
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

      {/* ══════════════════ CREATIVES TAB ════════════════════════════════ */}
      {activeTab === "creatives" && (
        <>
          {/* 4. CTR by Creative */}
          <Card>
            <SectionTitle
              icon="🧲"
              title="CTR by Creative (Ad)"
              subtitle="Higher CTR = better hook — top 15 ads"
            />
            {creatives.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(280, Math.min(creatives.length, 15) * 44)}
              >
                <BarChart
                  data={creatives.slice(0, 15)}
                  layout="vertical"
                  margin={{ left: 10, right: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    type="number"
                    unit="%"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="adname"
                    type="category"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={160}
                    tickFormatter={(v: string) =>
                      v.length > 22 ? v.slice(0, 22) + "…" : v
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [
                      `${Number(v).toFixed(2)}%`,
                      name,
                    ]}
                    labelFormatter={(l) => `Ad: ${l}`}
                  />
                  <Bar dataKey="ctr" name="CTR %" radius={[0, 4, 4, 0]}>
                    {creatives.slice(0, 15).map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Creative table */}
          <Card>
            <SectionTitle
              icon="📋"
              title="Creative Performance Table"
              subtitle="CTR, ROAS, spend per ad"
            />
            {creatives.length === 0 ? (
              <Empty />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 3px",
                    fontSize: 12,
                    minWidth: 600,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Ad Name",
                        "Ad Set",
                        "Spent",
                        "Revenue",
                        "ROAS",
                        "CTR",
                        "Checkouts",
                      ].map((h) => (
                        <Th
                          key={h}
                          align={
                            h === "Ad Name" || h === "Ad Set" ? "left" : "right"
                          }
                        >
                          {h}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {creatives.map((c, i) => (
                      <tr key={`${c.adname}-${i}`}>
                        <Td rowIndex={i}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#cbd5e1",
                              fontSize: 11,
                            }}
                          >
                            {c.adname.length > 28
                              ? c.adname.slice(0, 28) + "…"
                              : c.adname}
                          </span>
                        </Td>
                        <Td rowIndex={i}>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {c.adset.length > 22
                              ? c.adset.slice(0, 22) + "…"
                              : c.adset}
                          </span>
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#f87171", fontWeight: 700 }}
                        >
                          {fmtK(c.spent)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#34d399", fontWeight: 700 }}
                        >
                          {fmtK(c.purchaseValue)}
                        </Td>
                        <Td rowIndex={i} align="right">
                          <Badge color={roasColor(c.roas)}>
                            {fmtRoas(c.roas)}
                          </Badge>
                        </Td>
                        <Td rowIndex={i} align="right">
                          <span
                            style={{
                              color:
                                c.ctr > 2
                                  ? "#10b981"
                                  : c.ctr > 1
                                    ? "#f59e0b"
                                    : "#ef4444",
                              fontWeight: 700,
                            }}
                          >
                            {fmtPct(c.ctr)}
                          </span>
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#94a3b8" }}
                        >
                          {c.checkouts}
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
