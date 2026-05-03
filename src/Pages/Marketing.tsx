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
