import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { useDerivedData } from "../hooks/useDerivedData";
import { useDashboard } from "../store/DashboardContext";
import {
  Card,
  SectionTitle,
  KpiCard,
  Badge,
  HeatCell,
  CustomTooltip,
  Th,
  Td,
} from "../components/ui";
import { fmtK, fmt, toYM } from "../utils/format";
import { CATEGORIES, MONTHS, CAT_COLORS } from "../utils/constants";
import type { InventoryData } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  fontSize: 11,
  color: "#e2e8f0",
};

const AGING_COLORS: Record<string, string> = {
  "0–30 days": "#10b981",
  "30–60 days": "#f59e0b",
  "60–90 days": "#f97316",
  "90+ days": "#ef4444",
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
  msg = "No inventory data — connect your sheet",
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InventoryPage() {
  const { state } = useDashboard();
  const inv = (state as any).inventory as InventoryData | null;
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "operations" | "financial"
  >("overview");

  // ── Legacy derived data (expense-based) ───────────────────────────────────
  const {
    inventoryCost,
    inventoryTurnover,
    filteredExpenses,
    monthlyData,
    heatmapData,
    heatMax,
  } = useDerivedData();

  const summary = inv?.summary;
  const byProduct = inv?.byProduct ?? [];
  const bySize = inv?.bySize ?? [];
  const byCategory = inv?.byCategory ?? [];
  const aging = inv?.aging ?? [];
  const stockHealth = inv?.stockHealth ?? [];
  const reorderList = inv?.reorderList ?? [];
  const holdingCost = inv?.holdingCost ?? 0;
  const hasInvData = byProduct.length > 0;

  // ── Supply chain breakdown from expenses ──────────────────────────────────
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

  // ── Tab style ─────────────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    background: active ? "rgba(16,185,129,0.18)" : "transparent",
    color: active ? "#34d399" : "#64748b",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── KPI Strip ────────────────────────────────────────────────────── */}
      {summary ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
            }}
          >
            <KpiCard
              label="Total SKUs"
              value={fmtNum(summary.totalSKUs)}
              color="#3b82f6"
              sub="tracked variants"
            />
            <KpiCard
              label="Total Units"
              value={fmtNum(summary.totalUnits)}
              color="#10b981"
              sub="in stock"
            />
            <KpiCard
              label="Inventory Value"
              value={fmtK(summary.totalValue)}
              color="#8b5cf6"
              sub="at cost price"
            />
            <KpiCard
              label="Retail Value"
              value={fmtK(summary.totalRetailValue)}
              color="#f59e0b"
              sub="at selling price"
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
              label="Out of Stock SKUs"
              value={fmtNum(summary.outOfStock)}
              color="#ef4444"
              sub={`${summary.outOfStockRate}% of total`}
            />
            <KpiCard
              label="Low Stock SKUs"
              value={fmtNum(summary.lowStock)}
              color="#f97316"
              sub="≤ 5 units remaining"
            />
            <KpiCard
              label="Dead Stock SKUs"
              value={fmtNum(summary.deadStock)}
              color="#ef4444"
              sub="90+ days, action needed"
            />
            <KpiCard
              label="Potential Margin"
              value={fmtK(summary.potentialMargin)}
              color="#10b981"
              sub="retail − cost value"
            />
          </div>
        </>
      ) : (
        // Fallback to expense-based KPIs
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
          }}
        >
          <KpiCard
            label="Inventory Cost"
            value={fmtK(inventoryCost)}
            color="#10b981"
          />
          <KpiCard
            label="Inventory Turnover"
            value={`${inventoryTurnover.toFixed(2)}×`}
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
        {(["overview", "products", "operations", "financial"] as const).map(
          (t) => (
            <button
              key={t}
              style={tabStyle(activeTab === t)}
              onClick={() => setActiveTab(t)}
            >
              {t === "overview"
                ? "📦 Overview"
                : t === "products"
                  ? "👕 Products"
                  : t === "operations"
                    ? "🔁 Operations"
                    : "💸 Financial"}
            </button>
          ),
        )}
      </div>

      {/* ══════════════ OVERVIEW TAB ══════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* 1. Stock Level by SKU */}
          <Card>
            <SectionTitle
              icon="📊"
              title="Stock Level by Product"
              subtitle="Units available — red = out of stock, amber = low stock"
            />
            {!hasInvData ? (
              <Empty />
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(260, byProduct.length * 36)}
              >
                <BarChart
                  data={byProduct}
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
                    dataKey="title"
                    type="category"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                    tickFormatter={(v: string) =>
                      v.length > 20 ? v.slice(0, 20) + "…" : v
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any, name: string) => [fmtNum(v), name]}
                    labelFormatter={(l) => `Product: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <ReferenceLine
                    x={10}
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeOpacity={0.5}
                  />
                  <Bar
                    dataKey="totalQty"
                    name="Units in Stock"
                    radius={[0, 4, 4, 0]}
                  >
                    {byProduct.map((p, i) => (
                      <Cell
                        key={i}
                        fill={
                          p.totalQty === 0
                            ? "#ef4444"
                            : p.totalQty <= 10
                              ? "#f59e0b"
                              : "#10b981"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Dead vs Moving + Aging */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* 5. Dead vs Moving Stock */}
            <Card>
              <SectionTitle
                icon="🔴"
                title="Dead vs Moving Stock"
                subtitle="Dead = 90+ days in stock — cash trap"
              />
              {stockHealth.length === 0 ? (
                <Empty />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={stockHealth}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        innerRadius={38}
                        paddingAngle={3}
                      >
                        {stockHealth.map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [fmtK(v), "Value"]}
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
                    {stockHealth.map((s) => (
                      <div
                        key={s.label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
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
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {s.label}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#f1f5f9",
                              fontFamily: "monospace",
                            }}
                          >
                            {fmtNum(s.qty)} units
                          </span>
                          {s.value > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "#64748b",
                                marginLeft: 6,
                              }}
                            >
                              ({fmtK(s.value)})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* 4. Stock Aging */}
            <Card>
              <SectionTitle
                icon="⏱"
                title="Stock Aging"
                subtitle="Anything 60+ days = take action (discount / return)"
              />
              {aging.length === 0 ? (
                <Empty />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={aging}
                    margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="qty"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="val"
                      orientation="right"
                      tickFormatter={fmtK}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any, name: string) =>
                        name === "Value" ? [fmtK(v), name] : [fmtNum(v), name]
                      }
                      labelFormatter={(l) => `Aging: ${l}`}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: 11,
                        color: "#64748b",
                        paddingTop: 8,
                      }}
                    />
                    <Bar
                      yAxisId="qty"
                      dataKey="qty"
                      name="Units"
                      radius={[6, 6, 0, 0]}
                    >
                      {aging.map((a, i) => (
                        <Cell
                          key={i}
                          fill={AGING_COLORS[a.bucket] ?? "#64748b"}
                        />
                      ))}
                    </Bar>
                    <Line
                      yAxisId="val"
                      type="monotone"
                      dataKey="value"
                      name="Value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* 7. Size-wise Inventory */}
          <Card>
            <SectionTitle
              icon="📐"
              title="Size-wise Inventory Distribution"
              subtitle="Avoid size imbalance — very common issue in fashion"
            />
            {bySize.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={bySize}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="size"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="qty"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <YAxis
                    yAxisId="val"
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
                      name === "Value" ? [fmtK(v), name] : [fmtNum(v), name]
                    }
                    labelFormatter={(l) => `Size: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    yAxisId="qty"
                    dataKey="qty"
                    name="Units"
                    radius={[6, 6, 0, 0]}
                  >
                    {bySize.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="val"
                    type="monotone"
                    dataKey="value"
                    name="Value"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* 8. Category-wise Inventory Value */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <Card>
              <SectionTitle
                icon="🥧"
                title="Category-wise Inventory Value"
                subtitle="Where your money is locked up"
              />
              {byCategory.length === 0 ? (
                <Empty />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="value"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        innerRadius={38}
                        paddingAngle={3}
                      >
                        {byCategory.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [fmtK(v), "Value"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      marginTop: 8,
                    }}
                  >
                    {byCategory.map((c, i) => (
                      <div
                        key={c.category}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: CHART_COLORS[i % CHART_COLORS.length],
                              display: "inline-block",
                            }}
                          />
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {c.category}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#f1f5f9",
                            fontFamily: "monospace",
                          }}
                        >
                          {fmtK(c.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Supply chain expense breakdown */}
            <Card>
              <SectionTitle
                icon="⛓"
                title="Supply Chain Cost (Expenses)"
                subtitle="Inventory + Manufacturing + Packaging + Logistics spend"
              />
              {supplyChainData.length === 0 ? (
                <Empty msg="No supply chain expense data" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={supplyChainData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={72}
                        innerRadius={38}
                        paddingAngle={3}
                      >
                        {supplyChainData.map((_, i) => (
                          <Cell key={i} fill={supplyColors[i]} />
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
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    {supplyChainData.map((c, i) => (
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
                            background: supplyColors[i],
                            display: "inline-block",
                          }}
                        />
                        {c.name}: {fmtK(c.value)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Expense heatmap */}
          <Card>
            <SectionTitle
              icon="🌡️"
              title="Inventory Expense Heatmap"
              subtitle="Monthly spend intensity by category"
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
          </Card>
        </>
      )}

      {/* ══════════════ PRODUCTS TAB ══════════════════════════════════════ */}
      {activeTab === "products" && (
        <>
          {/* Product table */}
          <Card>
            <SectionTitle
              icon="👕"
              title="All Products — Stock Levels"
              subtitle="Sorted by units in stock"
            />
            {byProduct.length === 0 ? (
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
                        "Product",
                        "Type",
                        "Units",
                        "Value",
                        "Retail",
                        "Price",
                        "Variants",
                        "Sizes",
                        "Status",
                      ].map((h) => (
                        <Th
                          key={h}
                          align={
                            h === "Product" || h === "Type" || h === "Sizes"
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
                    {byProduct.map((p, i) => (
                      <tr key={p.title}>
                        <Td rowIndex={i}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#cbd5e1",
                              fontSize: 11,
                            }}
                          >
                            {p.title.length > 28
                              ? p.title.slice(0, 28) + "…"
                              : p.title}
                          </span>
                        </Td>
                        <Td rowIndex={i}>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {p.productType}
                          </span>
                        </Td>
                        <Td rowIndex={i} align="right">
                          <span
                            style={{
                              fontWeight: 700,
                              color:
                                p.totalQty === 0
                                  ? "#ef4444"
                                  : p.totalQty <= 10
                                    ? "#f59e0b"
                                    : "#10b981",
                            }}
                          >
                            {fmtNum(p.totalQty)}
                          </span>
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#8b5cf6", fontWeight: 700 }}
                        >
                          {fmtK(p.totalValue)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#10b981" }}
                        >
                          {fmtK(p.retailValue)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ fontFamily: "monospace" }}
                        >
                          {fmt(p.price)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#64748b" }}
                        >
                          {p.variants}
                        </Td>
                        <Td rowIndex={i}>
                          <span style={{ fontSize: 10, color: "#64748b" }}>
                            {p.sizes}
                          </span>
                        </Td>
                        <Td rowIndex={i}>
                          <Badge
                            color={
                              p.totalQty === 0
                                ? "#ef4444"
                                : p.outOfStock > 0
                                  ? "#f59e0b"
                                  : "#10b981"
                            }
                          >
                            {p.totalQty === 0
                              ? "Out"
                              : p.outOfStock > 0
                                ? `${p.outOfStock} OOS`
                                : "OK"}
                          </Badge>
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

      {/* ══════════════ OPERATIONS TAB ════════════════════════════════════ */}
      {activeTab === "operations" && (
        <>
          {/* 9. Reorder List */}
          <Card>
            <SectionTitle
              icon="🔔"
              title="Reorder Alert — Low & Out of Stock"
              subtitle="Items needing immediate attention"
            />
            {reorderList.length === 0 ? (
              <Empty msg="No low stock items — inventory looks healthy!" />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 3px",
                    fontSize: 12,
                    minWidth: 560,
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Product",
                        "Size",
                        "Units Left",
                        "Price",
                        "Days in Stock",
                        "Action",
                      ].map((h) => (
                        <Th
                          key={h}
                          align={
                            h === "Product" || h === "Action" ? "left" : "right"
                          }
                        >
                          {h}
                        </Th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reorderList.map((r, i) => (
                      <tr key={`${r.title}-${r.size}`}>
                        <Td rowIndex={i}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: "#cbd5e1",
                              fontSize: 11,
                            }}
                          >
                            {r.title.length > 28
                              ? r.title.slice(0, 28) + "…"
                              : r.title}
                          </span>
                        </Td>
                        <Td rowIndex={i} align="right">
                          <span
                            style={{
                              fontSize: 11,
                              background: "rgba(255,255,255,0.06)",
                              padding: "2px 8px",
                              borderRadius: 6,
                              color: "#94a3b8",
                            }}
                          >
                            {r.size}
                          </span>
                        </Td>
                        <Td rowIndex={i} align="right">
                          <span
                            style={{
                              fontWeight: 800,
                              color:
                                r.qty === 0
                                  ? "#ef4444"
                                  : r.qty <= 5
                                    ? "#f97316"
                                    : "#f59e0b",
                            }}
                          >
                            {r.qty}
                          </span>
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ fontFamily: "monospace" }}
                        >
                          {fmt(r.price)}
                        </Td>
                        <Td
                          rowIndex={i}
                          align="right"
                          style={{ color: "#64748b" }}
                        >
                          {r.daysInStock}d
                        </Td>
                        <Td rowIndex={i}>
                          <Badge
                            color={
                              r.status === "OUT"
                                ? "#ef4444"
                                : r.status === "CRITICAL"
                                  ? "#f97316"
                                  : "#f59e0b"
                            }
                          >
                            {r.status === "OUT"
                              ? "🚨 Restock NOW"
                              : r.status === "CRITICAL"
                                ? "⚠️ Critical"
                                : "↓ Low"}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* 6. Out-of-Stock Rate */}
          <Card>
            <SectionTitle
              icon="📉"
              title="Out-of-Stock Analysis"
              subtitle="SKU level availability breakdown"
            />
            {!hasInvData ? (
              <Empty />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 12,
                }}
              >
                {[
                  {
                    label: "Out of Stock",
                    value: summary?.outOfStock ?? 0,
                    pct: summary?.outOfStockRate ?? 0,
                    color: "#ef4444",
                  },
                  {
                    label: "Low Stock (≤5)",
                    value: summary?.lowStock ?? 0,
                    pct: summary
                      ? (summary.lowStock / summary.totalSKUs) * 100
                      : 0,
                    color: "#f97316",
                  },
                  {
                    label: "Healthy Stock",
                    value:
                      (summary?.totalSKUs ?? 0) -
                      (summary?.outOfStock ?? 0) -
                      (summary?.lowStock ?? 0),
                    pct: summary
                      ? ((summary.totalSKUs -
                          summary.outOfStock -
                          summary.lowStock) /
                          summary.totalSKUs) *
                        100
                      : 0,
                    color: "#10b981",
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
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {item.pct.toFixed(1)}% of SKUs
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
                          width: `${Math.min(item.pct, 100)}%`,
                          background: item.color,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Turnover chart (expense-based) */}
          <Card>
            <SectionTitle
              icon="🔄"
              title="Inventory Turnover Trend"
              subtitle="Revenue ÷ inventory cost per month — higher is better"
            />
            <InventoryTurnoverChart />
          </Card>
        </>
      )}

      {/* ══════════════ FINANCIAL TAB ═════════════════════════════════════ */}
      {activeTab === "financial" && (
        <>
          {/* 12. Inventory Value summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 16,
            }}
          >
            {[
              {
                label: "Cost Value",
                value: summary?.totalValue ?? 0,
                color: "#8b5cf6",
                sub: "money locked in stock",
              },
              {
                label: "Retail Value",
                value: summary?.totalRetailValue ?? 0,
                color: "#10b981",
                sub: "if sold at full price",
              },
              {
                label: "Potential Margin",
                value: summary?.potentialMargin ?? 0,
                color: "#f59e0b",
                sub: "retail − cost",
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${item.color}33`,
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
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: item.color,
                    fontFamily: "monospace",
                  }}
                >
                  {fmtK(item.value)}
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>

          {/* 13. Holding Cost */}
          <Card>
            <SectionTitle
              icon="💸"
              title="Estimated Holding Cost"
              subtitle="2% of inventory value per month — cost of unsold stock"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10,
                  padding: "16px 18px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Estimated Holding Cost
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#ef4444",
                    fontFamily: "monospace",
                  }}
                >
                  {fmtK(holdingCost)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#64748b",
                    marginTop: 6,
                    lineHeight: 1.6,
                  }}
                >
                  Based on avg days in stock × 2% monthly rate.
                  <br />
                  Includes storage, opportunity cost & risk.
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    label: "Avg Days in Stock",
                    value: `${summary?.avgDaysInStock ?? 0} days`,
                    color: "#f59e0b",
                  },
                  {
                    label: "Dead Stock Value",
                    value: fmtK(
                      inv?.stockHealth?.find((s) => s.label.includes("Dead"))
                        ?.value ?? 0,
                    ),
                    color: "#ef4444",
                  },
                  {
                    label: "Total SKUs at Risk",
                    value: fmtNum(summary?.deadStock ?? 0),
                    color: "#f97316",
                  },
                  {
                    label: "Monthly Holding Rate",
                    value: "2% of cost value",
                    color: "#64748b",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: item.color,
                        fontFamily: "monospace",
                      }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Category value bar */}
          <Card>
            <SectionTitle
              icon="📊"
              title="Inventory Value by Category"
              subtitle="Cost vs retail value per category"
            />
            {byCategory.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={byCategory}
                  margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="category"
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
                    formatter={(v: any, name: string) => [fmtK(v), name]}
                    labelFormatter={(l) => `Category: ${l}`}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#64748b",
                      paddingTop: 8,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Cost Value"
                    fill="#8b5cf6"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="retailValue"
                    name="Retail Value"
                    fill="#10b981"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Sub-component (uses hooks safely) ────────────────────────────────────────

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

  const tooltipStyle = {
    background: "#1e293b",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8,
    fontSize: 11,
    color: "#e2e8f0",
  };

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
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: any) => [`${v}×`, "Turnover"]}
          labelFormatter={(l) => `Month: ${l}`}
        />
        <ReferenceLine
          y={2}
          stroke="rgba(239,68,68,0.5)"
          strokeDasharray="4 2"
        />
        <ReferenceLine
          y={4}
          stroke="rgba(16,185,129,0.4)"
          strokeDasharray="4 2"
        />
        <Line
          type="monotone"
          dataKey="turnover"
          name="Turnover"
          stroke="#10b981"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
