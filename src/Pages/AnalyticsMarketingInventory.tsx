import React from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useDerivedData } from "../hooks/useDerivedData";
import { useDashboard } from "../store/DashboardContext";
import { Card, SectionTitle, KpiCard, HeatCell, CustomTooltip } from "../components/ui";
import { fmtK, fmt, toYM } from "../utils/format";
import { CATEGORIES, MONTHS, CAT_COLORS } from "../utils/constants";

// ─── Analytics Page ───────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { monthlyData, catBreakdown, filteredExpenses } = useDerivedData();
  const { state } = useDashboard();
  const { expenses, revenue } = state;

  const monthlyByCategory = MONTHS.slice(0, 6).map((mo) => {
    const ym = toYM(mo);
    const row: Record<string, string | number> = { month: mo };
    CATEGORIES.forEach((cat) => {
      row[cat] = expenses
        .filter((e) => e.date.slice(0, 7) === ym && e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
    });
    return row;
  });

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle
          icon="📊"
          title="Stacked Monthly Expense by Category"
          subtitle="Full breakdown across filtered period"
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
            <Tooltip content={<CustomTooltip />} />
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle
            icon="📉"
            title="Revenue Trend"
            subtitle="Monthly revenue line"
          />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={monthlyData}
              margin={{ top: 5, right: 10, bottom: 0, left: 10 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#revGrad)"
                dot={{ r: 4, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle
            icon="📅"
            title="Transactions by Category"
            subtitle="Count of expense entries"
          />
          <ResponsiveContainer width="100%" height={200}>
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
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Transactions" radius={[0, 4, 4, 0]}>
                {catBreakdown.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ─── Marketing Page ───────────────────────────────────────────────────────────

export function MarketingPage() {
  const { adSpend, roas, totalRevenue, totalExpenses } = useDerivedData();
  const { state } = useDashboard();
  const { expenses, revenue } = state;

  const adsByMonth = MONTHS.slice(0, 6).map((mo) => {
    const ym = toYM(mo);
    const spend = expenses
      .filter((e) => e.date.slice(0, 7) === ym && e.category === "Ads")
      .reduce((s, e) => s + e.amount, 0);
    const rev = revenue[mo] ?? 0;
    return {
      month: mo,
      adSpend: spend,
      revenue: rev,
      roas: spend > 0 ? parseFloat((rev / spend).toFixed(2)) : 0,
    };
  });

  const campaigns = [
    {
      name: "Campaign A (Meta)",
      spend: 45000,
      revenue: 198000,
      roas: 4.4,
      conversions: 312,
    },
    {
      name: "Campaign B (Google)",
      spend: 52000,
      revenue: 220000,
      roas: 4.2,
      conversions: 287,
    },
    {
      name: "Campaign C (Influencer)",
      spend: 68000,
      revenue: 245000,
      roas: 3.6,
      conversions: 198,
    },
    {
      name: "Campaign D (Summer)",
      spend: 88000,
      revenue: 310000,
      roas: 3.5,
      conversions: 421,
    },
    {
      name: "Campaign E (Mid-year)",
      spend: 95000,
      revenue: 380000,
      roas: 4.0,
      conversions: 510,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiCard label="Total Ad Spend" value={fmtK(adSpend)} color="#3b82f6" />
        <KpiCard
          label="Overall ROAS"
          value={`${roas.toFixed(2)}x`}
          color={roas >= 4 ? "#10b981" : roas >= 2 ? "#f59e0b" : "#ef4444"}
          sub="revenue per ₹ spent"
        />
        <KpiCard
          label="Ads % of Expenses"
          value={`${totalExpenses > 0 ? ((adSpend / totalExpenses) * 100).toFixed(1) : 0}%`}
          color="#8b5cf6"
        />
        <KpiCard
          label="Revenue Attributed"
          value={fmtK(totalRevenue)}
          color="#10b981"
          sub="full period"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card>
          <SectionTitle
            icon="📣"
            title="Ad Spend vs ROAS by Month"
            subtitle="Return on ad spend trend"
          />
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart
              data={adsByMonth}
              margin={{ top: 5, right: 15, bottom: 0, left: 10 }}
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
                yAxisId="left"
                tickFormatter={fmtK}
                tick={{ fill: "#475569", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#f59e0b", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 6]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="left"
                dataKey="adSpend"
                name="Ad Spend"
                fill="#3b82f6"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roas"
                name="ROAS"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle
            icon="🎯"
            title="Marketing Mix"
            subtitle="Channel spend allocation"
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
              { channel: "Meta / Facebook", pct: 30, color: "#3b82f6" },
              { channel: "Google Ads", pct: 28, color: "#10b981" },
              { channel: "Influencer", pct: 25, color: "#8b5cf6" },
              { channel: "Other Digital", pct: 17, color: "#f59e0b" },
            ].map((c) => (
              <div key={c.channel}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>{c.channel}</span>
                  <span style={{ color: c.color, fontWeight: 700 }}>
                    {c.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 3,
                  }}
                >
                  <div
                    style={{
                      width: `${c.pct}%`,
                      height: "100%",
                      background: c.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle
          icon="🌟"
          title="Campaign Performance"
          subtitle="ROAS and conversion breakdown"
        />
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
                "Campaign",
                "Ad Spend",
                "Revenue",
                "ROAS",
                "Conversions",
                "Performance",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 12px",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: 10,
                    textTransform: "uppercase",
                    textAlign: "left",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: "9px 12px",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                    fontWeight: 700,
                    color: "#cbd5e1",
                  }}
                >
                  {c.name}
                </td>
                <td
                  style={{
                    padding: "9px 12px",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  }}
                >
                  {fmt(c.spend)}
                </td>
                <td
                  style={{
                    padding: "9px 12px",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                    color: "#10b981",
                    fontWeight: 700,
                  }}
                >
                  {fmt(c.revenue)}
                </td>
                <td
                  style={{
                    padding: "9px 12px",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      color:
                        c.roas >= 4
                          ? "#10b981"
                          : c.roas >= 3
                            ? "#f59e0b"
                            : "#ef4444",
                      fontWeight: 800,
                    }}
                  >
                    {c.roas.toFixed(1)}x
                  </span>
                </td>
                <td
                  style={{
                    padding: "9px 12px",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  }}
                >
                  {c.conversions}
                </td>
                <td
                  style={{
                    padding: "9px 12px",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 5,
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 3,
                    }}
                  >
                    <div
                      style={{
                        width: `${(c.roas / 5) * 100}%`,
                        height: "100%",
                        background: c.roas >= 4 ? "#10b981" : "#f59e0b",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Inventory Page ───────────────────────────────────────────────────────────

export function InventoryPage() {
  const {
    inventoryCost,
    inventoryTurnover,
    filteredExpenses,
    monthlyData,
    heatmapData,
    heatMax,
  } = useDerivedData();

  const supplyChainData = (
    ["Inventory", "Manufacturing", "Packaging", "Logistics"] as const
  )
    .map((cat) => ({
      name: cat,
      value: filteredExpenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0),
    }))
    .filter((c) => c.value > 0);

  const supplyColors = ["#10b981", "#8b5cf6", "#ec4899", "#ef4444"];

  const turnoverByMonth = monthlyData.map((m) => {
    const { state } = useDashboard();
    return m; // We compute below with inline hook
  });

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiCard
          label="Inventory Cost"
          value={fmtK(inventoryCost)}
          color="#10b981"
        />
        <KpiCard
          label="Inventory Turnover"
          value={`${inventoryTurnover.toFixed(2)}x`}
          color={
            inventoryTurnover > 4
              ? "#10b981"
              : inventoryTurnover > 2
                ? "#f59e0b"
                : "#ef4444"
          }
          sub="revenue / cost"
        />
        <KpiCard
          label="Manufacturing Cost"
          value={fmtK(
            filteredExpenses
              .filter((e) => e.category === "Manufacturing")
              .reduce((s, e) => s + e.amount, 0),
          )}
          color="#8b5cf6"
        />
        <KpiCard
          label="Packaging Cost"
          value={fmtK(
            filteredExpenses
              .filter((e) => e.category === "Packaging")
              .reduce((s, e) => s + e.amount, 0),
          )}
          color="#ec4899"
        />
      </div>

      {/* Heatmap */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle
          icon="🌡️"
          title="Inventory Expense Heatmap"
          subtitle="Monthly spend intensity by category (darker = higher spend)"
        />
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: 3,
              fontSize: 11,
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "5px 8px",
                    color: "#475569",
                    fontWeight: 700,
                    fontSize: 10,
                    textAlign: "left",
                    width: 110,
                  }}
                >
                  Category
                </th>
                {MONTHS.map((mo) => (
                  <th
                    key={mo}
                    style={{
                      padding: "5px 4px",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: 9,
                      textAlign: "center",
                    }}
                  >
                    {mo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.cat}>
                  <td
                    style={{
                      padding: "5px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: CAT_COLORS[row.cat],
                        display: "inline-block",
                        marginRight: 5,
                      }}
                    />
                    {row.cat}
                  </td>
                  {row.values.map((v, ci) => (
                    <HeatCell key={ci} value={v} max={heatMax} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 9, color: "#475569" }}>Low</span>
          {[
            "rgba(255,255,255,0.04)",
            "#1e3a5f",
            "#1d4ed8",
            "#3b82f6",
            "#93c5fd",
          ].map((c, i) => (
            <div
              key={i}
              style={{ width: 20, height: 12, background: c, borderRadius: 2 }}
            />
          ))}
          <span style={{ fontSize: 9, color: "#475569" }}>High</span>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle
            icon="📦"
            title="Supply Chain Cost Breakdown"
            subtitle="Inventory + Manufacturing + Packaging + Logistics"
          />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={supplyChainData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={3}
              >
                {supplyChainData.map((_, i) => (
                  <Cell key={i} fill={supplyColors[i % supplyColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{
                  background: "#1e293b",
                  border: "none",
                  borderRadius: 8,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle
            icon="🔄"
            title="Turnover Analysis"
            subtitle="Monthly inventory efficiency"
          />
          <InventoryTurnoverChart />
        </Card>
      </div>
    </div>
  );
}

// Sub-component that can safely use hooks
function InventoryTurnoverChart() {
  const { monthlyData } = useDerivedData();
  const { state } = useDashboard();
  const { expenses } = state;

  const data = monthlyData.map((m) => {
    const ym = toYM(m.month);
    const inv = expenses
      .filter((e) => e.date.slice(0, 7) === ym && e.category === "Inventory")
      .reduce((s, e) => s + e.amount, 0);
    return {
      month: m.month,
      turnover: inv > 0 ? parseFloat((m.revenue / inv).toFixed(2)) : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, bottom: 0, left: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={2}
          stroke="rgba(239,68,68,0.5)"
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="turnover"
          name="Turnover"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#10b981" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
