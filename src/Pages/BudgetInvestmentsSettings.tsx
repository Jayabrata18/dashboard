import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useDerivedData } from "../hooks/useDerivedData";
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
import { fmt, fmtK } from "../utils/format";
import { CATEGORIES, CAT_COLORS } from "../utils/constants";
import type { Category } from "../types";

// ─── Budget Page ──────────────────────────────────────────────────────────────

export function BudgetPage() {
  const { budgetActual } = useDerivedData();
  const { state, dispatch } = useDashboard();
  const { budgets } = state;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle
          icon="💰"
          title="Budget vs Actual"
          subtitle="Adjust per-category budgets to see real-time variance"
        />

        {/* Budget inputs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minWidth: 120,
              }}
            >
              <label
                style={{
                  fontSize: 9,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {cat}
              </label>
              <input
                type="number"
                value={budgets[cat]}
                onChange={(e) =>
                  dispatch({
                    type: "SET_BUDGET",
                    payload: {
                      cat: cat as Category,
                      value: Number(e.target.value),
                    },
                  })
                }
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 8,
                  color: "#e2e8f0",
                  padding: "5px 8px",
                  fontSize: 11,
                  width: "100%",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={budgetActual}
            margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="cat"
              tick={{ fill: "#475569", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              tickFormatter={fmtK}
              tick={{ fill: "#475569", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="budget"
              name="Budget"
              fill="rgba(255,255,255,0.12)"
              radius={[4, 4, 0, 0]}
            />
            <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
              {budgetActual.map((b, i) => (
                <Cell key={i} fill={b.over ? "#ef4444" : "#10b981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle
          icon="⚖️"
          title="Variance Table"
          subtitle="Over-budget items highlighted in red"
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
                "Category",
                "Budget",
                "Actual",
                "Variance",
                "% Used",
                "Status",
              ].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {budgetActual.map((b, i) => {
              const variance = b.budget - b.actual;
              const pctUsed = b.budget > 0 ? (b.actual / b.budget) * 100 : 0;
              return (
                <tr key={b.cat}>
                  <Td rowIndex={i} style={{ fontWeight: 700 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: CAT_COLORS[b.cat],
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    {b.cat}
                  </Td>
                  <Td rowIndex={i}>{fmt(b.budget)}</Td>
                  <Td
                    rowIndex={i}
                    style={{
                      fontWeight: 700,
                      color: b.over ? "#f87171" : "#f1f5f9",
                    }}
                  >
                    {fmt(b.actual)}
                  </Td>
                  <Td
                    rowIndex={i}
                    style={{
                      color: variance >= 0 ? "#34d399" : "#f87171",
                      fontWeight: 700,
                    }}
                  >
                    {variance >= 0 ? "+" : ""}
                    {fmt(variance)}
                  </Td>
                  <Td rowIndex={i}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: "rgba(255,255,255,0.08)",
                          borderRadius: 2,
                          maxWidth: 80,
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(pctUsed, 100)}%`,
                            height: "100%",
                            background: b.over ? "#ef4444" : "#10b981",
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          color: b.over ? "#f87171" : "#94a3b8",
                        }}
                      >
                        {pctUsed.toFixed(0)}%
                      </span>
                    </div>
                  </Td>
                  <Td rowIndex={i}>
                    <Badge color={b.over ? "#ef4444" : "#10b981"}>
                      {b.over ? "🔴 Over" : "✅ Under"}
                    </Badge>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Investments Page ─────────────────────────────────────────────────────────

export function InvestmentsPage() {
  const { totalInvested, totalCurrentValue, investReturn, investReturnPct } =
    useDerivedData();
  const { state } = useDashboard();
  const { investments } = state;

  const chartData = investments.map((inv) => ({
    name: inv.type.slice(0, 14),
    invested: inv.invested,
    current: inv.current,
    return: inv.current - inv.invested,
  }));

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
          label="Total Invested"
          value={fmtK(totalInvested)}
          color="#3b82f6"
        />
        <KpiCard
          label="Current Value"
          value={fmtK(totalCurrentValue)}
          color="#10b981"
        />
        <KpiCard
          label="Total Return"
          value={fmtK(investReturn)}
          color={investReturn >= 0 ? "#10b981" : "#ef4444"}
        />
        <KpiCard
          label="Return %"
          value={`${investReturnPct.toFixed(1)}%`}
          color={investReturnPct >= 0 ? "#10b981" : "#ef4444"}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <SectionTitle
            icon="📈"
            title="Investment Portfolio"
            subtitle="Invested vs current value"
          />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 10, bottom: 0, left: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#475569", fontSize: 8 }}
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
              <Bar
                dataKey="invested"
                name="Invested"
                fill="rgba(59,130,246,0.6)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="current"
                name="Current Value"
                fill="#10b981"
                fillOpacity={0.85}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon="🏦" title="Investment Details" />
          {investments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "#475569",
                fontSize: 12,
              }}
            >
              No investment data — connect a sheet in Settings
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
                  <Th>Description</Th>
                  <Th align="right">Invested</Th>
                  <Th align="right">Return</Th>
                </tr>
              </thead>
              <tbody>
                {investments.map((inv, i) => {
                  const ret = inv.current - inv.invested;
                  const retPct =
                    inv.invested > 0
                      ? ((ret / inv.invested) * 100).toFixed(1)
                      : "0";
                  return (
                    <tr key={i}>
                      <Td rowIndex={i}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#cbd5e1",
                            fontSize: 11,
                          }}
                        >
                          {inv.description}
                        </div>
                        <div style={{ fontSize: 9, color: "#475569" }}>
                          {inv.type}
                        </div>
                      </Td>
                      <Td rowIndex={i} align="right">
                        {fmtK(inv.invested)}
                      </Td>
                      <Td
                        rowIndex={i}
                        align="right"
                        style={{
                          fontWeight: 700,
                          color: ret >= 0 ? "#34d399" : "#f87171",
                        }}
                      >
                        {ret >= 0 ? "+" : ""}
                        {fmtK(ret)} ({retPct}%)
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

