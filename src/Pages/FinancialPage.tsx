import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useDerivedData, useDerivedData1 } from "../hooks/useDerivedData";
import { useDashboard } from "../store/DashboardContext";
import {
  Card,
  SectionTitle,
  KpiCard,
  Badge,
  CustomTooltip,
  Th,
  Td,
} from "../components/ui";
import { ProfitGauge } from "../components/charts/ProfitGauge";
import { fmt, fmtK } from "../utils/format";
import { PRODUCT_COLORS } from "../utils/constants";
import type {
  ProductRevenueRow,
  ChannelRevenueRow,
  DailyRevenueRow,
  AOVRow,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  MOCK DATA — replace with real API fields when available
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_DAILY_REVENUE: DailyRevenueRow[] = [
  { date: "01 Apr", revenue: 18400, orders: 12 },
  { date: "02 Apr", revenue: 22100, orders: 15 },
  { date: "03 Apr", revenue: 15600, orders: 10 },
  { date: "04 Apr", revenue: 31200, orders: 21 },
  { date: "05 Apr", revenue: 28900, orders: 19 },
  { date: "06 Apr", revenue: 19500, orders: 13 },
  { date: "07 Apr", revenue: 42000, orders: 28 },
  { date: "08 Apr", revenue: 38700, orders: 26 },
  { date: "09 Apr", revenue: 25300, orders: 17 },
  { date: "10 Apr", revenue: 29800, orders: 20 },
  { date: "11 Apr", revenue: 33400, orders: 22 },
  { date: "12 Apr", revenue: 21000, orders: 14 },
  { date: "13 Apr", revenue: 44500, orders: 30 },
  { date: "14 Apr", revenue: 39200, orders: 26 },
];

const MOCK_PRODUCT_REVENUE: ProductRevenueRow[] = [
  {
    product: "T-Shirt",
    revenue: 182000,
    units: 520,
    color: PRODUCT_COLORS["T-Shirt"],
  },
  {
    product: "Polo",
    revenue: 154000,
    units: 380,
    color: PRODUCT_COLORS["Polo"],
  },
  {
    product: "Hoodie",
    revenue: 138000,
    units: 210,
    color: PRODUCT_COLORS["Hoodie"],
  },
  {
    product: "Cargo",
    revenue: 121000,
    units: 290,
    color: PRODUCT_COLORS["Cargo"],
  },
  {
    product: "Jacket",
    revenue: 108000,
    units: 160,
    color: PRODUCT_COLORS["Jacket"],
  },
  {
    product: "Shirts",
    revenue: 94000,
    units: 310,
    color: PRODUCT_COLORS["Shirts"],
  },
  {
    product: "Jogger",
    revenue: 87000,
    units: 260,
    color: PRODUCT_COLORS["Jogger"],
  },
  {
    product: "Shorts",
    revenue: 76000,
    units: 340,
    color: PRODUCT_COLORS["Shorts"],
  },
  {
    product: "Acid Wash",
    revenue: 62000,
    units: 140,
    color: PRODUCT_COLORS["Acid Wash"],
  },
];

const MOCK_CHANNEL_REVENUE: ChannelRevenueRow[] = [
  { channel: "Website", value: 412000, color: "#3b82f6" },
  { channel: "Meta Ads", value: 284000, color: "#8b5cf6" },
  { channel: "Marketplace", value: 198000, color: "#10b981" },
  { channel: "Google Ads", value: 114000, color: "#f59e0b" },
  { channel: "Influencer", value: 88000, color: "#ec4899" },
];

const MOCK_AOV: AOVRow[] = [
  { month: "Jan", aov: 0 },
  { month: "Feb", aov: 1420 },
  { month: "Mar", aov: 1680 },
  { month: "Apr", aov: 1550 },
  { month: "May", aov: 0 },
  { month: "Jun", aov: 0 },
  { month: "Jul", aov: 0 },
  { month: "Aug", aov: 0 },
  { month: "Sep", aov: 0 },
  { month: "Oct", aov: 0 },
  { month: "Nov", aov: 0 },
  { month: "Dec", aov: 0 },
];

// ─────────────────────────────────────────────────────────────────────────────

const MOCK_BADGE = (
  <span
    style={{
      fontSize: 10,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 12,
      background: "rgba(245,158,11,0.12)",
      color: "#f59e0b",
      border: "1px solid rgba(245,158,11,0.25)",
      whiteSpace: "nowrap",
    }}
  >
    ⚠️ MOCK DATA
  </span>
);

const tooltipStyle = {
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e2e8f0",
};

export function FinancialPage() {
  const {
    totalRevenue,
    totalExpenses,
    netProfit,
    margin,
    monthlyData,
    catBreakdown,
    activeMths,
    budgetActual,
  } = useDerivedData();

  const { totalRevenue1, totalExpenses1 } = useDerivedData1();

  // ── Derived ───────────────────────────────────────────────────────────────
  const avgMonthlyBurn = totalExpenses / activeMths;
  const cashRunway = avgMonthlyBurn > 0 ? totalRevenue / avgMonthlyBurn : 0;

  const activeMonthlyData = useMemo(
    () => monthlyData.filter((m) => m.revenue > 0 || m.expenses > 0),
    [monthlyData],
  );

  const grossRevenue = totalRevenue1;
  const netRevenue = grossRevenue - totalExpenses1;
  const totalOrders = MOCK_PRODUCT_REVENUE.reduce((s, p) => s + p.units, 0); // ⚠️ mock
  const aov = totalOrders > 0 ? grossRevenue / totalOrders : 0;

  const grossVsNet = useMemo(
    () =>
      activeMonthlyData.map((m) => ({
        month: m.month,
        gross: m.revenue,
        net: m.revenue - m.expenses,
      })),
    [activeMonthlyData],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── KPI strip ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
        }}
      >
        <KpiCard
          label="Gross Revenue"
          value={fmtK(grossRevenue)}
          color="#10b981"
          sub="YTD (real)"
        />
        <KpiCard
          label="Net Revenue"
          value={fmtK(netRevenue)}
          color={netRevenue >= 0 ? "#10b981" : "#ef4444"}
          sub="YTD (real)"
        />
        <KpiCard
          label="Total Orders"
          value={totalOrders.toLocaleString("en-IN")}
          color="#3b82f6"
          sub="⚠️ mock"
        />
        <KpiCard
          label="Avg Order Value"
          value={fmtK(aov)}
          color="#f59e0b"
          sub="⚠️ mock"
        />
      </div>

      {/* ── Gauge + Burn Analysis ───────────────────────────────────────────── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}
      >
        <Card>
          <SectionTitle
            icon="🎯"
            title="Profit Margin Gauge"
            subtitle="Overall financial health"
          />
          <ProfitGauge margin={margin} />
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { label: "Revenue", v: fmtK(totalRevenue), c: "#10b981" },
              { label: "Expenses", v: fmtK(totalExpenses), c: "#ef4444" },
              {
                label: "Profit",
                v: fmtK(netProfit),
                c: netProfit >= 0 ? "#10b981" : "#ef4444",
              },
              {
                label: "Margin",
                v: `${margin.toFixed(1)}%`,
                c: margin > 15 ? "#10b981" : margin > 0 ? "#f59e0b" : "#ef4444",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#475569",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: item.c }}>
                  {item.v}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle
            icon="🔥"
            title="Cash Burn Analysis"
            subtitle="Estimated runway & burn rate"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 18,
            }}
          >
            {[
              {
                label: "Monthly Burn Rate",
                value: fmtK(avgMonthlyBurn),
                color: "#ef4444",
                icon: "🔥",
              },
              {
                label: "Revenue / Month Avg",
                value: fmtK(totalRevenue / activeMths),
                color: "#10b981",
                icon: "💹",
              },
              {
                label: "Cash Runway (months)",
                value: cashRunway.toFixed(1) + "mo",
                color:
                  cashRunway > 6
                    ? "#10b981"
                    : cashRunway > 3
                      ? "#f59e0b"
                      : "#ef4444",
                icon: "⏱",
              },
              {
                label: "Burn Multiple",
                value:
                  (totalExpenses / Math.max(totalRevenue, 1)).toFixed(2) + "x",
                color: "#8b5cf6",
                icon: "📐",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: item.color,
                    marginBottom: 2,
                  }}
                >
                  {item.value}
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          <SectionTitle icon="📅" title="Monthly Profit Trend" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={monthlyData}
              margin={{ top: 5, right: 5, bottom: 0, left: 5 }}
            >
              <defs>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "#475569", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtK}
                tick={{ fill: "#475569", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: any) => [fmtK(v), "Net Profit"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 2"
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Net Profit"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#profGrad)"
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Revenue vs Expenses (REAL) ──────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon="📈"
          title="Revenue vs Expenses"
          subtitle="Monthly — real data"
        />
        {activeMonthlyData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 0",
              color: "#475569",
              fontSize: 12,
            }}
          >
            No data for selected date range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart
              data={activeMonthlyData}
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
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#10b981"
                fillOpacity={0.85}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="#ef4444"
                fillOpacity={0.75}
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Daily Revenue ⚠️ MOCK ──────────────────────────────────────────── */}
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SectionTitle
            icon="📅"
            title="Daily Revenue"
            subtitle="Orders & revenue per day"
          />
          {MOCK_BADGE}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart
            data={MOCK_DAILY_REVENUE}
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
            />
            <YAxis
              yAxisId="rev"
              tickFormatter={fmtK}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <YAxis
              yAxisId="ord"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: any, name: string) =>
                name === "Revenue" ? [fmtK(v), name] : [v, name]
              }
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }}
            />
            <Bar
              yAxisId="rev"
              dataKey="revenue"
              name="Revenue"
              fill="#3b82f6"
              fillOpacity={0.8}
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="ord"
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* ── Product + Channel ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SectionTitle
              icon="👕"
              title="Revenue by Product"
              subtitle="Units sold & revenue"
            />
            {MOCK_BADGE}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={MOCK_PRODUCT_REVENUE}
              margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="product"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtK}
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: any, name: string) => [fmtK(v), name]}
                labelFormatter={(label) => `Product: ${label}`}
              />
              <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                {MOCK_PRODUCT_REVENUE.map((p, i) => (
                  <Cell key={i} fill={p.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
          >
            {MOCK_PRODUCT_REVENUE.map((p) => (
              <div
                key={p.product}
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
                    background: p.color,
                    display: "inline-block",
                  }}
                />
                {p.product} ({p.units} units)
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SectionTitle
              icon="📡"
              title="Revenue by Channel"
              subtitle="Website, ads, marketplace"
            />
            {MOCK_BADGE}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={MOCK_CHANNEL_REVENUE}
                dataKey="value"
                nameKey="channel"
                cx="50%"
                cy="50%"
                outerRadius={72}
                innerRadius={40}
                paddingAngle={3}
              >
                {MOCK_CHANNEL_REVENUE.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: any) => [fmtK(v), "Revenue"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 8,
            }}
          >
            {MOCK_CHANNEL_REVENUE.map((c) => (
              <div
                key={c.channel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: c.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {c.channel}
                  </span>
                </div>
                <span
                  style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}
                >
                  {fmtK(c.value)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── AOV + Gross vs Net ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <SectionTitle
              icon="🛒"
              title="Avg Order Value Trend"
              subtitle="Monthly AOV"
            />
            {MOCK_BADGE}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={MOCK_AOV.filter((d) => d.aov > 0)}
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
                formatter={(v: any) => [fmtK(v), "AOV"]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="aov"
                name="AOV"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#f59e0b", strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle
            icon="💹"
            title="Gross vs Net Revenue"
            subtitle="Monthly comparison — real data"
          />
          {grossVsNet.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data for selected date range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={grossVsNet}
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
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    color: "#64748b",
                    paddingTop: 8,
                  }}
                />
                <Bar
                  dataKey="gross"
                  name="Gross Revenue"
                  fill="#10b981"
                  fillOpacity={0.85}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="net"
                  name="Net Revenue"
                  fill="#3b82f6"
                  fillOpacity={0.85}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Category Deep-Dive ─────────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon="📊"
          title="Expense Category Deep-Dive"
          subtitle="% contribution & budget status"
        />
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
                  "Category",
                  "Total Spent",
                  "% of Expenses",
                  "Avg/Month",
                  "vs Budget",
                  "Status",
                ].map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catBreakdown.map((c, i) => {
                const budget = budgetActual.find((b) => b.cat === c.name);
                const pct =
                  totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0;
                const over = budget?.over ?? false;
                const variance = (budget?.budget ?? 0) - c.value;
                return (
                  <tr key={c.name}>
                    <Td rowIndex={i}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: c.color,
                            display: "inline-block",
                          }}
                        />
                        {c.name}
                      </div>
                    </Td>
                    <Td
                      rowIndex={i}
                      style={{ fontWeight: 700, color: "#f1f5f9" }}
                    >
                      {fmt(c.value)}
                    </Td>
                    <Td rowIndex={i}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            background: "rgba(255,255,255,0.08)",
                            borderRadius: 2,
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: c.color,
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span style={{ color: "#94a3b8", minWidth: 32 }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </Td>
                    <Td rowIndex={i}>{fmtK(c.value / activeMths)}</Td>
                    <Td rowIndex={i}>
                      <span style={{ color: over ? "#ef4444" : "#10b981" }}>
                        {over ? "+" : "-"}
                        {fmtK(Math.abs(variance))}
                      </span>
                    </Td>
                    <Td rowIndex={i}>
                      <Badge color={over ? "#ef4444" : "#10b981"}>
                        {over ? "Over" : "Under"}
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {catBreakdown.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No expense data for this period
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
