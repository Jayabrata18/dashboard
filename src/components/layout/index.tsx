import React from "react";
import { useDashboard } from "../../store/DashboardContext";
import { fmtTime, fmtDuration, fmtCountdown } from "../../utils/format";
import { CATEGORIES } from "../../utils/constants";
import type { NavSection, SyncStatus } from "../../types";

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: NavSection; icon: string; label: string }[] = [
  { id: "overview", icon: "◈", label: "Overview" },
  { id: "financial", icon: "◉", label: "Financial Health" },
  { id: "analytics", icon: "◎", label: "Analytics" },
  { id: "marketing", icon: "◆", label: "Marketing" },
  { id: "inventory", icon: "▣", label: "Inventory" },
  { id: "budget", icon: "◧", label: "Budget" },
  { id: "investments", icon: "◈", label: "Investments" },
  { id: "calculator", icon: "◐", label: "Price Calculator" }, // ← new
  { id: "settings", icon: "◌", label: "Settings & Sync" },
  { id: "marketing", icon: "◆", label: "Meta Ads" },
  { id: "instagram", icon: "◑", label: "Instagram" },
  { id: "customers", icon: "◉", label: "Customers" },
  { id: "orders", icon: "◫", label: "Orders" },
];
// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { state, dispatch } = useDashboard();
  const { sidebarOpen, activeSection } = state;

  return (
    <div
      style={{
        width: sidebarOpen ? 220 : 64,
        minHeight: "100vh",
        background: "rgba(255,255,255,0.03)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        transition: "width 0.25s ease",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: sidebarOpen ? "22px 20px 20px" : "22px 12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          🛒
        </div>
        {sidebarOpen && (
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#f1f5f9",
                lineHeight: 1.2,
              }}
            >
              Ecommerce
            </div>
            <div style={{ fontSize: 9, color: "#475569" }}>
              Expense Dashboard
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 8px", flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = activeSection === item.id;
          return (
            <div
              key={item.id}
              onClick={() =>
                dispatch({ type: "SET_SECTION", payload: item.id })
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: sidebarOpen ? "9px 12px" : "9px",
                borderRadius: 10,
                cursor: "pointer",
                marginBottom: 2,
                overflow: "hidden",
                background: active ? "rgba(59,130,246,0.15)" : "transparent",
                color: active ? "#60a5fa" : "#64748b",
                border: active
                  ? "1px solid rgba(59,130,246,0.2)"
                  : "1px solid transparent",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                justifyContent: sidebarOpen ? "flex-start" : "center",
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && (
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div
        style={{
          padding: "12px 8px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 9,
            borderRadius: 10,
            cursor: "pointer",
            color: "#475569",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 12 }}>{sidebarOpen ? "◀" : "▶"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sync Pill ────────────────────────────────────────────────────────────────

function SyncDot({ status }: { status: SyncStatus }) {
  const color =
    status === "ok"
      ? "#10b981"
      : status === "syncing"
        ? "#f59e0b"
        : status === "error"
          ? "#ef4444"
          : "#475569";
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: status === "ok" ? "0 0 6px #10b981" : "none",
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

function SyncStatusBar() {
  const { state, fetchData } = useDashboard();
  const { syncStatus, lastSync, nextSyncIn, fetchDurationMs, webAppUrl } =
    state;

  const statusLabel =
    syncStatus === "ok"
      ? "Live"
      : syncStatus === "syncing"
        ? "Syncing…"
        : syncStatus === "error"
          ? "Error"
          : "Not connected";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 14px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24,
        fontSize: 11,
        color: "#64748b",
        flexShrink: 0,
      }}
    >
      <SyncDot status={syncStatus} />

      {/* Status label */}
      <span
        style={{
          fontWeight: 700,
          color:
            syncStatus === "ok"
              ? "#10b981"
              : syncStatus === "error"
                ? "#ef4444"
                : syncStatus === "syncing"
                  ? "#f59e0b"
                  : "#64748b",
        }}
      >
        {statusLabel}
      </span>

      {/* Last sync time */}
      {lastSync && (
        <span
          style={{
            color: "#475569",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            paddingLeft: 10,
          }}
        >
          Last:{" "}
          <strong style={{ color: "#94a3b8" }}>{fmtTime(lastSync)}</strong>
        </span>
      )}

      {/* Fetch duration */}
      {fetchDurationMs !== null && syncStatus === "ok" && (
        <span
          style={{
            color: "#475569",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            paddingLeft: 10,
          }}
        >
          Took:{" "}
          <strong style={{ color: "#94a3b8" }}>
            {fmtDuration(fetchDurationMs)}
          </strong>
        </span>
      )}

      {/* Next sync countdown */}
      {nextSyncIn !== null && nextSyncIn > 0 && webAppUrl && (
        <span
          style={{
            color: "#475569",
            borderLeft: "1px solid rgba(255,255,255,0.08)",
            paddingLeft: 10,
          }}
        >
          Next in:{" "}
          <strong style={{ color: "#60a5fa" }}>
            {fmtCountdown(nextSyncIn)}
          </strong>
        </span>
      )}

      {/* Manual sync button */}
      {webAppUrl && (
        <button
          onClick={fetchData}
          disabled={syncStatus === "syncing"}
          style={{
            background: "rgba(59,130,246,0.15)",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 12,
            color: "#60a5fa",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 10px",
            cursor: syncStatus === "syncing" ? "not-allowed" : "pointer",
            opacity: syncStatus === "syncing" ? 0.5 : 1,
            transition: "all 0.15s",
            marginLeft: 4,
          }}
        >
          {syncStatus === "syncing" ? "…" : "↻ Sync"}
        </button>
      )}

      {/* No URL warning */}
      {!webAppUrl && (
        <span style={{ color: "#f59e0b", fontSize: 10 }}>
          ⚠ Connect a sheet in Settings
        </span>
      )}
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export function Topbar() {
  const { state, dispatch } = useDashboard();
  const { activeSection, dateRange, selectedCategory } = state;

  const currentNav = NAV_ITEMS.find((n) => n.id === activeSection);

  const select: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#cbd5e1",
    padding: "5px 10px",
    fontSize: 11,
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(10,15,30,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 0",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <h1
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#f1f5f9",
          margin: 0,
          letterSpacing: "-0.03em",
          marginRight: 8,
          flexShrink: 0,
        }}
      >
        {currentNav?.icon} {currentNav?.label}
      </h1>

      {/* Sync status — prominently at top */}
      <SyncStatusBar />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginLeft: "auto",
          flexWrap: "wrap",
        }}
      >
        <label style={{ fontSize: 10, color: "#475569" }}>From</label>
        <input
          type="month"
          value={dateRange.from}
          onChange={(e) =>
            dispatch({
              type: "SET_DATE_RANGE",
              payload: { from: e.target.value },
            })
          }
          style={{ ...select, padding: "4px 8px" }}
        />
        <label style={{ fontSize: 10, color: "#475569" }}>To</label>
        <input
          type="month"
          value={dateRange.to}
          onChange={(e) =>
            dispatch({
              type: "SET_DATE_RANGE",
              payload: { to: e.target.value },
            })
          }
          style={{ ...select, padding: "4px 8px" }}
        />
        <select
          value={selectedCategory}
          onChange={(e) =>
            dispatch({
              type: "SET_CATEGORY",
              payload: e.target.value as typeof selectedCategory,
            })
          }
          style={select}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
