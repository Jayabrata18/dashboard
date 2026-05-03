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
import type {
  CustomerData,
  CustomerMonthly,
  CustomerSegment,
  CustomerByState,
  CustomerCohort,
} from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e2e8f0",
};

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

function Empty({
  msg = "No customer data — connect your sheet",
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

// ─── India Map Component ──────────────────────────────────────────────────────

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

function IndiaMap({ byState }: { byState: CustomerByState[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const stateDataMap = useMemo(() => {
    const m: Record<string, CustomerByState> = {};
    byState.forEach((s) => {
      m[s.state] = s;
    });
    return m;
  }, [byState]);

  const maxOrders = useMemo(
    () => Math.max(...byState.map((s) => s.orders), 1),
    [byState],
  );

  function getColor(stateName: string) {
    const d = stateDataMap[stateName];
    if (!d || d.orders === 0) return "rgba(255,255,255,0.04)";
    const intensity = d.orders / maxOrders;
    if (intensity > 0.7) return "#1d4ed8";
    if (intensity > 0.4) return "#3b82f6";
    if (intensity > 0.2) return "#60a5fa";
    if (intensity > 0.05) return "#93c5fd";
    return "#dbeafe";
  }

  const hoveredData = hovered ? stateDataMap[hovered] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox="0 0 900 650"
        style={{ width: "100%", maxHeight: 520 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer border hint */}
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
          const d = stateDataMap[name];
          const col = getColor(name);
          const isHov = hovered === name;
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
                strokeWidth={isHov ? 1.5 : 0.8}
                opacity={isHov ? 1 : 0.9}
              />
              {/* State label */}
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={d?.orders ? (d.orders > 10 ? 9 : 7) : 6}
                fill={col === "rgba(255,255,255,0.04)" ? "#475569" : "#f1f5f9"}
                fontWeight={d?.orders ? "700" : "400"}
                pointerEvents="none"
              >
                {d?.orders ? fmtNum(d.orders) : ""}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform="translate(20, 560)">
          <text fontSize="9" fill="#475569" y="0">
            Orders
          </text>
          {[
            { color: "#dbeafe", label: "Low" },
            { color: "#93c5fd", label: "" },
            { color: "#60a5fa", label: "" },
            { color: "#3b82f6", label: "" },
            { color: "#1d4ed8", label: "High" },
          ].map((b, i) => (
            <g key={i} transform={`translate(${i * 30}, 8)`}>
              <rect width="24" height="12" rx="2" fill={b.color} />
              {b.label && (
                <text x="0" y="22" fontSize="8" fill="#475569">
                  {b.label}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* Hover tooltip */}
      {hoveredData && (
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
            {hoveredData.state}
          </div>
          {[
            { label: "Orders", value: fmtNum(hoveredData.orders) },
            { label: "Customers", value: fmtNum(hoveredData.customers) },
            { label: "Revenue", value: fmtK(hoveredData.revenue) },
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

      {/* No data state overlay */}
      {byState.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(10,15,30,0.7)",
            borderRadius: 12,
            fontSize: 12,
            color: "#475569",
          }}
        >
          No location data available
        </div>
      )}
    </div>
  );
}

// ─── Cohort Heatmap ───────────────────────────────────────────────────────────

function CohortHeatmap({ cohort }: { cohort: CustomerCohort[] }) {
  if (!cohort.length) return <Empty msg="No cohort data" />;

  const maxPct = Math.max(...cohort.map((c) => c.retentionPct), 1);

  function retentionColor(pct: number) {
    const intensity = pct / 100;
    if (intensity > 0.5) return `rgba(16,185,129,${0.3 + intensity * 0.6})`;
    if (intensity > 0.2) return `rgba(245,158,11,${0.3 + intensity * 0.5})`;
    return `rgba(239,68,68,${0.2 + intensity * 0.4})`;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 3,
          fontSize: 11,
        }}
      >
        <thead>
          <tr>
            {[
              "Cohort Month",
              "Total",
              "1 Order",
              "2 Orders",
              "3+ Orders",
              "Retention %",
              "Avg LTV",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "6px 10px",
                  color: "#475569",
                  fontWeight: 700,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  textAlign: h === "Cohort Month" ? "left" : "right",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohort.map((c, i) => (
            <tr key={c.month}>
              <td
                style={{
                  padding: "8px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  background:
                    i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                }}
              >
                {c.month}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  color: "#f1f5f9",
                  fontWeight: 700,
                  background:
                    i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                }}
              >
                {fmtNum(c.total)}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  color: "#64748b",
                  background:
                    i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                }}
              >
                {fmtNum(c.oneOrder)}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  color: "#64748b",
                  background:
                    i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                }}
              >
                {fmtNum(c.twoOrders)}
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  color: "#f59e0b",
                  fontWeight: 700,
                  background:
                    i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                }}
              >
                {fmtNum(c.threeplus)}
              </td>
              <td
                style={{
                  padding: "6px 10px",
                  textAlign: "right",
                  background: retentionColor(c.retentionPct),
                }}
              >
                <span style={{ fontWeight: 700, color: "#f1f5f9" }}>
                  {fmtPct(c.retentionPct)}
                </span>
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  color: "#10b981",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  background:
                    i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                }}
              >
                {fmtK(c.avgLTV)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CustomerPage() {
  const { state } = useDashboard();
  const cust = (state as any).customers as CustomerData | null;
  console.log("SOURCE 2 SYNC STATUS:", state.syncStatus2);
  console.log("CUSTOMERS RAW:", state.customers);
  const [activeTab, setActiveTab] = useState<
    "overview" | "segments" | "location" | "retention"
  >("overview");

  const summary = cust?.summary;
  const monthly = cust?.monthly ?? [];
  const byState = cust?.byState ?? [];
  const byCity = cust?.byCity ?? [];
  const orderFreq = cust?.orderFrequency ?? [];
  const segments = cust?.segments ?? [];
  const cohort = cust?.cohort ?? [];
  const top20 = cust?.top20 ?? [];
  const avgDaysBtw = cust?.avgDaysBetweenPurchases ?? 0;
  const hasData = monthly.length > 0;

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

  // Pareto data
  const paretoData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        label: "Top 20% customers",
        revenue: summary.top20Revenue,
        pct: summary.top20Pct,
        color: "#f59e0b",
      },
      {
        label: "Bottom 80% customers",
        revenue: summary.totalRevenue - summary.top20Revenue,
        pct: 100 - summary.top20Pct,
        color: "#3b82f6",
      },
    ];
  }, [summary]);

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
              label="Total Customers"
              value={fmtNum(summary.totalCustomers)}
              color="#3b82f6"
              sub="all time"
            />
            <KpiCard
              label="Repeat Rate"
              value={fmtPct(summary.repeatRate)}
              color={
                summary.repeatRate > 30
                  ? "#10b981"
                  : summary.repeatRate > 15
                    ? "#f59e0b"
                    : "#ef4444"
              }
              sub="% buying again"
            />
            <KpiCard
              label="Avg LTV"
              value={fmtK(summary.avgLTV)}
              color="#10b981"
              sub="per customer"
            />
            <KpiCard
              label="Avg Order Value"
              value={fmt(summary.avgAOV)}
              color="#f59e0b"
              sub="per order"
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
              label="VIP Customers"
              value={fmtNum(summary.vipCustomers)}
              color="#f59e0b"
              sub="5+ orders"
            />
            <KpiCard
              label="Churn Rate"
              value={fmtPct(summary.churnRate)}
              color={
                summary.churnRate < 20
                  ? "#10b981"
                  : summary.churnRate < 40
                    ? "#f59e0b"
                    : "#ef4444"
              }
              sub="120+ days inactive"
            />
            <KpiCard
              label="Top 20% Revenue"
              value={fmtPct(summary.top20Pct)}
              color="#8b5cf6"
              sub="Pareto concentration"
            />
            <KpiCard
              label="Avg Days to Conv"
              value={`${summary.avgDaysToConv}d`}
              color="#06b6d4"
              sub="first visit to purchase"
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
        {(["overview", "segments", "location", "retention"] as const).map(
          (t) => (
            <button
              key={t}
              style={tabStyle(activeTab === t)}
              onClick={() => setActiveTab(t)}
            >
              {t === "overview"
                ? "📈 Overview"
                : t === "segments"
                  ? "👥 Segments"
                  : t === "location"
                    ? "📍 Location"
                    : "🔄 Retention"}
            </button>
          ),
        )}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* 2. Customer Growth */}
          <Card>
            <SectionTitle
              icon="📈"
              title="Customer Growth"
              subtitle="New customers acquired + cumulative total"
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
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="new"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <YAxis
                    yAxisId="cum"
                    orientation="right"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
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
                    yAxisId="new"
                    dataKey="newCustomers"
                    name="New Customers"
                    fill="#3b82f6"
                    fillOpacity={0.7}
                    radius={[4, 4, 0, 0]}
                  />
                  <Area
                    yAxisId="cum"
                    type="monotone"
                    dataKey="cumTotal"
                    name="Total Customers"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#custGrad)"
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* 3. LTV + Repeat Rate */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="💰"
                title="Customer LTV Trend"
                subtitle="Revenue per customer acquired each month"
              />
              {!hasData ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={monthly.filter((m) => m.ltv > 0)}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#64748b", fontSize: 10 }}
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
                      formatter={(v: any) => [fmtK(v), "Avg LTV"]}
                      labelFormatter={(l) => `Month: ${l}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="ltv"
                      name="Avg LTV"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* 1. New vs Returning */}
            <Card>
              <SectionTitle
                icon="❤️"
                title="New vs Returning vs VIP"
                subtitle="Loyalty breakdown — build more VIPs"
              />
              {segments.length === 0 ? (
                <Empty />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={segments}
                        dataKey="count"
                        nameKey="segment"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={35}
                        paddingAngle={3}
                      >
                        {segments.map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [fmtNum(v), "Customers"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      justifyContent: "center",
                      marginTop: 8,
                    }}
                  >
                    {segments.map((s) => (
                      <div key={s.segment} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: s.color,
                            fontFamily: "monospace",
                          }}
                        >
                          {fmtNum(s.count)}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>
                          {s.segment}
                        </div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          {fmtPct(s.pct)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* 5. Orders per Customer */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="🛒"
                title="Orders per Customer"
                subtitle="Loyalty depth — more 3+ order customers = healthier brand"
              />
              {orderFreq.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={orderFreq}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="orders"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "# of Orders",
                        position: "insideBottom",
                        offset: -4,
                        fill: "#475569",
                        fontSize: 10,
                      }}
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
                      labelFormatter={(l) => `${l} order(s)`}
                    />
                    <Bar dataKey="count" name="Customers" radius={[6, 6, 0, 0]}>
                      {orderFreq.map((_, i) => (
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

            {/* 8. Purchase Frequency */}
            <Card>
              <SectionTitle
                icon="⏱"
                title="Purchase Timing"
                subtitle="Avg days between purchases — use for retargeting timing"
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 16,
                }}
              >
                {[
                  {
                    label: "Avg Days Between Purchases",
                    value: `${avgDaysBtw} days`,
                    color: "#3b82f6",
                    hint:
                      avgDaysBtw < 45
                        ? "Frequent buyers ✓"
                        : avgDaysBtw < 90
                          ? "Monthly buyers"
                          : "Seasonal buyers",
                  },
                  {
                    label: "Repeat Purchase Rate",
                    value: fmtPct(summary?.repeatRate ?? 0),
                    color:
                      (summary?.repeatRate ?? 0) > 30 ? "#10b981" : "#f59e0b",
                    hint: "% of customers who bought 2+ times",
                  },
                  {
                    label: "Avg Days to First Purchase",
                    value: `${summary?.avgDaysToConv ?? 0} days`,
                    color: "#8b5cf6",
                    hint: "From first visit to conversion",
                  },
                  {
                    label: "Avg Orders per Customer",
                    value: `${summary?.avgOrders ?? 0}`,
                    color: "#f59e0b",
                    hint: "> 2 is healthy for fashion brands",
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
        </>
      )}

      {/* ══════════════ SEGMENTS TAB ══════════════════════════════════════ */}
      {activeTab === "segments" && (
        <>
          {/* 6. Revenue by Segment */}
          <Card>
            <SectionTitle
              icon="💸"
              title="Revenue by Customer Segment"
              subtitle="New vs Returning vs VIP — who drives your money?"
            />
            {segments.length === 0 ? (
              <Empty />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 16,
                }}
              >
                {segments.map((s) => (
                  <div
                    key={s.segment}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${s.color}33`,
                      borderRadius: 12,
                      padding: "18px 20px",
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
                      {s.segment} Customers
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: s.color,
                        fontFamily: "monospace",
                        marginBottom: 4,
                      }}
                    >
                      {fmtK(s.revenue)}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          Count
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#f1f5f9",
                          }}
                        >
                          {fmtNum(s.count)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          Avg LTV
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#f1f5f9",
                          }}
                        >
                          {fmtK(s.avgLTV)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          Share
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#f1f5f9",
                          }}
                        >
                          {fmtPct(s.pct)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 2,
                        marginTop: 12,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${s.pct}%`,
                          background: s.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 7. Pareto */}
          <Card>
            <SectionTitle
              icon="📊"
              title="Pareto: Top 20% Customer Revenue"
              subtitle="Usually 80% of revenue from 20% of customers"
            />
            {paretoData.length === 0 ? (
              <Empty />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 24,
                  alignItems: "center",
                }}
              >
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={paretoData}
                      dataKey="revenue"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={4}
                    >
                      {paretoData.map((p, i) => (
                        <Cell key={i} fill={p.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => [fmtK(v), "Revenue"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {paretoData.map((p) => (
                    <div
                      key={p.label}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${p.color}33`,
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#475569",
                          marginBottom: 6,
                        }}
                      >
                        {p.label}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: p.color,
                          fontFamily: "monospace",
                        }}
                      >
                        {fmtK(p.revenue)}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}
                      >
                        {fmtPct(p.pct)} of total revenue
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Top 20 customers table */}
          <Card>
            <SectionTitle
              icon="⭐"
              title="Top 20 Customers by Revenue"
              subtitle="Protect these — they drive your brand"
            />
            {top20.length === 0 ? (
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
                        "#",
                        "Customer",
                        "City",
                        "Orders",
                        "Total Spent",
                        "Segment",
                        "Last Active",
                      ].map((h) => (
                        <Th
                          key={h}
                          align={
                            h === "Customer" || h === "City" || h === "Segment"
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
                    {top20.map((c: any, i: number) => (
                      <tr key={i}>
                        <Td rowIndex={i}>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#475569",
                              fontFamily: "monospace",
                            }}
                          >
                            {i + 1}
                          </span>
                        </Td>
                        <Td rowIndex={i}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#cbd5e1",
                              fontSize: 11,
                            }}
                          >
                            {c.displayName || "—"}
                          </span>
                        </Td>
                        <Td rowIndex={i}>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {c.city || "—"}
                          </span>
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#f1f5f9", fontWeight: 700 }}
                        >
                          {c.numOrders}
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
                          {fmtK(c.amountSpent)}
                        </Td>
                        <Td rowIndex={i}>
                          <Badge
                            color={
                              c.segment === "VIP"
                                ? "#f59e0b"
                                : c.segment === "Returning"
                                  ? "#3b82f6"
                                  : "#10b981"
                            }
                          >
                            {c.segment}
                          </Badge>
                        </Td>
                        <Td rowIndex={i} align="right">
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {c.daysSince}d ago
                          </span>
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

      {/* ══════════════ LOCATION TAB ══════════════════════════════════════ */}
      {activeTab === "location" && (
        <>
          {/* India Map */}
          <Card>
            <SectionTitle
              icon="🗺️"
              title="Orders by State — India Map"
              subtitle="Hover over a state to see customers, orders & revenue"
            />
            <IndiaMap byState={byState} />
          </Card>

          {/* State bar chart */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="📊"
                title="Top States by Orders"
                subtitle="Where your buyers are"
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
                    margin={{ left: 10, right: 40 }}
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
                      width={120}
                      tickFormatter={(v: string) =>
                        v.length > 16 ? v.slice(0, 16) + "…" : v
                      }
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) => [fmtNum(v), name]}
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
                      dataKey="customers"
                      name="Customers"
                      fill="#10b981"
                      fillOpacity={0.6}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Top cities */}
            <Card>
              <SectionTitle
                icon="🏙️"
                title="Top Cities by Orders"
                subtitle="City-level breakdown"
              />
              {byCity.length === 0 ? (
                <Empty />
              ) : (
                <div style={{ overflowY: "auto", maxHeight: 360 }}>
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
                        {[
                          "City",
                          "State",
                          "Customers",
                          "Orders",
                          "Revenue",
                        ].map((h) => (
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
                      {byCity.slice(0, 20).map((c, i) => (
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
                          <Td rowIndex={i} align="right">
                            {fmtNum(c.customers)}
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

      {/* ══════════════ RETENTION TAB ═════════════════════════════════════ */}
      {activeTab === "retention" && (
        <>
          {/* 13. Churn */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="🚨"
                title="Churn Analysis"
                subtitle="Customers inactive 120+ days = at-risk"
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
                    label: "Active Customers",
                    value:
                      (summary?.totalCustomers ?? 0) -
                      (summary?.churnedCustomers ?? 0),
                    color: "#10b981",
                    pct: 100 - (summary?.churnRate ?? 0),
                  },
                  {
                    label: "Churned (120d+)",
                    value: summary?.churnedCustomers ?? 0,
                    color: "#ef4444",
                    pct: summary?.churnRate ?? 0,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${item.color}33`,
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: item.color,
                          fontFamily: "monospace",
                        }}
                      >
                        {fmtNum(item.value)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${item.pct}%`,
                          background: item.color,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#475569", marginTop: 5 }}
                    >
                      {fmtPct(item.pct)} of total
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Monthly new vs returning */}
            <Card>
              <SectionTitle
                icon="🔄"
                title="New vs Returning Over Time"
                subtitle="Returning share growing = loyalty is working"
              />
              {!hasData ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={monthly}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#64748b", fontSize: 10 }}
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
                      dataKey="newCustomers"
                      name="New"
                      fill="#10b981"
                      fillOpacity={0.8}
                      stackId="a"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="returning"
                      name="Returning"
                      fill="#3b82f6"
                      fillOpacity={0.8}
                      stackId="a"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="vip"
                      name="VIP"
                      fill="#f59e0b"
                      fillOpacity={0.9}
                      stackId="a"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* 14. Cohort Retention */}
          <Card>
            <SectionTitle
              icon="🧾"
              title="Cohort Retention Table"
              subtitle="Retention % by signup month — green = healthy, red = drop-off"
            />
            <CohortHeatmap cohort={cohort} />
          </Card>
        </>
      )}
    </div>
  );
}
