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
  ReferenceLine,
  Legend,
} from "recharts";
import { useDerivedData, useDerivedData1 } from "../hooks/useDerivedData";
import { useDashboard } from "../store/DashboardContext";
import {
  Card,
  SectionTitle,
  KpiCard,
  HeatCell,
  CustomTooltip,
  Badge,
  Th,
  Td,
} from "../components/ui";
import { fmtK, fmt, toYM } from "../utils/format";
import { CATEGORIES, MONTHS, CAT_COLORS } from "../utils/constants";

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  MOCK DATA — replace with real API fields when available
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CONTRIBUTION_MARGIN = [
  { product: "T-Shirt", revenue: 182000, cogs: 98000, margin: 84000 },
  { product: "Polo", revenue: 154000, cogs: 89000, margin: 65000 },
  { product: "Hoodie", revenue: 138000, cogs: 72000, margin: 66000 },
  { product: "Cargo", revenue: 121000, cogs: 68000, margin: 53000 },
  { product: "Jacket", revenue: 108000, cogs: 64000, margin: 44000 },
  { product: "Shirts", revenue: 94000, cogs: 51000, margin: 43000 },
  { product: "Jogger", revenue: 87000, cogs: 48000, margin: 39000 },
  { product: "Shorts", revenue: 76000, cogs: 39000, margin: 37000 },
  { product: "Acid Wash", revenue: 62000, cogs: 38000, margin: 24000 },
];

const MOCK_DISCOUNTS = [
  { month: "Jan", revenue: 0, discount: 0 },
  { month: "Feb", revenue: 500000, discount: 28000 },
  { month: "Mar", revenue: 400000, discount: 21000 },
  { month: "Apr", revenue: 609889, discount: 34000 },
];

const MOCK_REFUNDS = [
  { month: "Jan", refunds: 0 },
  { month: "Feb", refunds: 8400 },
  { month: "Mar", refunds: 6200 },
  { month: "Apr", refunds: 11800 },
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

// ─────────────────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const {
    monthlyData,
    catBreakdown,
    filteredExpenses,
    totalExpenses,
    totalRevenue,
    netProfit,
    margin,
    activeMths,
  } = useDerivedData();

  const { totalRevenue1, totalExpenses1, investments } = useDerivedData1();
  const { state } = useDashboard();
  const { expenses, revenue } = state;

  // ── Stacked monthly by category ───────────────────────────────────────────
  const monthlyByCategory = useMemo(
    () =>
      MONTHS.map((mo) => {
        const ym = toYM(mo);
        const row: Record<string, string | number> = { month: mo };
        CATEGORIES.forEach((cat) => {
          row[cat] = expenses
            .filter((e) => e.date.slice(0, 7) === ym && e.category === cat)
            .reduce((s, e) => s + e.amount, 0);
        });
        return row;
      }),
    [expenses],
  );

  // ── Gross margin trend (revenue - inventory/mfg/packaging cost) ───────────
  const grossMarginTrend = useMemo(
    () =>
      monthlyData
        .filter((m) => m.revenue > 0)
        .map((m) => {
          const ym = toYM(m.month);
          const cogs = expenses
            .filter((e) => {
              const inMonth = e.date.slice(0, 7) === ym;
              return (
                inMonth &&
                [
                  "Inventory",
                  "Manufacturing",
                  "Packaging",
                  "Sampling",
                ].includes(e.category)
              );
            })
            .reduce((s, e) => s + e.amount, 0);
          const grossMargin =
            m.revenue > 0 ? ((m.revenue - cogs) / m.revenue) * 100 : 0;
          return {
            month: m.month,
            grossMargin: parseFloat(grossMargin.toFixed(1)),
            cogs,
          };
        }),
    [monthlyData, expenses],
  );

  // ── Net profit trend ──────────────────────────────────────────────────────
  const netProfitTrend = useMemo(
    () =>
      monthlyData
        .filter((m) => m.revenue > 0 || m.expenses > 0)
        .map((m) => ({
          month: m.month,
          netProfit: m.profit,
          margin:
            m.revenue > 0
              ? parseFloat(((m.profit / m.revenue) * 100).toFixed(1))
              : 0,
        })),
    [monthlyData],
  );

  // ── Cost breakdown pie ────────────────────────────────────────────────────
  const costBreakdown = useMemo(() => {
    const adSpend = catBreakdown
      .filter((c) =>
        ["Ads", "Meta Ads", "Google Ads", "Influencer Marketing"].includes(
          c.name,
        ),
      )
      .reduce((s, c) => s + c.value, 0);
    const logistics = catBreakdown
      .filter((c) => ["Logistics", "Shipping"].includes(c.name))
      .reduce((s, c) => s + c.value, 0);
    const cogs = catBreakdown
      .filter((c) =>
        ["Inventory", "Manufacturing", "Packaging", "Sampling"].includes(
          c.name,
        ),
      )
      .reduce((s, c) => s + c.value, 0);
    const other = catBreakdown
      .filter(
        (c) =>
          ![
            "Ads",
            "Meta Ads",
            "Google Ads",
            "Influencer Marketing",
            "Logistics",
            "Shipping",
            "Inventory",
            "Manufacturing",
            "Packaging",
            "Sampling",
          ].includes(c.name),
      )
      .reduce((s, c) => s + c.value, 0);
    return [
      { name: "COGS", value: cogs, color: "#10b981" },
      { name: "Ads", value: adSpend, color: "#3b82f6" },
      { name: "Logistics", value: logistics, color: "#f59e0b" },
      { name: "Other", value: other, color: "#6366f1" },
    ].filter((d) => d.value > 0);
  }, [catBreakdown]);

  // ── Expense-to-revenue ratio trend ────────────────────────────────────────
  const expToRevTrend = useMemo(
    () =>
      monthlyData
        .filter((m) => m.revenue > 0)
        .map((m) => ({
          month: m.month,
          ratio: parseFloat(((m.expenses / m.revenue) * 100).toFixed(1)),
        })),
    [monthlyData],
  );

  // ── MoM expense growth by category ───────────────────────────────────────
  const activeMonths = useMemo(
    () =>
      MONTHS.filter((mo) => {
        const ym = toYM(mo);
        return expenses.some((e) => e.date.slice(0, 7) === ym);
      }),
    [expenses],
  );

  const momGrowth = useMemo(() => {
    if (activeMonths.length < 2) return [];
    return CATEGORIES.map((cat) => {
      const prev = expenses
        .filter(
          (e) =>
            e.date.slice(0, 7) ===
              toYM(activeMonths[activeMonths.length - 2]) && e.category === cat,
        )
        .reduce((s, e) => s + e.amount, 0);
      const curr = expenses
        .filter(
          (e) =>
            e.date.slice(0, 7) ===
              toYM(activeMonths[activeMonths.length - 1]) && e.category === cat,
        )
        .reduce((s, e) => s + e.amount, 0);
      const growth =
        prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;
      return {
        cat,
        prev,
        curr,
        growth: parseFloat(growth.toFixed(1)),
        color: CAT_COLORS[cat],
      };
    })
      .filter((d) => d.curr > 0 || d.prev > 0)
      .sort((a, b) => b.growth - a.growth);
  }, [expenses, activeMonths]);

  const top3Growing = momGrowth.filter((d) => d.growth > 0).slice(0, 3);

  // ── Inventory as % of revenue ─────────────────────────────────────────────
  const inventoryCost = catBreakdown
    .filter((c) =>
      ["Inventory", "Manufacturing", "Packaging", "Sampling"].includes(c.name),
    )
    .reduce((s, c) => s + c.value, 0);
  const cogsRatio =
    totalRevenue1 > 0 ? (inventoryCost / totalRevenue1) * 100 : 0;

  // ── Cumulative profit curve ───────────────────────────────────────────────
  const cumulativeProfit = useMemo(() => {
    let running = 0;
    return monthlyData
      .filter((m) => m.revenue > 0 || m.expenses > 0)
      .map((m) => {
        running += m.profit;
        return { month: m.month, cumulative: running };
      });
  }, [monthlyData]);

  // ── Rolling 3-month avg burn vs revenue ──────────────────────────────────
  const rolling3 = useMemo(() => {
    const active = monthlyData.filter((m) => m.revenue > 0 || m.expenses > 0);
    return active.map((m, i) => {
      const window = active.slice(Math.max(0, i - 2), i + 1);
      const avgBurn =
        window.reduce((s, w) => s + w.expenses, 0) / window.length;
      const avgRev = window.reduce((s, w) => s + w.revenue, 0) / window.length;
      return {
        month: m.month,
        avgBurn: Math.round(avgBurn),
        avgRevenue: Math.round(avgRev),
      };
    });
  }, [monthlyData]);

  // ── Break-even per month ──────────────────────────────────────────────────
  const breakEvenData = useMemo(
    () =>
      monthlyData
        .filter((m) => m.revenue > 0 || m.expenses > 0)
        .map((m) => ({
          month: m.month,
          revenue: m.revenue,
          expenses: m.expenses,
          gap: m.revenue - m.expenses,
        })),
    [monthlyData],
  );

  // ── Investments / ROIC ────────────────────────────────────────────────────
  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
  const roic = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
  const avgMonthlyBurn = totalExpenses / activeMths;
  const operatingLeverage =
    totalRevenue > 0
      ? (totalRevenue - inventoryCost) / Math.max(netProfit, 1)
      : 0;

  // ── Cash flow heatmap (monthly, green/red) ────────────────────────────────
  const cashFlowHeatmap = useMemo(
    () =>
      MONTHS.map((mo) => {
        const ym = toYM(mo);
        const rev = revenue[mo] ?? 0;
        const exp = expenses
          .filter((e) => e.date.slice(0, 7) === ym)
          .reduce((s, e) => s + e.amount, 0);
        return { month: mo, cashFlow: rev - exp, rev, exp };
      }),
    [revenue, expenses],
  );
  const heatMax = Math.max(
    ...cashFlowHeatmap.map((d) => Math.abs(d.cashFlow)),
    1,
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
          label="Gross Margin %"
          value={`${grossMarginTrend.length ? grossMarginTrend[grossMarginTrend.length - 1].grossMargin.toFixed(1) : "0.0"}%`}
          color="#10b981"
          sub="latest month"
        />
        <KpiCard
          label="Net Profit Margin"
          value={`${margin.toFixed(1)}%`}
          color={margin > 0 ? "#10b981" : "#ef4444"}
          sub="filtered period"
        />
        <KpiCard
          label="COGS Ratio"
          value={`${cogsRatio.toFixed(1)}%`}
          color={cogsRatio < 50 ? "#10b981" : "#ef4444"}
          sub="of revenue"
        />
        <KpiCard
          label="ROIC"
          value={`${roic.toFixed(1)}%`}
          color={roic > 0 ? "#10b981" : "#ef4444"}
          sub="return on invested capital"
        />
      </div>

      {/* ── Gross Margin Trend + Net Profit Trend ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle
            icon="📈"
            title="Gross Margin Trend"
            subtitle="(Revenue − COGS) ÷ Revenue — real data"
          />
          {grossMarginTrend.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={grossMarginTrend}
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
                  width={40}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any) => [`${v}%`, "Gross Margin"]}
                  labelFormatter={(l) => `Month: ${l}`}
                />
                <ReferenceLine
                  y={50}
                  stroke="rgba(255,255,255,0.1)"
                  strokeDasharray="4 2"
                />
                <Line
                  type="monotone"
                  dataKey="grossMargin"
                  name="Gross Margin %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle
            icon="💹"
            title="Net Profit Trend"
            subtitle="Monthly net profit — real data"
          />
          {netProfitTrend.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={netProfitTrend}
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
                  yAxisId="amt"
                  tickFormatter={fmtK}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <YAxis
                  yAxisId="pct"
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
                    name === "Margin %" ? [`${v}%`, name] : [fmtK(v), name]
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
                  yAxisId="amt"
                  y={0}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="4 2"
                />
                <Bar
                  yAxisId="amt"
                  dataKey="netProfit"
                  name="Net Profit"
                  fill="#3b82f6"
                  fillOpacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="margin"
                  name="Margin %"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Cost Breakdown + Expense-to-Revenue ────────────────────────────── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}
      >
        <Card>
          <SectionTitle
            icon="🥧"
            title="Cost Breakdown"
            subtitle="COGS, Ads, Logistics, Other — real data"
          />
          {costBreakdown.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={72}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {costBreakdown.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => [fmtK(v), "Spend"]}
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
                {costBreakdown.map((c) => (
                  <div
                    key={c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
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
                        {c.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#cbd5e1",
                      }}
                    >
                      {fmtK(c.value)} (
                      {totalExpenses > 0
                        ? ((c.value / totalExpenses) * 100).toFixed(1)
                        : 0}
                      %)
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <SectionTitle
            icon="📉"
            title="Expense-to-Revenue Ratio"
            subtitle="Lower is better — real data"
          />
          {expToRevTrend.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={expToRevTrend}
                margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="ratioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                  unit="%"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any) => [`${v}%`, "Exp / Rev"]}
                  labelFormatter={(l) => `Month: ${l}`}
                />
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="4 2"
                  strokeOpacity={0.4}
                />
                <Area
                  type="monotone"
                  dataKey="ratio"
                  name="Exp/Rev %"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#ratioGrad)"
                  dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Stacked Monthly Expense by Category ────────────────────────────── */}
      <Card>
        <SectionTitle
          icon="📊"
          title="Stacked Monthly Expense by Category"
          subtitle="Full breakdown — real data"
        />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={monthlyByCategory}
            margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="month"
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmtK}
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: any, name: string) => [fmtK(v), name]}
              labelFormatter={(l) => `Month: ${l}`}
            />
            {CATEGORIES.map((cat) => (
              <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
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
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: CAT_COLORS[cat],
                  display: "inline-block",
                }}
              />
              {cat}
            </div>
          ))}
        </div>
      </Card>

      {/* ── MoM Growth + Top 3 ─────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle
            icon="📊"
            title="Month-over-Month Expense Growth"
            subtitle="vs previous month by category — real data"
          />
          {momGrowth.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              Need 2+ months of data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={momGrowth}
                layout="vertical"
                margin={{ left: 10, right: 40 }}
              >
                <XAxis
                  type="number"
                  unit="%"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="cat"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any) => [`${v}%`, "Growth"]}
                  labelFormatter={(l) => `Category: ${l}`}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
                <Bar dataKey="growth" name="MoM Growth %" radius={[0, 4, 4, 0]}>
                  {momGrowth.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.growth >= 0 ? "#ef4444" : "#10b981"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle
            icon="🔥"
            title="Top 3 Fastest Growing"
            subtitle="Expense categories MoM — real data"
          />
          {top3Growing.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              Need 2+ months
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 8,
              }}
            >
              {top3Growing.map((d, i) => (
                <div
                  key={d.cat}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: d.color,
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#cbd5e1",
                        }}
                      >
                        {d.cat}
                      </span>
                    </div>
                    <Badge color="#ef4444">+{d.growth.toFixed(1)}%</Badge>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontSize: 10, color: "#475569" }}>
                      Prev: {fmtK(d.prev)}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#f1f5f9",
                        fontWeight: 700,
                      }}
                    >
                      Now: {fmtK(d.curr)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Contribution Margin ⚠️ MOCK + Discounts ⚠️ MOCK ───────────────── */}
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
              title="Contribution Margin by Product"
              subtitle="Revenue − COGS per product"
            />
            {MOCK_BADGE}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={MOCK_CONTRIBUTION_MARGIN}
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
                labelFormatter={(l) => `Product: ${l}`}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#10b981"
                fillOpacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cogs"
                name="COGS"
                fill="#ef4444"
                fillOpacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="margin"
                name="Contribution Margin"
                fill="#3b82f6"
                fillOpacity={0.9}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
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
              icon="🏷️"
              title="Discounts vs Revenue"
              subtitle="Impact of discounting"
            />
            {MOCK_BADGE}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart
              data={MOCK_DISCOUNTS}
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
                wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 8 }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="#10b981"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Line
                dataKey="discount"
                name="Discounts"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10 }}>
            {MOCK_DISCOUNTS.filter((d) => d.revenue > 0).map((d) => (
              <div
                key={d.month}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {d.month}
                </span>
                <span style={{ fontSize: 11, color: "#ef4444" }}>
                  {d.revenue > 0
                    ? ((d.discount / d.revenue) * 100).toFixed(1)
                    : 0}
                  % discounted
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Refunds ⚠️ MOCK + Break-even ─────────────────────────────────── */}
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
              icon="↩️"
              title="Refunds & Returns Cost Trend"
              subtitle="Monthly refund cost"
            />
            {MOCK_BADGE}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={MOCK_REFUNDS}
              margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="refundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                tickFormatter={fmtK}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: any) => [fmtK(v), "Refunds"]}
                labelFormatter={(l) => `Month: ${l}`}
              />
              <Area
                type="monotone"
                dataKey="refunds"
                name="Refunds"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#refundGrad)"
                dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle
            icon="⚖️"
            title="Break-even Analysis"
            subtitle="Revenue vs expenses per month — real data"
          />
          {breakEvenData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={breakEvenData}
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
                  dataKey="revenue"
                  name="Revenue"
                  fill="#10b981"
                  fillOpacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                  fillOpacity={0.7}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  dataKey="gap"
                  name="Surplus/Deficit"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <ReferenceLine
                  y={0}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="4 2"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Cumulative Profit + Rolling 3-month ────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle
            icon="📈"
            title="Cumulative Profit / Loss"
            subtitle="Running total — real data"
          />
          {cumulativeProfit.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={cumulativeProfit}
                margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                  tickFormatter={fmtK}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: any) => [fmtK(v), "Cumulative Profit"]}
                  labelFormatter={(l) => `Month: ${l}`}
                />
                <ReferenceLine
                  y={0}
                  stroke="rgba(255,255,255,0.2)"
                  strokeDasharray="4 2"
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Profit"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#cumGrad)"
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <SectionTitle
            icon="🔄"
            title="Rolling 3-Month Avg: Burn vs Revenue"
            subtitle="Smoothed trend — real data"
          />
          {rolling3.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={rolling3}
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
                <Line
                  type="monotone"
                  dataKey="avgRevenue"
                  name="Avg Revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgBurn"
                  name="Avg Burn"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Cash Flow Heatmap ──────────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon="🌡️"
          title="Monthly Cash Flow Heatmap"
          subtitle="Green = surplus, Red = deficit — real data"
        />
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 4,
            }}
          >
            <thead>
              <tr>
                {MONTHS.map((mo) => (
                  <th
                    key={mo}
                    style={{
                      fontSize: 10,
                      color: "#475569",
                      fontWeight: 600,
                      textAlign: "center",
                      padding: "4px 2px",
                    }}
                  >
                    {mo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {cashFlowHeatmap.map((d) => {
                  const isPos = d.cashFlow >= 0;
                  const intensity = Math.min(Math.abs(d.cashFlow) / heatMax, 1);
                  const bg =
                    d.rev === 0 && d.exp === 0
                      ? "rgba(255,255,255,0.03)"
                      : isPos
                        ? `rgba(16,185,129,${0.12 + intensity * 0.6})`
                        : `rgba(239,68,68,${0.12 + intensity * 0.6})`;
                  return (
                    <td
                      key={d.month}
                      style={{
                        background: bg,
                        borderRadius: 6,
                        padding: "10px 4px",
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color:
                          d.rev === 0 && d.exp === 0
                            ? "#475569"
                            : isPos
                              ? "#86efac"
                              : "#fca5a5",
                        minWidth: 52,
                      }}
                    >
                      {d.rev === 0 && d.exp === 0 ? "—" : fmtK(d.cashFlow)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 12,
            fontSize: 10,
            color: "#475569",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: "rgba(16,185,129,0.6)",
                display: "inline-block",
              }}
            />
            Surplus
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: "rgba(239,68,68,0.6)",
                display: "inline-block",
              }}
            />
            Deficit
          </div>
        </div>
      </Card>

      {/* ── Transactions by Category + Invested vs Revenue ──────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle
            icon="📅"
            title="Transactions by Category"
            subtitle="Count of expense entries — real data"
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={catBreakdown.map((c) => ({
                ...c,
                count: filteredExpenses.filter((e) => e.category === c.name)
                  .length,
              }))}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <XAxis
                type="number"
                tick={{ fill: "#475569", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: any) => [v, "Transactions"]}
                labelFormatter={(l) => `Category: ${l}`}
              />
              <Bar dataKey="count" name="Transactions" radius={[0, 4, 4, 0]}>
                {catBreakdown.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle
            icon="💰"
            title="Invested Capital vs Business Revenue"
            subtitle="Capital deployed vs returns — real data"
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 8,
            }}
          >
            {[
              {
                label: "Total Invested",
                value: fmtK(totalInvested),
                color: "#8b5cf6",
              },
              {
                label: "Total Revenue (YTD)",
                value: fmtK(totalRevenue1),
                color: "#10b981",
              },
              {
                label: "Net Profit",
                value: fmtK(netProfit),
                color: netProfit >= 0 ? "#10b981" : "#ef4444",
              },
              {
                label: "ROIC",
                value: `${roic.toFixed(1)}%`,
                color: roic >= 0 ? "#10b981" : "#ef4444",
              },
              {
                label: "Operating Leverage",
                value: `${operatingLeverage.toFixed(2)}x`,
                color: "#f59e0b",
              },
              {
                label: "Avg Monthly Burn",
                value: fmtK(avgMonthlyBurn),
                color: "#ef4444",
              },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom:
                    i < arr.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
              >
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {item.label}
                </span>
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: item.color }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
