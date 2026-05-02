import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDerivedData, useDerivedData1 } from "../hooks/useDerivedData";
import { useDashboard } from "../store/DashboardContext";
import { Card, SectionTitle, KpiCard, CustomTooltip } from "../components/ui";
import { fmt, fmtK } from "../utils/format";
import { CHART_COLORS } from "../utils/constants";

export function OverviewPage() {
  const {
    filteredExpenses,
    totalExpenses,
    totalRevenue,
    netProfit,
    margin,
    monthlyData,
    catBreakdown,
    payBreakdown,
    revSpark,
    expSpark,
  } = useDerivedData();

  const { totalExpenses1, totalRevenue1 } = useDerivedData1();

  const { state } = useDashboard();
  const { syncStatus } = state;

  // Last entry date from filtered expenses
  const lastEntryDate = filteredExpenses.length
    ? filteredExpenses.reduce((latest, e) =>
        e.date > latest.date ? e : latest,
      ).date
    : "—";

  const profitMarginColor =
    margin > 15 ? "#10b981" : margin > 0 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      {/* ── KPI row ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiCard
          label="Total Revenue"
          value={fmtK(totalRevenue1)}
          trend={12.4}
          sparkData={revSpark}
          color="#10b981"
          sub="YTD"
        />
        <KpiCard
          label="Total Expenses"
          value={fmtK(totalExpenses1)}
          trend={-8.2}
          sparkData={expSpark}
          color="#ef4444"
          sub="YTD"
        />
        <KpiCard
          label="Net Profit"
          value={fmtK(totalRevenue1 - totalExpenses1)}
          trend={
            totalRevenue1 > 0
              ? ((totalRevenue1 - totalExpenses1) / totalRevenue1) * 100
              : 0
          }
          color={totalRevenue1 - totalExpenses1 >= 0 ? "#10b981" : "#ef4444"}
          sub="YTD"
        />
        <KpiCard
          label="Profit Margin"
          value={`${totalRevenue1 > 0 ? (((totalRevenue1 - totalExpenses1) / totalRevenue1) * 100).toFixed(1) : "0.0"}%`}
          color={profitMarginColor}
          sub="of revenue"
        />
      </div>

      {/* ── Main charts row ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card>
          <SectionTitle
            icon="📈"
            title="Revenue vs Expenses"
            subtitle="Monthly comparison"
          />
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={monthlyData}
              margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
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
                dot={{ r: 4, fill: "#3b82f6" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle
            icon="🥧"
            title="Expense Breakdown"
            subtitle="By category"
          />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={catBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                innerRadius={38}
                paddingAngle={2}
              >
                {catBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) =>
                  typeof value === "number" ? fmtK(value) : ""
                }
                contentStyle={{
                  background: "#1e293b",
                  border: "none",
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {catBreakdown.map((c) => (
              <div
                key={c.name}
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
                    background: c.color,
                    display: "inline-block",
                  }}
                />
                {c.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Bottom row ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
        }}
      >
        {/* Top expenses */}
        <Card>
          <SectionTitle
            icon="🔥"
            title="Top Expenses"
            subtitle="Largest transactions"
          />
          {filteredExpenses.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data — connect a Google Sheet in Settings
            </div>
          ) : (
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
                  <th
                    style={{
                      padding: "8px 12px",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      textAlign: "left",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: "8px 12px",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      textAlign: "right",
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...filteredExpenses]
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 6)
                  .map((e, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          padding: "9px 12px",
                          background:
                            i % 2 === 0
                              ? "rgba(255,255,255,0.03)"
                              : "transparent",
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#cbd5e1" }}>
                          {e.description || e.category}
                        </div>
                        <div style={{ fontSize: 10, color: "#475569" }}>
                          {e.category} · {e.date}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "9px 12px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#f87171",
                          background:
                            i % 2 === 0
                              ? "rgba(255,255,255,0.03)"
                              : "transparent",
                        }}
                      >
                        {fmt(e.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Payment modes */}
        <Card>
          <SectionTitle
            icon="💳"
            title="Payment Modes"
            subtitle="Expense by payment method"
          />
          {payBreakdown.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "16px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={payBreakdown}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={fmtK}
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
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                  {payBreakdown.map((_, i) => (
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

        {/* Data status */}
        <Card>
          <SectionTitle
            icon="📊"
            title="Data Status"
            subtitle="Sync & persistence"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                label: "Data Source",
                value: state.webAppUrl ? "Google Sheet" : "No sheet connected",
                color: state.webAppUrl ? "#10b981" : "#f59e0b",
              },
              {
                label: "Total Records",
                value: `${filteredExpenses.length} expenses`,
                color: "#3b82f6",
              },
              {
                label: "Last Entry Date",
                value: lastEntryDate,
                color: "#8b5cf6",
              },
              {
                label: "Sync Status",
                value:
                  syncStatus === "ok"
                    ? "Live ✓"
                    : syncStatus === "syncing"
                      ? "Syncing…"
                      : syncStatus === "error"
                        ? "Error ✗"
                        : "Not connected",
                color:
                  syncStatus === "ok"
                    ? "#10b981"
                    : syncStatus === "error"
                      ? "#ef4444"
                      : "#f59e0b",
              },
              {
                label: "Write Protection",
                value: "Read-only mode ✓",
                color: "#10b981",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "7px 0",
                  borderBottom:
                    i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  {item.label}
                </span>
                <span
                  style={{ color: item.color, fontWeight: 700, fontSize: 11 }}
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
