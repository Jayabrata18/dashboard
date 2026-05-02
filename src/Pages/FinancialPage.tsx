import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useDerivedData } from "../hooks/useDerivedData";
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

  const avgMonthlyBurn = totalExpenses / activeMths;
  const cashRunway = avgMonthlyBurn > 0 ? totalRevenue / avgMonthlyBurn : 0;

  return (
    <div>
      {/* KPI row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <KpiCard
          label="Gross Revenue"
          value={fmtK(totalRevenue)}
          color="#10b981"
          sub="filtered period"
        />
        <KpiCard
          label="Total Expenses"
          value={fmtK(totalExpenses)}
          color="#ef4444"
          sub="filtered period"
        />
        <KpiCard
          label="Net Profit"
          value={fmtK(netProfit)}
          color={netProfit >= 0 ? "#10b981" : "#ef4444"}
          sub="revenue − expenses"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Gauge */}
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

        {/* Burn analysis */}
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
              <Tooltip content={<CustomTooltip />} />
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

      {/* Category deep dive */}
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
