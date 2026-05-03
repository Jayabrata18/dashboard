import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
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
import { fmt, fmtK } from "../utils/format";
import type { OrdersData, OrderByState } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e2e8f0",
};

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

function Empty({
  msg = "No orders data — connect your sheet",
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

function fmtNum(n: number) {
  return n.toLocaleString("en-IN");
}
function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}

// ─── India Map (reused pattern) ───────────────────────────────────────────────

const INDIA_STATES: Record<string, { path: string; cx: number; cy: number }> = {
  "Andhra Pradesh": {
    cx: 520,
    cy: 470,
    path: "M480,430 L560,430 L570,490 L490,500 Z",
  },
  "Arunachal Pradesh": {
    cx: 760,
    cy: 190,
    path: "M720,170 L800,170 L800,220 L720,220 Z",
  },
  Assam: { cx: 720, cy: 240, path: "M690,220 L760,220 L760,260 L690,260 Z" },
  Bihar: { cx: 560, cy: 270, path: "M530,250 L600,250 L600,290 L530,290 Z" },
  Chhattisgarh: {
    cx: 510,
    cy: 360,
    path: "M470,330 L550,330 L550,390 L470,390 Z",
  },
  Goa: { cx: 400, cy: 450, path: "M390,440 L415,440 L415,465 L390,465 Z" },
  Gujarat: { cx: 340, cy: 330, path: "M290,300 L390,300 L390,370 L290,370 Z" },
  Haryana: { cx: 400, cy: 210, path: "M370,195 L435,195 L435,230 L370,230 Z" },
  "Himachal Pradesh": {
    cx: 420,
    cy: 165,
    path: "M395,150 L450,150 L450,185 L395,185 Z",
  },
  Jharkhand: {
    cx: 570,
    cy: 320,
    path: "M540,300 L610,300 L610,345 L540,345 Z",
  },
  Karnataka: {
    cx: 440,
    cy: 470,
    path: "M400,440 L490,440 L490,510 L400,510 Z",
  },
  Kerala: { cx: 430, cy: 540, path: "M415,510 L460,510 L450,580 L415,580 Z" },
  "Madhya Pradesh": {
    cx: 460,
    cy: 310,
    path: "M400,280 L530,280 L530,350 L400,350 Z",
  },
  Maharashtra: {
    cx: 430,
    cy: 400,
    path: "M370,370 L510,370 L510,440 L370,440 Z",
  },
  Manipur: { cx: 760, cy: 285, path: "M745,270 L780,270 L780,305 L745,305 Z" },
  Meghalaya: {
    cx: 700,
    cy: 265,
    path: "M680,252 L725,252 L725,278 L680,278 Z",
  },
  Mizoram: { cx: 750, cy: 320, path: "M735,305 L770,305 L770,340 L735,340 Z" },
  Nagaland: { cx: 770, cy: 255, path: "M755,240 L790,240 L790,270 L755,270 Z" },
  Odisha: { cx: 560, cy: 390, path: "M520,360 L600,360 L600,420 L520,420 Z" },
  Punjab: { cx: 380, cy: 185, path: "M355,168 L415,168 L415,205 L355,205 Z" },
  Rajasthan: {
    cx: 370,
    cy: 265,
    path: "M300,220 L450,220 L450,315 L300,315 Z",
  },
  Sikkim: { cx: 660, cy: 225, path: "M648,215 L675,215 L675,238 L648,238 Z" },
  "Tamil Nadu": {
    cx: 470,
    cy: 530,
    path: "M430,500 L520,500 L505,570 L445,570 Z",
  },
  Telangana: {
    cx: 490,
    cy: 430,
    path: "M455,405 L535,405 L535,460 L455,460 Z",
  },
  Tripura: { cx: 735, cy: 305, path: "M720,292 L750,292 L750,320 L720,320 Z" },
  "Uttar Pradesh": {
    cx: 490,
    cy: 235,
    path: "M430,210 L565,210 L565,265 L430,265 Z",
  },
  Uttarakhand: {
    cx: 440,
    cy: 190,
    path: "M410,175 L475,175 L475,208 L410,208 Z",
  },
  "West Bengal": {
    cx: 625,
    cy: 310,
    path: "M600,265 L655,265 L660,360 L600,360 Z",
  },
  Delhi: { cx: 415, cy: 215, path: "M408,208 L425,208 L425,224 L408,224 Z" },
  "Jammu and Kashmir": {
    cx: 390,
    cy: 130,
    path: "M355,105 L435,105 L435,160 L355,160 Z",
  },
  Ladakh: { cx: 450, cy: 110, path: "M435,90 L510,90 L510,140 L435,140 Z" },
};

function IndiaOrderMap({ byState }: { byState: OrderByState[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const stateMap = useMemo(() => {
    const m: Record<string, OrderByState> = {};
    byState.forEach((s) => {
      m[s.state] = s;
    });
    return m;
  }, [byState]);

  const maxOrders = useMemo(
    () => Math.max(...byState.map((s) => s.orders), 1),
    [byState],
  );

  function getColor(name: string) {
    const d = stateMap[name];
    if (!d || d.orders === 0) return "rgba(255,255,255,0.04)";
    const t = d.orders / maxOrders;
    if (t > 0.7) return "#1d4ed8";
    if (t > 0.4) return "#3b82f6";
    if (t > 0.2) return "#60a5fa";
    if (t > 0.05) return "#93c5fd";
    return "#dbeafe";
  }

  const hd = hovered ? stateMap[hovered] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 900 650" style={{ width: "100%", maxHeight: 520 }}>
        <rect
          x="1"
          y="1"
          width="898"
          height="648"
          rx="12"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
        {Object.entries(INDIA_STATES).map(([name, { path, cx, cy }]) => {
          const d = stateMap[name];
          const col = getColor(name);
          const isH = hovered === name;
          return (
            <g
              key={name}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={path}
                fill={col}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={isH ? 1.5 : 0.8}
                opacity={isH ? 1 : 0.9}
              />
              {d?.orders ? (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={d.orders > 10 ? 9 : 7}
                  fill="#f1f5f9"
                  fontWeight="700"
                  pointerEvents="none"
                >
                  {fmtNum(d.orders)}
                </text>
              ) : null}
            </g>
          );
        })}
        <g transform="translate(20,560)">
          <text fontSize="9" fill="#475569" y="0">
            Orders
          </text>
          {["#dbeafe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"].map(
            (c, i) => (
              <g key={i} transform={`translate(${i * 30},8)`}>
                <rect width="24" height="12" rx="2" fill={c} />
                {i === 0 && (
                  <text x="0" y="22" fontSize="8" fill="#475569">
                    Low
                  </text>
                )}
                {i === 4 && (
                  <text x="0" y="22" fontSize="8" fill="#475569">
                    High
                  </text>
                )}
              </g>
            ),
          )}
        </g>
      </svg>
      {hd && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 12,
            minWidth: 180,
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
            {hd.state}
          </div>
          {[
            { label: "Orders", value: fmtNum(hd.orders) },
            { label: "Revenue", value: fmtK(hd.revenue) },
            { label: "Customers", value: fmtNum(hd.customers) },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                padding: "3px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: "#64748b" }}>{item.label}</span>
              <span
                style={{
                  color: "#f1f5f9",
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { state } = useDashboard();
  const ord = (state as any).orders as OrdersData | null;
  const [activeTab, setActiveTab] = useState<
    "overview" | "quality" | "fulfillment" | "location"
  >("overview");

  const summary = ord?.summary;
  const daily = ord?.daily ?? [];
  const monthly = ord?.monthly ?? [];
  const byStatus = ord?.byStatus ?? [];
  const byCity = ord?.byCity ?? [];
  const byState = ord?.byState ?? [];
  const revDist = ord?.revenueDistribution ?? [];
  const hourly = ord?.hourly ?? [];
  const weekday = ord?.weekday ?? [];
  const ftDist = ord?.fulfillmentDistribution ?? [];
  const hasData = daily.length > 0;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: active ? "rgba(59,130,246,0.18)" : "transparent",
    color: active ? "#60a5fa" : "#64748b",
    transition: "all 0.15s",
  });

  // Peak hour
  const peakHour = useMemo(
    () =>
      hourly.reduce(
        (best, h) => (h.orders > best.orders ? h : best),
        hourly[0] ?? { label: "—", orders: 0 },
      ),
    [hourly],
  );

  // Peak day
  const peakDay = useMemo(
    () =>
      weekday.reduce(
        (best, d) => (d.orders > best.orders ? d : best),
        weekday[0] ?? { day: "—", orders: 0 },
      ),
    [weekday],
  );

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
              label="Total Orders"
              value={fmtNum(summary.totalOrders)}
              color="#3b82f6"
              sub="last 30 days"
            />
            <KpiCard
              label="Total Revenue"
              value={fmtK(summary.totalRevenue)}
              color="#10b981"
              sub="last 30 days"
            />
            <KpiCard
              label="Avg Order Value"
              value={fmt(summary.aov)}
              color="#f59e0b"
              sub="per order"
            />
            <KpiCard
              label="Items per Order"
              value={`${summary.avgItemsPerOrder}`}
              color="#8b5cf6"
              sub="avg units"
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
              label="Fulfillment Rate"
              value={fmtPct(summary.fulfillmentRate)}
              color={
                summary.fulfillmentRate > 80
                  ? "#10b981"
                  : summary.fulfillmentRate > 60
                    ? "#f59e0b"
                    : "#ef4444"
              }
              sub="% fulfilled"
            />
            <KpiCard
              label="Cancellation Rate"
              value={fmtPct(summary.cancellationRate)}
              color={
                summary.cancellationRate < 5
                  ? "#10b981"
                  : summary.cancellationRate < 10
                    ? "#f59e0b"
                    : "#ef4444"
              }
              sub="% cancelled"
            />
            <KpiCard
              label="Return Rate"
              value={fmtPct(summary.returnRate)}
              color={
                summary.returnRate < 3
                  ? "#10b981"
                  : summary.returnRate < 8
                    ? "#f59e0b"
                    : "#ef4444"
              }
              sub="% returned"
            />
            <KpiCard
              label="Avg Fulfillment Time"
              value={
                summary.avgFulfillmentHours > 0
                  ? `${(summary.avgFulfillmentHours / 24).toFixed(1)}d`
                  : "N/A"
              }
              color="#06b6d4"
              sub="order to close"
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
        {(["overview", "quality", "fulfillment", "location"] as const).map(
          (t) => (
            <button
              key={t}
              style={tabStyle(activeTab === t)}
              onClick={() => setActiveTab(t)}
            >
              {t === "overview"
                ? "🛒 Overview"
                : t === "quality"
                  ? "📦 Quality"
                  : t === "fulfillment"
                    ? "🚚 Fulfillment"
                    : "📍 Location"}
            </button>
          ),
        )}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* 1. Orders over time */}
          <Card>
            <SectionTitle
              icon="📈"
              title="Orders Over Time"
              subtitle="Daily orders & revenue — demand trend"
            />
            {!hasData ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart
                  data={daily}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="orders"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <YAxis
                    yAxisId="revenue"
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
                      name === "Revenue" ? [fmtK(v), name] : [fmtNum(v), name]
                    }
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
                    yAxisId="orders"
                    dataKey="orders"
                    name="Orders"
                    fill="#3b82f6"
                    fillOpacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* 2. AOV + 3. Status */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="💰"
                title="AOV Trend"
                subtitle="Avg order value per day"
              />
              {!hasData ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={daily}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 10 }}
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
                      formatter={(v: any) => [fmt(v), "AOV"]}
                      labelFormatter={(l) => `Date: ${l}`}
                    />
                    <ReferenceLine
                      y={summary?.aov ?? 0}
                      stroke="#f59e0b"
                      strokeDasharray="4 2"
                      strokeOpacity={0.6}
                    />
                    <Line
                      type="monotone"
                      dataKey="aov"
                      name="AOV"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <SectionTitle
                icon="🥧"
                title="Orders by Status"
                subtitle="Operational health snapshot"
              />
              {byStatus.length === 0 ? (
                <Empty />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={byStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={35}
                        paddingAngle={3}
                      >
                        {byStatus.map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [fmtNum(v), "Orders"]}
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
                    {byStatus.map((s) => (
                      <div
                        key={s.status}
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
                            background: s.color,
                            display: "inline-block",
                          }}
                        />
                        {s.status} ({s.count})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* 12. Revenue distribution */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="💸"
                title="Revenue per Order Distribution"
                subtitle="Order value buckets — where your orders cluster"
              />
              {revDist.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={revDist}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) => [fmtNum(v), name]}
                      labelFormatter={(l) => `Range: ${l}`}
                    />
                    <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
                      {revDist.map((_, i) => (
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

            {/* 14. Peak order time */}
            <Card>
              <SectionTitle
                icon="⏰"
                title="Peak Order Time"
                subtitle="Best hours to run campaigns & flash sales"
              />
              {hourly.length === 0 ? (
                <Empty />
              ) : (
                <>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        background: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: 8,
                        padding: "8px 12px",
                        flex: 1,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 10, color: "#475569" }}>
                        Peak Hour
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#60a5fa",
                          fontFamily: "monospace",
                        }}
                      >
                        {peakHour.label}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        {peakHour.orders} orders
                      </div>
                    </div>
                    <div
                      style={{
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: 8,
                        padding: "8px 12px",
                        flex: 1,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 10, color: "#475569" }}>
                        Peak Day
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#34d399",
                          fontFamily: "monospace",
                        }}
                      >
                        {peakDay.day}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        {peakDay.orders} orders
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart
                      data={hourly}
                      margin={{ top: 0, right: 4, bottom: 0, left: 0 }}
                    >
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 8 }}
                        axisLine={false}
                        tickLine={false}
                        interval={3}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [fmtNum(v), "Orders"]}
                        labelFormatter={(l) => `Time: ${l}`}
                      />
                      <Bar dataKey="orders" name="Orders" radius={[3, 3, 0, 0]}>
                        {hourly.map((h, i) => (
                          <Cell
                            key={i}
                            fill={
                              h.orders === peakHour.orders
                                ? "#3b82f6"
                                : "rgba(59,130,246,0.3)"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </Card>
          </div>

          {/* Weekday pattern */}
          <Card>
            <SectionTitle
              icon="📅"
              title="Orders by Day of Week"
              subtitle="Best days to launch drops & promotions"
            />
            {weekday.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart
                  data={weekday}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="orders"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <YAxis
                    yAxisId="aov"
                    orientation="right"
                    tickFormatter={fmt}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) =>
                      name === "AOV" ? [fmt(v), name] : [fmtNum(v), name]
                    }
                    labelFormatter={(l) => `Day: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    yAxisId="orders"
                    dataKey="orders"
                    name="Orders"
                    radius={[6, 6, 0, 0]}
                  >
                    {weekday.map((d, i) => (
                      <Cell
                        key={i}
                        fill={
                          d.orders === peakDay.orders
                            ? "#3b82f6"
                            : "rgba(59,130,246,0.4)"
                        }
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="aov"
                    type="monotone"
                    dataKey="aov"
                    name="AOV"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}

      {/* ══════════════ QUALITY TAB ═══════════════════════════════════════ */}
      {activeTab === "quality" && (
        <>
          {/* 5. Cancellation Rate + 6. Return Rate */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="❌"
                title="Cancellation Rate Trend"
                subtitle="High = trust or logistics issue"
              />
              {daily.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <ComposedChart
                    data={daily.filter((d) => d.orders > 0)}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="pct"
                      unit="%"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="count"
                      orientation="right"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) =>
                        name === "Cancel %"
                          ? [`${Number(v).toFixed(1)}%`, name]
                          : [fmtNum(v), name]
                      }
                      labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        color: "#64748b",
                        paddingTop: 8,
                      }}
                    />
                    <ReferenceLine
                      yAxisId="pct"
                      y={5}
                      stroke="#f59e0b"
                      strokeDasharray="4 2"
                      strokeOpacity={0.5}
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="cancelled"
                      name="Cancelled"
                      fill="#ef4444"
                      fillOpacity={0.5}
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="pct"
                      type="monotone"
                      dataKey="cancellationRate"
                      name="Cancel %"
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Status detail */}
            <Card>
              <SectionTitle
                icon="📋"
                title="Order Status Breakdown"
                subtitle="Detailed count & revenue per status"
              />
              {byStatus.length === 0 ? (
                <Empty />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {byStatus.map((s) => (
                    <div
                      key={s.status}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: s.color,
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>
                          {s.status}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {fmtPct(s.pct)}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: s.color,
                            fontFamily: "monospace",
                            minWidth: 40,
                            textAlign: "right",
                          }}
                        >
                          {fmtNum(s.count)}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#475569",
                            fontFamily: "monospace",
                            minWidth: 60,
                            textAlign: "right",
                          }}
                        >
                          {fmtK(s.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Revenue dist + return rate note */}
          <Card>
            <SectionTitle
              icon="📊"
              title="Quality Health Summary"
              subtitle="Key order quality indicators"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 12,
              }}
            >
              {[
                {
                  label: "Cancellation Rate",
                  value: fmtPct(summary?.cancellationRate ?? 0),
                  color:
                    (summary?.cancellationRate ?? 0) < 5
                      ? "#10b981"
                      : (summary?.cancellationRate ?? 0) < 10
                        ? "#f59e0b"
                        : "#ef4444",
                  hint: "< 5% = healthy",
                  count: summary?.cancelledOrders ?? 0,
                },
                {
                  label: "Return Rate",
                  value: fmtPct(summary?.returnRate ?? 0),
                  color:
                    (summary?.returnRate ?? 0) < 3
                      ? "#10b981"
                      : (summary?.returnRate ?? 0) < 8
                        ? "#f59e0b"
                        : "#ef4444",
                  hint: "< 3% = good for fashion",
                  count: summary?.returnedOrders ?? 0,
                },
                {
                  label: "Fulfillment Rate",
                  value: fmtPct(summary?.fulfillmentRate ?? 0),
                  color:
                    (summary?.fulfillmentRate ?? 0) > 80
                      ? "#10b981"
                      : (summary?.fulfillmentRate ?? 0) > 60
                        ? "#f59e0b"
                        : "#ef4444",
                  hint: "> 80% = healthy",
                  count: summary?.fulfilledOrders ?? 0,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${item.color}33`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#475569",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: item.color,
                      fontFamily: "monospace",
                      marginBottom: 4,
                    }}
                  >
                    {item.value}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>
                    {fmtNum(item.count)} orders · {item.hint}
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                      marginTop: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(parseFloat(item.value), 100)}%`,
                        background: item.color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ══════════════ FULFILLMENT TAB ═══════════════════════════════════ */}
      {activeTab === "fulfillment" && (
        <>
          {/* Fulfillment time distribution */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="🚚"
                title="Fulfillment Time Distribution"
                subtitle="Order to close — faster = happier customers"
              />
              {ftDist.length === 0 || ftDist.every((f) => f.count === 0) ? (
                <Empty msg="No fulfillment time data — closed orders needed" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={ftDist}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="range"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) => [fmtNum(v), name]}
                      labelFormatter={(l) => `Time: ${l}`}
                    />
                    <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]}>
                      {ftDist.map((f, i) => (
                        <Cell
                          key={i}
                          fill={
                            f.range === "< 24h"
                              ? "#10b981"
                              : f.range === "1–2 days"
                                ? "#3b82f6"
                                : f.range === "2–3 days"
                                  ? "#f59e0b"
                                  : f.range === "3–5 days"
                                    ? "#f97316"
                                    : "#ef4444"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <SectionTitle
                icon="⏱"
                title="Fulfillment KPIs"
                subtitle="Operational speed metrics"
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                {[
                  {
                    label: "Avg Fulfillment Time",
                    value: summary?.avgFulfillmentHours
                      ? `${(summary.avgFulfillmentHours / 24).toFixed(1)} days`
                      : "N/A",
                    color: "#06b6d4",
                    hint: "from order creation to close",
                  },
                  {
                    label: "Fulfilled Orders",
                    value: fmtNum(summary?.fulfilledOrders ?? 0),
                    color: "#10b981",
                    hint: fmtPct(summary?.fulfillmentRate ?? 0) + " of total",
                  },
                  {
                    label: "Pending / Processing",
                    value: fmtNum(
                      (summary?.totalOrders ?? 0) -
                        (summary?.fulfilledOrders ?? 0) -
                        (summary?.cancelledOrders ?? 0),
                    ),
                    color: "#f59e0b",
                    hint: "awaiting fulfillment",
                  },
                  {
                    label: "Cancelled Orders",
                    value: fmtNum(summary?.cancelledOrders ?? 0),
                    color: "#ef4444",
                    hint:
                      fmtPct(summary?.cancellationRate ?? 0) +
                      " cancellation rate",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${item.color}22`,
                      borderRadius: 10,
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: item.color,
                          fontFamily: "monospace",
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#475569", marginTop: 4 }}
                    >
                      {item.hint}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Daily fulfilled vs cancelled */}
          <Card>
            <SectionTitle
              icon="📦"
              title="Daily Fulfilled vs Cancelled"
              subtitle="Operational consistency over time"
            />
            {daily.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={daily}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
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
                    dataKey="fulfilled"
                    name="Fulfilled"
                    fill="#10b981"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    fill="#ef4444"
                    fillOpacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}

      {/* ══════════════ LOCATION TAB ══════════════════════════════════════ */}
      {activeTab === "location" && (
        <>
          <Card>
            <SectionTitle
              icon="🗺️"
              title="Orders by State — India Map"
              subtitle="Hover to see orders, revenue & customers per state"
            />
            <IndiaOrderMap byState={byState} />
          </Card>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* State bar chart */}
            <Card>
              <SectionTitle
                icon="📊"
                title="Top States by Orders"
                subtitle="Where your buyers are shipping to"
              />
              {byState.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(220, Math.min(byState.length, 15) * 36)}
                >
                  <BarChart
                    data={byState.slice(0, 15)}
                    layout="vertical"
                    margin={{ left: 10, right: 60 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="state"
                      type="category"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={130}
                      tickFormatter={(v: string) =>
                        v.length > 18 ? v.slice(0, 18) + "…" : v
                      }
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) =>
                        name === "Revenue" ? [fmtK(v), name] : [fmtNum(v), name]
                      }
                      labelFormatter={(l) => `State: ${l}`}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        color: "#64748b",
                        paddingTop: 8,
                      }}
                    />
                    <Bar
                      dataKey="orders"
                      name="Orders"
                      fill="#3b82f6"
                      fillOpacity={0.8}
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#10b981"
                      fillOpacity={0.6}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Top cities table */}
            <Card>
              <SectionTitle
                icon="🏙️"
                title="Top Cities by Orders"
                subtitle="City-level shipping demand"
              />
              {byCity.length === 0 ? (
                <Empty />
              ) : (
                <div style={{ overflowY: "auto", maxHeight: 400 }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0 3px",
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr>
                        {["City", "State", "Orders", "Revenue"].map((h) => (
                          <Th
                            key={h}
                            align={
                              h === "City" || h === "State" ? "left" : "right"
                            }
                          >
                            {h}
                          </Th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {byCity.slice(0, 25).map((c, i) => (
                        <tr key={c.city}>
                          <Td rowIndex={i}>
                            <span
                              style={{
                                fontWeight: 700,
                                color: "#cbd5e1",
                                fontSize: 11,
                              }}
                            >
                              {c.city}
                            </span>
                          </Td>
                          <Td rowIndex={i}>
                            <span style={{ fontSize: 10, color: "#64748b" }}>
                              {c.state}
                            </span>
                          </Td>
                          <Td
                            rowIndex={i}
                            align="right"
                            style={{ color: "#60a5fa", fontWeight: 700 }}
                          >
                            {fmtNum(c.orders)}
                          </Td>
                          <Td
                            rowIndex={i}
                            align="right"
                            style={{
                              color: "#10b981",
                              fontWeight: 700,
                              fontFamily: "monospace",
                            }}
                          >
                            {fmtK(c.revenue)}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
