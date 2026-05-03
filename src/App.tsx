import React from "react";
import { DashboardProvider, useDashboard } from "./store/DashboardContext";
import { Sidebar, Topbar } from "./components/layout";
import { OverviewPage } from "./Pages/OverviewPage";
import { FinancialPage } from "./Pages/FinancialPage";
import {
  
  MarketingPage
} from "./Pages/Marketing";
import {
  BudgetPage,
  InvestmentsPage,
} from "./Pages/BudgetInvestmentsSettings";
import { SettingsPage } from "./Pages/Settings";
import { AnalyticsPage } from "./Pages/Analytics";
import { PriceCalculatorPage } from "./Pages/PriceCalculatorPage";
import { MetaAdsPage } from "./Pages/MetaAdsPage";
import { InstagramPage } from "./Pages/InstagramPage";
import { InventoryPage } from "./Pages/Inventory";

// ─── Inner app (needs context) ────────────────────────────────────────────────

function DashboardApp() {
  const { state } = useDashboard();
  const { activeSection } = state;

  const renderPage = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewPage />;
      case "financial":
        return <FinancialPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "marketing":
        return <MarketingPage />;
      case "inventory":
        return <InventoryPage />;
      case "budget":
        return <BudgetPage />;
      case "investments":
        return <InvestmentsPage />;
      case "instagram":
        return <InstagramPage />;
      case "marketing":
        return <MetaAdsPage />;
      case "settings":
        return <SettingsPage />;
      case "calculator":
        return <PriceCalculatorPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0a0f1e",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: "#e2e8f0",
        fontSize: 13,
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "0 24px 40px",
          overflow: "auto",
          minWidth: 0,
        }}
      >
        <Topbar />
        {renderPage()}
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
}
