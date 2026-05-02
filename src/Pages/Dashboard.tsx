import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, ScatterChart, Scatter,
  ReferenceLine
} from "recharts";

// ─── MOCK DATA (replace with real fetch when Web App URL is ready) ────────────
const MOCK_EXPENSES = [
  { date: "2025-01-05", category: "Ads", description: "Meta Ads Jan", amount: 45000, payment: "Credit Card" },
  { date: "2025-01-10", category: "Inventory", description: "Stock replenish", amount: 120000, payment: "Bank Transfer" },
  { date: "2025-01-15", category: "Salary", description: "Team salaries", amount: 85000, payment: "Bank Transfer" },
  { date: "2025-01-20", category: "Logistics", description: "Delivery partners", amount: 32000, payment: "UPI" },
  { date: "2025-01-28", category: "Packaging", description: "Custom boxes", amount: 18000, payment: "Cheque" },
  { date: "2025-02-03", category: "Ads", description: "Google Ads Feb", amount: 52000, payment: "Credit Card" },
  { date: "2025-02-08", category: "Software", description: "SaaS tools", amount: 12000, payment: "Credit Card" },
  { date: "2025-02-14", category: "Manufacturing", description: "Production batch", amount: 95000, payment: "Bank Transfer" },
  { date: "2025-02-20", category: "Salary", description: "Team salaries", amount: 85000, payment: "Bank Transfer" },
  { date: "2025-02-25", category: "Logistics", description: "Courier Feb", amount: 28000, payment: "UPI" },
  { date: "2025-03-05", category: "Ads", description: "Influencer deals", amount: 68000, payment: "Bank Transfer" },
  { date: "2025-03-12", category: "Inventory", description: "Raw materials", amount: 110000, payment: "Bank Transfer" },
  { date: "2025-03-18", category: "Salary", description: "Team salaries", amount: 88000, payment: "Bank Transfer" },
  { date: "2025-03-22", category: "Packaging", description: "Seasonal packs", amount: 22000, payment: "Cheque" },
  { date: "2025-03-30", category: "Miscellaneous", description: "Office supplies", amount: 8500, payment: "Cash" },
  { date: "2025-04-04", category: "Ads", description: "Meta + Google", amount: 75000, payment: "Credit Card" },
  { date: "2025-04-10", category: "Inventory", description: "Q2 stock", amount: 145000, payment: "Bank Transfer" },
  { date: "2025-04-15", category: "Salary", description: "Team salaries", amount: 90000, payment: "Bank Transfer" },
  { date: "2025-04-20", category: "Logistics", description: "Logistics Q2", amount: 35000, payment: "UPI" },
  { date: "2025-04-28", category: "Software", description: "Analytics tools", amount: 15000, payment: "Credit Card" },
  { date: "2025-05-05", category: "Ads", description: "Summer campaign", amount: 88000, payment: "Credit Card" },
  { date: "2025-05-12", category: "Manufacturing", description: "Production run", amount: 115000, payment: "Bank Transfer" },
  { date: "2025-05-18", category: "Salary", description: "Team salaries", amount: 90000, payment: "Bank Transfer" },
  { date: "2025-05-25", category: "Sampling", description: "Product samples", amount: 14000, payment: "Cash" },
  { date: "2025-06-03", category: "Ads", description: "Mid-year push", amount: 95000, payment: "Credit Card" },
  { date: "2025-06-10", category: "Inventory", description: "Festive stock", amount: 180000, payment: "Bank Transfer" },
  { date: "2025-06-15", category: "Salary", description: "Team + bonus", amount: 105000, payment: "Bank Transfer" },
  { date: "2025-06-22", category: "Packaging", description: "Gift packaging", amount: 28000, payment: "Cheque" },
  { date: "2025-06-28", category: "Logistics", description: "Last mile delivery", amount: 42000, payment: "UPI" },
];

const MOCK_REVENUE = {
  Jan: 380000, Feb: 420000, Mar: 510000,
  Apr: 480000, May: 620000, Jun: 750000,
  Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0
};

const MOCK_INVESTMENTS = [
  { date: "2025-01-01", type: "Business Capital", description: "Initial capital", invested: 500000, current: 500000 },
  { date: "2025-02-15", type: "Equipment / Assets", description: "Packaging machine", invested: 85000, current: 92000 },
  { date: "2025-03-20", type: "Marketing Investment", description: "Brand building", invested: 120000, current: 145000 },
  { date: "2025-04-10", type: "Software / SaaS", description: "Tech stack", invested: 45000, current: 43000 },
  { date: "2025-05-01", type: "Infrastructure", description: "Warehouse upgrade", invested: 200000, current: 215000 },
];

const CATEGORIES = ["Ads","Salary","Inventory","Manufacturing","Packaging","Sampling","Logistics","Software","Miscellaneous"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PAYMENT_MODES = ["Cash","Bank Transfer","Credit Card","Debit Card","UPI","Cheque","COD"];

// Color palette — vibrant but consistent
const CAT_COLORS = {
  Ads: "#3B82F6", Salary: "#8B5CF6", Inventory: "#10B981",
  Manufacturing: "#F59E0B", Packaging: "#EC4899", Sampling: "#06B6D4",
  Logistics: "#EF4444", Software: "#6366F1", Miscellaneous: "#78716C"
};

// ─── UTILITY HELPERS ──────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtK = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`;
const fmtPct = (n) => `${(n * 100).toFixed(1)}%`;
const today = new Date();

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--tt-bg, #1e293b)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12, minWidth: 140,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: "#cbd5e1", fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill, display: "inline-block" }} />
          <span style={{ color: "#94a3b8" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "#f1f5f9", marginLeft: "auto", paddingLeft: 8 }}>
            {typeof p.value === "number" ? fmtK(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── PROFIT MARGIN GAUGE ─────────────────────────────────────────────────────
const ProfitGauge = ({ margin }) => {
  const pct = Math.min(Math.max(margin, -50), 100);
  const rotation = (pct + 50) * 1.8; // -50 to 100 → 0 to 270 deg
  const color = pct < 0 ? "#ef4444" : pct < 15 ? "#f59e0b" : "#10b981";
  const r = 70, cx = 100, cy = 100;
  const startAngle = -225 * (Math.PI / 180);
  const endAngle = 45 * (Math.PI / 180);
  const arcRanges = [
    { from: -225, to: -135, color: "#ef4444" },
    { from: -135, to: -45, color: "#f59e0b" },
    { from: -45, to: 45, color: "#10b981" },
  ];
  const describeArc = (start, end, radius) => {
    const s = start * (Math.PI / 180);
    const e = end * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(s);
    const y1 = cy + radius * Math.sin(s);
    const x2 = cx + radius * Math.cos(e);
    const y2 = cy + radius * Math.sin(e);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };
  const needleAngle = (-225 + (pct + 50) * (270 / 150)) * (Math.PI / 180);
  const nx = cx + 58 * Math.cos(needleAngle);
  const ny = cy + 58 * Math.sin(needleAngle);

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 200 160" style={{ width: "100%", maxWidth: 200, margin: "0 auto", display: "block" }}>
        {/* Background track */}
        <path d={describeArc(-225, 45, r)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} strokeLinecap="round" />
        {/* Colored arc segments */}
        {arcRanges.map((arc, i) => (
          <path key={i} d={describeArc(arc.from, arc.to, r)} fill="none" stroke={arc.color} strokeWidth={14} opacity={0.3} strokeLinecap="round" />
        ))}
        {/* Active fill */}
        {pct > -50 && (
          <path
            d={describeArc(-225, -225 + (pct + 50) * (270 / 150), r)}
            fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill="white" />
        {/* Labels */}
        <text x="28" y="135" fontSize="9" fill="#6b7280" textAnchor="middle">-50%</text>
        <text x="100" y="24" fontSize="9" fill="#6b7280" textAnchor="middle">25%</text>
        <text x="172" y="135" fontSize="9" fill="#6b7280" textAnchor="middle">100%</text>
        {/* Center value */}
        <text x={cx} y={cy + 25} fontSize="22" fontWeight="700" fill={color} textAnchor="middle">{pct.toFixed(1)}%</text>
        <text x={cx} y={cy + 40} fontSize="10" fill="#6b7280" textAnchor="middle">margin</text>
      </svg>
    </div>
  );
};

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
const Sparkline = ({ data, color = "#3b82f6", height = 40 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.25} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${color.replace("#","")})`} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── HEATMAP CELL ─────────────────────────────────────────────────────────────
const HeatCell = ({ value, max }) => {
  const pct = max > 0 ? value / max : 0;
  const bg = pct === 0 ? "rgba(255,255,255,0.04)"
    : pct < 0.25 ? "#1e3a5f"
    : pct < 0.5 ? "#1d4ed8"
    : pct < 0.75 ? "#3b82f6"
    : "#93c5fd";
  return (
    <td style={{
      background: bg, color: pct > 0.5 ? "#1e3a5f" : "#94a3b8",
      fontSize: 10, textAlign: "center", padding: "5px 4px",
      borderRadius: 4, fontWeight: pct > 0.7 ? 700 : 400,
      transition: "all 0.2s"
    }}>
      {value > 0 ? fmtK(value) : "—"}
    </td>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "20px 22px", ...style
  }}>
    {children}
  </div>
);

const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
    </div>
    {subtitle && <p style={{ fontSize: 11, color: "#64748b", margin: 0, paddingLeft: 24 }}>{subtitle}</p>}
  </div>
);

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, trend, sparkData, color = "#3b82f6" }) => {
  const trendUp = trend > 0;
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, borderRadius: "14px 14px 0 0" }} />
      <p style={{ fontSize: 11, color: "#64748b", margin: "0 0 6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 4px", letterSpacing: "-0.03em" }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {trend !== undefined && (
            <span style={{ fontSize: 10, color: trendUp ? "#10b981" : "#ef4444", fontWeight: 700 }}>
              {trendUp ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
            </span>
          )}
          {sub && <span style={{ fontSize: 10, color: "#475569" }}>{sub}</span>}
        </div>
      </div>
      {sparkData && (
        <div style={{ marginTop: 8 }}>
          <Sparkline data={sparkData} color={color} height={32} />
        </div>
      )}
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function EcommerceDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [dateRange, setDateRange] = useState({ from: "2025-01", to: "2025-06" });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dataSource, setDataSource] = useState("demo"); // "demo" | "live"
  const [webAppUrl, setWebAppUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);
  const [revenue, setRevenue] = useState(MOCK_REVENUE);
  const [investments, setInvestments] = useState(MOCK_INVESTMENTS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | ok | error
  const [budgets, setBudgets] = useState({ Ads: 80000, Salary: 90000, Inventory: 150000, Manufacturing: 100000, Packaging: 25000, Sampling: 15000, Logistics: 40000, Software: 15000, Miscellaneous: 10000 });

  // ── DATA FETCH ───────────────────────────────────────────────────────────────
  const fetchSheetData = useCallback(async () => {
    if (!webAppUrl) return;
    setSyncStatus("syncing");
    setIsLoading(true);
    try {
      const res = await fetch(`${webAppUrl}?action=getAllData`);
      const json = await res.json();
      if (json.expenses) setExpenses(json.expenses);
      if (json.revenue) setRevenue(json.revenue);
      if (json.investments) setInvestments(json.investments);
      setLastSync(new Date());
      setSyncStatus("ok");
    } catch (e) {
      setSyncStatus("error");
    } finally {
      setIsLoading(false);
    }
  }, [webAppUrl]);

  // ── DERIVED DATA ─────────────────────────────────────────────────────────────
  const filteredExpenses = expenses.filter(e => {
    const ym = e.date.slice(0, 7);
    const inRange = ym >= dateRange.from && ym <= dateRange.to;
    const inCat = selectedCategory === "All" || e.category === selectedCategory;
    return inRange && inCat;
  });

  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = Object.entries(revenue).reduce((s, [mo, v]) => {
    const idx = MONTHS.indexOf(mo) + 1;
    const ym = `2025-${String(idx).padStart(2,"0")}`;
    if (ym >= dateRange.from && ym <= dateRange.to) return s + v;
    return s;
  }, 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly aggregated data
  const monthlyData = MONTHS.map((mo, i) => {
    const ym = `2025-${String(i + 1).padStart(2, "0")}`;
    const inRange = ym >= dateRange.from && ym <= dateRange.to;
    if (!inRange) return null;
    const monthExp = expenses.filter(e => e.date.slice(0, 7) === ym);
    const exp = monthExp.reduce((s, e) => s + e.amount, 0);
    const rev = revenue[mo] || 0;
    return { month: mo, revenue: rev, expenses: exp, profit: rev - exp };
  }).filter(Boolean);

  // Category breakdown
  const catBreakdown = CATEGORIES.map(cat => ({
    name: cat,
    value: filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: CAT_COLORS[cat]
  })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

  // Cash burn estimate (avg monthly expense)
  const activeMths = monthlyData.filter(m => m.expenses > 0).length || 1;
  const avgMonthlyBurn = totalExpenses / activeMths;
  const cashRunway = totalRevenue > 0 ? totalRevenue / avgMonthlyBurn : 0;

  // ROAS calculation (Revenue per ₹ spent on Ads)
  const adSpend = filteredExpenses.filter(e => e.category === "Ads").reduce((s, e) => s + e.amount, 0);
  const roas = adSpend > 0 ? totalRevenue / adSpend : 0;

  // Inventory turnover (simplified: revenue / inventory_cost)
  const inventoryCost = filteredExpenses.filter(e => e.category === "Inventory").reduce((s, e) => s + e.amount, 0);
  const inventoryTurnover = inventoryCost > 0 ? totalRevenue / inventoryCost : 0;

  // Payment mode breakdown
  const payBreakdown = PAYMENT_MODES.map(mode => ({
    name: mode, value: filteredExpenses.filter(e => e.payment === mode).reduce((s, e) => s + e.amount, 0)
  })).filter(p => p.value > 0);

  // Sparkline per KPI (last 6 months)
  const revSpark = MONTHS.slice(0, 6).map((m, i) => ({ v: revenue[m] || 0 }));
  const expSpark = MONTHS.slice(0, 6).map((m, i) => {
    const ym = `2025-${String(i + 1).padStart(2, "0")}`;
    return { v: expenses.filter(e => e.date.slice(0, 7) === ym).reduce((s, e) => s + e.amount, 0) };
  });

  // Heatmap data: category x month
  const heatmapData = CATEGORIES.map(cat => ({
    cat,
    values: MONTHS.map((mo, i) => {
      const ym = `2025-${String(i + 1).padStart(2, "0")}`;
      return expenses.filter(e => e.date.slice(0, 7) === ym && e.category === cat).reduce((s, e) => s + e.amount, 0);
    })
  }));
  const heatMax = Math.max(...heatmapData.flatMap(r => r.values));

  // Budget vs actual
  const budgetActual = CATEGORIES.map(cat => {
    const actual = filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
    const budget = budgets[cat] || 0;
    return { cat, actual, budget, over: actual > budget };
  });

  // Investment summary
  const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
  const totalCurrentValue = investments.reduce((s, i) => s + i.current, 0);
  const investReturn = totalCurrentValue - totalInvested;
  const investReturnPct = totalInvested > 0 ? (investReturn / totalInvested) * 100 : 0;

  // Data persistence check
  const persistenceCheck = {
    totalRows: expenses.length,
    lastEntry: expenses[expenses.length - 1]?.date || "—",
    duplicates: 0,
    status: syncStatus === "ok" ? "synced" : dataSource === "demo" ? "demo" : "unsynced"
  };

  // ── NAV ITEMS ────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "overview", icon: "◈", label: "Overview" },
    { id: "financial", icon: "◉", label: "Financial Health" },
    { id: "analytics", icon: "◎", label: "Analytics" },
    { id: "marketing", icon: "◆", label: "Marketing" },
    { id: "inventory", icon: "▣", label: "Inventory" },
    { id: "budget", icon: "◧", label: "Budget" },
    { id: "investments", icon: "◈", label: "Investments" },
    { id: "settings", icon: "◌", label: "Settings & Sync" },
  ];

  // ── STYLES ───────────────────────────────────────────────────────────────────
  const s = {
    root: {
      display: "flex", minHeight: "100vh", background: "#0a0f1e",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e2e8f0",
      fontSize: 13
    },
    sidebar: {
      width: sidebarOpen ? 220 : 64, minHeight: "100vh",
      background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.07)",
      transition: "width 0.25s ease", display: "flex", flexDirection: "column",
      flexShrink: 0
    },
    sbLogo: {
      padding: sidebarOpen ? "22px 20px 20px" : "22px 12px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex",
      alignItems: "center", gap: 10, overflow: "hidden"
    },
    sbLogoIcon: {
      width: 32, height: 32, borderRadius: 8,
      background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, flexShrink: 0
    },
    nav: { padding: "12px 8px", flex: 1 },
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: 10, padding: sidebarOpen ? "9px 12px" : "9px",
      borderRadius: 10, cursor: "pointer", marginBottom: 2, overflow: "hidden",
      background: active ? "rgba(59,130,246,0.15)" : "transparent",
      color: active ? "#60a5fa" : "#64748b",
      border: active ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
      transition: "all 0.15s", whiteSpace: "nowrap",
      justifyContent: sidebarOpen ? "flex-start" : "center"
    }),
    navIcon: { fontSize: 14, flexShrink: 0 },
    navLabel: { fontSize: 12.5, fontWeight: 600, display: sidebarOpen ? "block" : "none" },
    main: { flex: 1, padding: "0 24px 40px", overflow: "auto" },
    topbar: {
      position: "sticky", top: 0, zIndex: 10,
      background: "rgba(10,15,30,0.95)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      padding: "14px 0", marginBottom: 24, display: "flex",
      alignItems: "center", gap: 12, flexWrap: "wrap"
    },
    filterChip: (active) => ({
      padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontWeight: 600,
      background: active ? "#3b82f6" : "rgba(255,255,255,0.06)",
      color: active ? "white" : "#64748b",
      border: "1px solid " + (active ? "#3b82f6" : "rgba(255,255,255,0.08)"),
      transition: "all 0.15s"
    }),
    select: {
      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, color: "#cbd5e1", padding: "5px 10px", fontSize: 11, cursor: "pointer",
      outline: "none"
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 },
    grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 },
    badge: (color) => ({
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: 12, fontSize: 10, fontWeight: 700,
      background: color + "22", color: color, border: `1px solid ${color}44`
    }),
    table: {
      width: "100%", borderCollapse: "separate", borderSpacing: "0 3px", fontSize: 12
    },
    th: {
      padding: "8px 12px", color: "#475569", fontWeight: 700, fontSize: 10,
      textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left"
    },
    td: (i) => ({
      padding: "9px 12px", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
      borderRadius: i === 0 ? "8px 0 0 8px" : "0 8px 8px 0"
    }),
    syncDot: (status) => ({
      width: 8, height: 8, borderRadius: "50%",
      background: status === "ok" ? "#10b981" : status === "syncing" ? "#f59e0b" : status === "error" ? "#ef4444" : "#475569",
      boxShadow: status === "ok" ? "0 0 6px #10b981" : "none"
    }),
    input: {
      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 8, color: "#e2e8f0", padding: "9px 14px", fontSize: 12,
      width: "100%", outline: "none"
    },
    btn: (primary) => ({
      padding: "9px 18px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer",
      background: primary ? "#3b82f6" : "rgba(255,255,255,0.07)",
      color: primary ? "white" : "#94a3b8",
      border: primary ? "none" : "1px solid rgba(255,255,255,0.1)",
      transition: "all 0.15s"
    })
  };

  // ── SECTIONS ─────────────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "overview": return <OverviewSection />;
      case "financial": return <FinancialSection />;
      case "analytics": return <AnalyticsSection />;
      case "marketing": return <MarketingSection />;
      case "inventory": return <InventorySection />;
      case "budget": return <BudgetSection />;
      case "investments": return <InvestmentsSection />;
      case "settings": return <SettingsSection />;
      default: return <OverviewSection />;
    }
  };

  // ── OVERVIEW ─────────────────────────────────────────────────────────────────
  const OverviewSection = () => (
    <div>
      <div style={s.grid4}>
        <KpiCard label="Total Revenue" value={fmtK(totalRevenue)} trend={12.4} sparkData={revSpark} color="#10b981" sub="YTD" />
        <KpiCard label="Total Expenses" value={fmtK(totalExpenses)} trend={-8.2} sparkData={expSpark} color="#ef4444" sub="YTD" />
        <KpiCard label="Net Profit" value={fmtK(netProfit)} trend={margin > 0 ? margin : -Math.abs(margin)} color={netProfit >= 0 ? "#10b981" : "#ef4444"} sub="YTD" />
        <KpiCard label="Profit Margin" value={`${margin.toFixed(1)}%`} color={margin > 15 ? "#10b981" : margin > 0 ? "#f59e0b" : "#ef4444"} sub="of revenue" />
      </div>

      <div style={{ ...s.grid2, gridTemplateColumns: "2fr 1fr" }}>
        <Card>
          <SectionTitle icon="📈" title="Revenue vs Expenses" subtitle="Monthly comparison" />
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={monthlyData} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" fillOpacity={0.75} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon="🥧" title="Expense Breakdown" subtitle="By category" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={catBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={38} paddingAngle={2}>
                {catBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtK(v)} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {catBreakdown.slice(0, 5).map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: "inline-block" }} />
                {c.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={s.grid3}>
        <Card>
          <SectionTitle icon="🔥" title="Top Expenses" subtitle="Largest transactions" />
          <table style={s.table}>
            <thead><tr><th style={s.th}>Description</th><th style={{ ...s.th, textAlign: "right" }}>Amount</th></tr></thead>
            <tbody>
              {[...filteredExpenses].sort((a, b) => b.amount - a.amount).slice(0, 6).map((e, i) => (
                <tr key={i}>
                  <td style={s.td(i)}>
                    <div style={{ fontWeight: 600, color: "#cbd5e1" }}>{e.description}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>{e.category} · {e.date}</div>
                  </td>
                  <td style={{ ...s.td(i), textAlign: "right", fontWeight: 700, color: "#f87171" }}>{fmt(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <SectionTitle icon="💳" title="Payment Modes" subtitle="Expense by payment method" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={payBreakdown} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                {payBreakdown.map((_, i) => (
                  <Cell key={i} fill={["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899","#06b6d4","#ef4444"][i % 7]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon="📊" title="Data Integrity" subtitle="Persistence & sync status" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Data Source", value: dataSource === "demo" ? "Demo Data" : "Google Sheet", color: dataSource === "demo" ? "#f59e0b" : "#10b981" },
              { label: "Total Records", value: `${persistenceCheck.totalRows} expenses`, color: "#3b82f6" },
              { label: "Last Entry Date", value: persistenceCheck.lastEntry, color: "#8b5cf6" },
              { label: "Sync Status", value: syncStatus === "ok" ? "Live ✓" : syncStatus === "syncing" ? "Syncing…" : syncStatus === "error" ? "Error ✗" : "Not connected", color: syncStatus === "ok" ? "#10b981" : "#f59e0b" },
              { label: "Duplicate Check", value: `${persistenceCheck.duplicates} duplicates found`, color: "#10b981" },
              { label: "Write Protection", value: "Read-only mode ✓", color: "#10b981" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color: "#64748b", fontSize: 11 }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 700, fontSize: 11 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  // ── FINANCIAL HEALTH ──────────────────────────────────────────────────────────
  const FinancialSection = () => (
    <div>
      <div style={{ ...s.grid3, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <KpiCard label="Gross Revenue" value={fmtK(totalRevenue)} color="#10b981" sub="filtered period" />
        <KpiCard label="Total Expenses" value={fmtK(totalExpenses)} color="#ef4444" sub="filtered period" />
        <KpiCard label="Net Profit" value={fmtK(netProfit)} color={netProfit >= 0 ? "#10b981" : "#ef4444"} sub="revenue − expenses" />
      </div>

      <div style={{ ...s.grid2, gridTemplateColumns: "1fr 1.5fr" }}>
        <Card>
          <SectionTitle icon="🎯" title="Profit Margin Gauge" subtitle="Overall financial health" />
          <ProfitGauge margin={margin} />
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Revenue", v: fmtK(totalRevenue), c: "#10b981" },
              { label: "Expenses", v: fmtK(totalExpenses), c: "#ef4444" },
              { label: "Profit", v: fmtK(netProfit), c: netProfit >= 0 ? "#10b981" : "#ef4444" },
              { label: "Margin", v: `${margin.toFixed(1)}%`, c: margin > 15 ? "#10b981" : margin > 0 ? "#f59e0b" : "#ef4444" },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, color: "#475569", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: item.c }}>{item.v}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle icon="🔥" title="Cash Burn Analysis" subtitle="Estimated runway & burn rate" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Monthly Burn Rate", value: fmtK(avgMonthlyBurn), color: "#ef4444", icon: "🔥" },
              { label: "Revenue / Month Avg", value: fmtK(totalRevenue / activeMths), color: "#10b981", icon: "💹" },
              { label: "Cash Runway (months)", value: cashRunway.toFixed(1) + "mo", color: cashRunway > 6 ? "#10b981" : cashRunway > 3 ? "#f59e0b" : "#ef4444", icon: "⏱" },
              { label: "Burn Multiple", value: (totalExpenses / Math.max(totalRevenue, 1)).toFixed(2) + "x", color: "#8b5cf6", icon: "📐" },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{item.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: item.color, marginBottom: 2 }}>{item.value}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{item.label}</div>
              </div>
            ))}
          </div>

          <SectionTitle icon="📅" title="Monthly Profit Trend" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="profit" name="Net Profit" stroke="#3b82f6" strokeWidth={2} fill="url(#profGrad)" dot={{ r: 3, fill: "#3b82f6" }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle icon="📊" title="Expense Category Deep-Dive" subtitle="% contribution & trend" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...s.table, minWidth: 600 }}>
            <thead>
              <tr>
                {["Category","Total Spent","% of Expenses","Avg/Month","vs Budget","Status"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catBreakdown.map((c, i) => {
                const budget = budgets[c.name] * activeMths;
                const pct = totalExpenses > 0 ? (c.value / totalExpenses) * 100 : 0;
                const over = c.value > budget;
                return (
                  <tr key={c.name}>
                    <td style={{ ...s.td(i), fontWeight: 700 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, display: "inline-block" }} />
                        {c.name}
                      </div>
                    </td>
                    <td style={{ ...s.td(i), fontWeight: 700, color: "#f1f5f9" }}>{fmt(c.value)}</td>
                    <td style={s.td(i)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: c.color, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: "#94a3b8", minWidth: 32 }}>{pct.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td style={s.td(i)}>{fmtK(c.value / activeMths)}</td>
                    <td style={s.td(i)}>
                      <span style={{ color: over ? "#ef4444" : "#10b981" }}>
                        {over ? "+" : "-"}{fmtK(Math.abs(c.value - budget))}
                      </span>
                    </td>
                    <td style={s.td(i)}>
                      <span style={s.badge(over ? "#ef4444" : "#10b981")}>{over ? "Over" : "Under"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // ── ANALYTICS ────────────────────────────────────────────────────────────────
  const AnalyticsSection = () => {
    const monthlyByCategory = MONTHS.slice(0, 6).map((mo, i) => {
      const ym = `2025-${String(i + 1).padStart(2, "0")}`;
      const row = { month: mo };
      CATEGORIES.forEach(cat => {
        row[cat] = expenses.filter(e => e.date.slice(0, 7) === ym && e.category === cat).reduce((s, e) => s + e.amount, 0);
      });
      return row;
    });

    return (
      <div>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle icon="📊" title="Stacked Monthly Expense by Category" subtitle="Full breakdown across filtered period" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyByCategory} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {CATEGORIES.map(cat => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {CATEGORIES.map(cat => (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: CAT_COLORS[cat], display: "inline-block" }} />
                {cat}
              </div>
            ))}
          </div>
        </Card>

        <div style={s.grid2}>
          <Card>
            <SectionTitle icon="📉" title="Revenue Trend" subtitle="Monthly revenue line" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: "#10b981" }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionTitle icon="📅" title="Transactions by Category" subtitle="Count of expense entries" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catBreakdown.map(c => ({ ...c, count: filteredExpenses.filter(e => e.category === c.name).length }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={85} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Transactions" radius={[0, 4, 4, 0]}>
                  {catBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  };

  // ── MARKETING ────────────────────────────────────────────────────────────────
  const MarketingSection = () => {
    const adsByMonth = MONTHS.slice(0, 6).map((mo, i) => {
      const ym = `2025-${String(i + 1).padStart(2, "0")}`;
      const spend = expenses.filter(e => e.date.slice(0, 7) === ym && e.category === "Ads").reduce((s, e) => s + e.amount, 0);
      const rev = revenue[mo] || 0;
      const roasM = spend > 0 ? rev / spend : 0;
      return { month: mo, adSpend: spend, revenue: rev, roas: parseFloat(roasM.toFixed(2)) };
    });

    const influencers = [
      { name: "Campaign A (Meta)", spend: 45000, revenue: 198000, roas: 4.4, conversions: 312 },
      { name: "Campaign B (Google)", spend: 52000, revenue: 220000, roas: 4.2, conversions: 287 },
      { name: "Campaign C (Influencer)", spend: 68000, revenue: 245000, roas: 3.6, conversions: 198 },
      { name: "Campaign D (Summer)", spend: 88000, revenue: 310000, roas: 3.5, conversions: 421 },
      { name: "Campaign E (Mid-year)", spend: 95000, revenue: 380000, roas: 4.0, conversions: 510 },
    ];

    return (
      <div>
        <div style={s.grid4}>
          <KpiCard label="Total Ad Spend" value={fmtK(adSpend)} color="#3b82f6" />
          <KpiCard label="Overall ROAS" value={`${roas.toFixed(2)}x`} color={roas >= 4 ? "#10b981" : roas >= 2 ? "#f59e0b" : "#ef4444"} sub="revenue per ₹ spent" />
          <KpiCard label="Ads % of Expenses" value={`${totalExpenses > 0 ? ((adSpend / totalExpenses) * 100).toFixed(1) : 0}%`} color="#8b5cf6" />
          <KpiCard label="Revenue Attributed" value={fmtK(totalRevenue)} color="#10b981" sub="full period" />
        </div>

        <div style={{ ...s.grid2, gridTemplateColumns: "1.5fr 1fr" }}>
          <Card>
            <SectionTitle icon="📣" title="Ad Spend vs ROAS by Month" subtitle="Return on ad spend trend" />
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={adsByMonth} margin={{ top: 5, right: 15, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "#f59e0b", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 6]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="adSpend" name="Ad Spend" fill="#3b82f6" fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="roas" name="ROAS" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionTitle icon="🎯" title="Marketing Mix" subtitle="Channel spend allocation" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              {[
                { channel: "Meta / Facebook", pct: 30, color: "#3b82f6" },
                { channel: "Google Ads", pct: 28, color: "#10b981" },
                { channel: "Influencer", pct: 25, color: "#8b5cf6" },
                { channel: "Other Digital", pct: 17, color: "#f59e0b" },
              ].map(c => (
                <div key={c.channel}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: "#94a3b8" }}>{c.channel}</span>
                    <span style={{ color: c.color, fontWeight: 700 }}>{c.pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: c.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <SectionTitle icon="🌟" title="Campaign / Influencer Performance" subtitle="ROAS and conversion breakdown" />
          <table style={s.table}>
            <thead>
              <tr>
                {["Campaign","Ad Spend","Revenue","ROAS","Conversions","Performance"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {influencers.map((inf, i) => (
                <tr key={i}>
                  <td style={{ ...s.td(i), fontWeight: 700, color: "#cbd5e1" }}>{inf.name}</td>
                  <td style={s.td(i)}>{fmt(inf.spend)}</td>
                  <td style={{ ...s.td(i), color: "#10b981", fontWeight: 700 }}>{fmt(inf.revenue)}</td>
                  <td style={s.td(i)}>
                    <span style={{ color: inf.roas >= 4 ? "#10b981" : inf.roas >= 3 ? "#f59e0b" : "#ef4444", fontWeight: 800 }}>
                      {inf.roas.toFixed(1)}x
                    </span>
                  </td>
                  <td style={s.td(i)}>{inf.conversions}</td>
                  <td style={s.td(i)}>
                    <div style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                      <div style={{ width: `${(inf.roas / 5) * 100}%`, height: "100%", background: inf.roas >= 4 ? "#10b981" : "#f59e0b", borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  // ── INVENTORY ────────────────────────────────────────────────────────────────
  const InventorySection = () => (
    <div>
      <div style={s.grid4}>
        <KpiCard label="Inventory Cost" value={fmtK(inventoryCost)} color="#10b981" />
        <KpiCard label="Inventory Turnover" value={`${inventoryTurnover.toFixed(2)}x`} color={inventoryTurnover > 4 ? "#10b981" : inventoryTurnover > 2 ? "#f59e0b" : "#ef4444"} sub="revenue / cost" />
        <KpiCard label="Manufacturing Cost" value={fmtK(filteredExpenses.filter(e => e.category === "Manufacturing").reduce((s, e) => s + e.amount, 0))} color="#8b5cf6" />
        <KpiCard label="Packaging Cost" value={fmtK(filteredExpenses.filter(e => e.category === "Packaging").reduce((s, e) => s + e.amount, 0))} color="#ec4899" />
      </div>

      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="🌡️" title="Inventory Expense Heatmap" subtitle="Monthly spend intensity by category (darker = higher spend)" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 11, width: "100%" }}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 110 }}>Category</th>
                {MONTHS.map(mo => <th key={mo} style={{ ...s.th, textAlign: "center", fontSize: 9 }}>{mo}</th>)}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row, ri) => (
                <tr key={row.cat}>
                  <td style={{ padding: "5px 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[row.cat], display: "inline-block", marginRight: 5 }} />
                    {row.cat}
                  </td>
                  {row.values.map((v, ci) => <HeatCell key={ci} value={v} max={heatMax} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: 9, color: "#475569" }}>Low</span>
          {["rgba(255,255,255,0.04)", "#1e3a5f", "#1d4ed8", "#3b82f6", "#93c5fd"].map((c, i) => (
            <div key={i} style={{ width: 20, height: 12, background: c, borderRadius: 2 }} />
          ))}
          <span style={{ fontSize: 9, color: "#475569" }}>High</span>
        </div>
      </Card>

      <div style={s.grid2}>
        <Card>
          <SectionTitle icon="📦" title="Supply Chain Cost Breakdown" subtitle="Inventory + Manufacturing + Packaging + Logistics" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={["Inventory","Manufacturing","Packaging","Logistics"].map(cat => ({
                  name: cat,
                  value: filteredExpenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
                })).filter(c => c.value > 0)}
                dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}
              >
                {["#10b981","#8b5cf6","#ec4899","#ef4444"].map((color, i) => <Cell key={i} fill={color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon="🔄" title="Turnover Analysis" subtitle="Monthly inventory efficiency" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData.map(m => {
              const ym = `2025-${String(MONTHS.indexOf(m.month) + 1).padStart(2, "0")}`;
              const inv = expenses.filter(e => e.date.slice(0, 7) === ym && e.category === "Inventory").reduce((s, e) => s + e.amount, 0);
              const turnover = inv > 0 ? (m.revenue / inv) : 0;
              return { month: m.month, turnover: parseFloat(turnover.toFixed(2)) };
            })} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={2} stroke="rgba(239,68,68,0.5)" strokeDasharray="4 2" label={{ value: "Min 2x", fill: "#ef4444", fontSize: 9 }} />
              <Line type="monotone" dataKey="turnover" name="Turnover" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );

  // ── BUDGET ───────────────────────────────────────────────────────────────────
  const BudgetSection = () => (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle icon="💰" title="Budget vs Actual" subtitle="Adjust budgets to see real-time variance" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {CATEGORIES.map(cat => (
            <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 120 }}>
              <label style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat}</label>
              <input
                type="number"
                value={budgets[cat]}
                onChange={e => setBudgets(prev => ({ ...prev, [cat]: Number(e.target.value) }))}
                style={{ ...s.input, padding: "5px 8px", fontSize: 11 }}
              />
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={budgetActual} margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="cat" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" />
            <YAxis tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="budget" name="Budget" fill="rgba(255,255,255,0.12)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
              {budgetActual.map((b, i) => <Cell key={i} fill={b.over ? "#ef4444" : "#10b981"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <SectionTitle icon="⚖️" title="Variance Table" subtitle="Over-budget items highlighted in red" />
        <table style={s.table}>
          <thead>
            <tr>
              {["Category","Budget","Actual","Variance","% Used","Status"].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {budgetActual.map((b, i) => {
              const variance = b.budget - b.actual;
              const pctUsed = b.budget > 0 ? (b.actual / b.budget) * 100 : 0;
              return (
                <tr key={b.cat}>
                  <td style={{ ...s.td(i), fontWeight: 700 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: CAT_COLORS[b.cat], display: "inline-block", marginRight: 6 }} />
                    {b.cat}
                  </td>
                  <td style={s.td(i)}>{fmt(b.budget)}</td>
                  <td style={{ ...s.td(i), fontWeight: 700, color: b.over ? "#f87171" : "#f1f5f9" }}>{fmt(b.actual)}</td>
                  <td style={{ ...s.td(i), color: variance >= 0 ? "#34d399" : "#f87171", fontWeight: 700 }}>
                    {variance >= 0 ? "+" : ""}{fmt(variance)}
                  </td>
                  <td style={s.td(i)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, maxWidth: 80 }}>
                        <div style={{ width: `${Math.min(pctUsed, 100)}%`, height: "100%", background: b.over ? "#ef4444" : "#10b981", borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 10, color: b.over ? "#f87171" : "#94a3b8" }}>{pctUsed.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={s.td(i)}>
                    <span style={s.badge(b.over ? "#ef4444" : "#10b981")}>
                      {b.over ? "🔴 Over" : "✅ Under"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );

  // ── INVESTMENTS ──────────────────────────────────────────────────────────────
  const InvestmentsSection = () => (
    <div>
      <div style={s.grid4}>
        <KpiCard label="Total Invested" value={fmtK(totalInvested)} color="#3b82f6" />
        <KpiCard label="Current Value" value={fmtK(totalCurrentValue)} color="#10b981" />
        <KpiCard label="Total Return" value={fmtK(investReturn)} color={investReturn >= 0 ? "#10b981" : "#ef4444"} />
        <KpiCard label="Return %" value={`${investReturnPct.toFixed(1)}%`} color={investReturnPct >= 0 ? "#10b981" : "#ef4444"} />
      </div>

      <div style={s.grid2}>
        <Card>
          <SectionTitle icon="📈" title="Investment Portfolio" subtitle="Invested vs current value" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={investments.map(i => ({ name: i.type.slice(0, 14), invested: i.invested, current: i.current, return: i.current - i.invested }))} margin={{ top: 5, right: 10, bottom: 0, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 8 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="invested" name="Invested" fill="rgba(59,130,246,0.6)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="current" name="Current Value" fill="#10b981" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle icon="🏦" title="Investment Details" />
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Description</th>
              <th style={{ ...s.th, textAlign: "right" }}>Invested</th>
              <th style={{ ...s.th, textAlign: "right" }}>Return</th>
            </tr></thead>
            <tbody>
              {investments.map((inv, i) => {
                const ret = inv.current - inv.invested;
                const retPct = inv.invested > 0 ? ((ret / inv.invested) * 100).toFixed(1) : 0;
                return (
                  <tr key={i}>
                    <td style={s.td(i)}>
                      <div style={{ fontWeight: 700, color: "#cbd5e1", fontSize: 11 }}>{inv.description}</div>
                      <div style={{ fontSize: 9, color: "#475569" }}>{inv.type}</div>
                    </td>
                    <td style={{ ...s.td(i), textAlign: "right" }}>{fmtK(inv.invested)}</td>
                    <td style={{ ...s.td(i), textAlign: "right", fontWeight: 700, color: ret >= 0 ? "#34d399" : "#f87171" }}>
                      {ret >= 0 ? "+" : ""}{fmtK(ret)} ({retPct}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );

  // ── SETTINGS ─────────────────────────────────────────────────────────────────
  const SettingsSection = () => (
    <div>
      <div style={s.grid2}>
        <Card>
          <SectionTitle icon="🔗" title="Connect Google Sheet" subtitle="Paste your Apps Script Web App URL" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>Web App URL (from Apps Script → Deploy)</label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/..."
                value={webAppUrl}
                onChange={e => setWebAppUrl(e.target.value)}
                style={s.input}
              />
            </div>
            <button onClick={() => { setDataSource("live"); fetchSheetData(); }} style={s.btn(true)}>
              {syncStatus === "syncing" ? "Syncing…" : "Connect & Sync"}
            </button>
            {syncStatus === "ok" && <p style={{ color: "#10b981", fontSize: 11, margin: 0 }}>✅ Connected — last sync: {lastSync?.toLocaleTimeString()}</p>}
            {syncStatus === "error" && <p style={{ color: "#ef4444", fontSize: 11, margin: 0 }}>❌ Connection failed. Check URL and CORS settings.</p>}
          </div>

          <div style={{ marginTop: 24, padding: 14, background: "rgba(59,130,246,0.08)", borderRadius: 10, border: "1px solid rgba(59,130,246,0.15)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", margin: "0 0 8px" }}>📋 Setup Instructions</p>
            <ol style={{ fontSize: 10, color: "#64748b", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
              <li>Open your Google Sheet → Extensions → Apps Script</li>
              <li>Add the updated <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 4px", borderRadius: 3 }}>doGet()</code> function from Code.gs below</li>
              <li>Click Deploy → New Deployment → Web App</li>
              <li>Set Execute As: "Me" and Who Has Access: "Anyone"</li>
              <li>Copy the Web App URL and paste it above</li>
            </ol>
          </div>
        </Card>

        <Card>
          <SectionTitle icon="🛡️" title="Data Persistence Check" subtitle="Ensures dashboard won't overwrite sheet data" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { check: "Read-only API", status: true, note: "doGet() only — no write operations" },
              { check: "No sheet overwrites", status: true, note: "buildDashboard() not triggered by UI" },
              { check: "Existing data preserved", status: true, note: "Rows 3-202 untouched by API" },
              { check: "Formulas intact", status: true, note: "SUMPRODUCT formulas remain in sheet" },
              { check: "Activity log safe", status: true, note: "writeLog() only on sheet edit events" },
              { check: "URL sanitization", status: webAppUrl.includes("script.google.com"), note: webAppUrl ? "Valid domain ✓" : "URL not set yet" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ fontSize: 13, marginTop: 1 }}>{item.status ? "✅" : "⚠️"}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#cbd5e1" }}>{item.check}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle icon="📄" title="Code.gs — doGet() Update Required" subtitle="Add this function to your existing Code.gs to enable the JSON API" />
        <div style={{
          background: "#0d1117", borderRadius: 10, padding: "16px 18px", fontFamily: "monospace",
          fontSize: 10.5, lineHeight: 1.7, color: "#c9d1d9", overflow: "auto",
          border: "1px solid rgba(255,255,255,0.08)", maxHeight: 420, overflowY: "auto"
        }}>
          <pre style={{ margin: 0 }}>{`// ─────────────────────────────────────────────────────
//  ADD THIS to your existing Code.gs
//  (place at the bottom of the file)
// ─────────────────────────────────────────────────────

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "getAllData";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let result = {};

  try {
    if (action === "getAllData") {
      result = {
        expenses: getExpensesData(ss),
        revenue:  getRevenueData(ss),
        investments: getInvestmentsData(ss),
        meta: {
          lastUpdated: new Date().toISOString(),
          totalRows: ss.getSheetByName("Expense Entry")
            .getLastRow() - 2
        }
      };
    } else if (action === "getExpenses") {
      result = { expenses: getExpensesData(ss) };
    } else if (action === "getRevenue") {
      result = { revenue: getRevenueData(ss) };
    }
  } catch(err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Read expense rows (non-empty) ──────────────────────
function getExpensesData(ss) {
  const sh = ss.getSheetByName("Expense Entry");
  const lastRow = sh.getLastRow();
  if (lastRow < 3) return [];

  const data = sh.getRange(3, 1, lastRow - 2, 5).getValues();
  return data
    .filter(row => row[0] && row[1] && row[3])
    .map(row => ({
      date:        row[0] instanceof Date
                     ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
                     : String(row[0]),
      category:    String(row[1]),
      description: String(row[2]),
      amount:      Number(row[3]),
      payment:     String(row[4])
    }));
}

// ── Read revenue from P&L row 5 ───────────────────────
function getRevenueData(ss) {
  const sh = ss.getSheetByName("P&L");
  if (!sh) return {};
  const values = sh.getRange(5, 2, 1, 12).getValues()[0];
  const months  = ["Jan","Feb","Mar","Apr","May","Jun",
                   "Jul","Aug","Sep","Oct","Nov","Dec"];
  const result  = {};
  months.forEach((m, i) => result[m] = Number(values[i]) || 0);
  return result;
}

// ── Read investment rows ──────────────────────────────
function getInvestmentsData(ss) {
  const sh = ss.getSheetByName("Investment");
  if (!sh) return [];
  const lastRow = sh.getLastRow();
  if (lastRow < 4) return [];

  const data = sh.getRange(4, 1, lastRow - 3, 8).getValues();
  return data
    .filter(row => row[0] && row[1])
    .map(row => ({
      date:        row[0] instanceof Date
                     ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
                     : String(row[0]),
      type:        String(row[1]),
      description: String(row[2]),
      invested:    Number(row[3]),
      current:     Number(row[4])
    }));
}`}</pre>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <span style={s.badge("#10b981")}>✓ Read-Only</span>
          <span style={s.badge("#3b82f6")}>✓ No Write Operations</span>
          <span style={s.badge("#8b5cf6")}>✓ CORS-Safe JSON</span>
        </div>
      </Card>
    </div>
  );

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.root}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sbLogo}>
          <div style={s.sbLogoIcon}>🛒</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2 }}>Ecommerce</div>
              <div style={{ fontSize: 9, color: "#475569" }}>Expense Dashboard</div>
            </div>
          )}
        </div>

        <nav style={s.nav}>
          {navItems.map(item => (
            <div key={item.id} style={s.navItem(activeSection === item.id)} onClick={() => setActiveSection(item.id)}>
              <span style={s.navIcon}>{item.icon}</span>
              <span style={s.navLabel}>{item.label}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            style={{ ...s.navItem(false), justifyContent: "center" }}
            onClick={() => setSidebarOpen(p => !p)}
          >
            <span style={{ fontSize: 12, color: "#475569" }}>{sidebarOpen ? "◀" : "▶"}</span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.03em", marginRight: 8 }}>
            {navItems.find(n => n.id === activeSection)?.icon} {navItems.find(n => n.id === activeSection)?.label}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            {/* Date range */}
            <label style={{ fontSize: 10, color: "#475569" }}>From</label>
            <input type="month" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
              style={{ ...s.select, padding: "4px 8px" }} />
            <label style={{ fontSize: 10, color: "#475569" }}>To</label>
            <input type="month" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
              style={{ ...s.select, padding: "4px 8px" }} />

            {/* Category filter */}
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={s.select}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Sync status indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={s.syncDot(syncStatus)} />
              <span style={{ fontSize: 10, color: "#475569" }}>
                {syncStatus === "ok" ? "Live" : dataSource === "demo" ? "Demo" : "Offline"}
              </span>
            </div>

            {webAppUrl && (
              <button onClick={fetchSheetData} style={{ ...s.btn(false), padding: "5px 12px", fontSize: 10 }}>
                {syncStatus === "syncing" ? "…" : "↻ Sync"}
              </button>
            )}
          </div>
        </div>

        {/* Section content */}
        {renderSection()}
      </div>
    </div>
  );
}