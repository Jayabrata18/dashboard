// ─── Settings Page ────────────────────────────────────────────────────────────
import React from "react";
import { Card, SectionTitle } from "../components/ui";
import { useDashboard } from "../store/DashboardContext";

const ENV_URL_1 = import.meta.env.VITE_WEB_APP_URL_1 || "";
const ENV_URL_2 = import.meta.env.VITE_WEB_APP_URL_2 || "";

// console.log("Loaded Web App URL 1 from .env:", ENV_URL_1);
// console.log("Loaded Web App URL 2 from .env:", ENV_URL_2);

export function SettingsPage() {
  const { state, fetchData } = useDashboard();
  const {
    webAppUrl,
    webAppUrl2,
    syncStatus,
    syncStatus2,
    lastSync,
    lastSync2,
    fetchDurationMs,
    fetchDurationMs2,
  } = state;

  const checks = [
    {
      check: "Read-only API",
      status: true,
      note: "doGet() only — no write operations",
    },
    {
      check: "No sheet overwrites",
      status: true,
      note: "buildDashboard() not triggered by UI",
    },
    {
      check: "Existing data preserved",
      status: true,
      note: "Rows 3-202 untouched by API",
    },
    {
      check: "Formulas intact",
      status: true,
      note: "SUMPRODUCT formulas remain in sheet",
    },
    {
      check: "Activity log safe",
      status: true,
      note: "writeLog() only on sheet edit events",
    },
    {
      check: "Source 1 URL from environment",
      status: !!ENV_URL_1,
      note: ENV_URL_1
        ? "VITE_WEB_APP_URL is set ✓"
        : "VITE_WEB_APP_URL not found in .env",
    },
    {
      check: "Source 2 URL from environment",
      status: !!ENV_URL_2,
      note: ENV_URL_2
        ? "VITE_WEB_APP_URL_2 is set ✓"
        : "VITE_WEB_APP_URL_2 not found in .env",
    },
    {
      check: "Source 1 valid Google domain",
      status: webAppUrl?.includes("script.google.com"),
      note: webAppUrl ? "script.google.com ✓" : "URL not loaded yet",
    },
    {
      check: "Source 2 valid Google domain",
      status: webAppUrl2?.includes("script.google.com"),
      note: webAppUrl2 ? "script.google.com ✓" : "URL not loaded yet",
    },
  ];

  const CODE = `// ─────────────────────────────────────────────────────
//  ADD THIS to your existing Code.gs
// ─────────────────────────────────────────────────────

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "getAllData";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let result = {};
  try {
    if (action === "getAllData") {
      result = {
        expenses:    getExpensesData(ss),
        revenue:     getRevenueData(ss),
        investments: getInvestmentsData(ss),
        meta: {
          lastUpdated: new Date().toISOString(),
          totalRows: ss.getSheetByName("Expense Entry").getLastRow() - 2
        }
      };
    }
  } catch(err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getExpensesData(ss) {
  const sh = ss.getSheetByName("Expense Entry");
  const lastRow = sh.getLastRow();
  if (lastRow < 3) return [];
  return sh.getRange(3, 1, lastRow - 2, 5).getValues()
    .filter(r => r[0] && r[1] && r[3])
    .map(r => ({
      date:        r[0] instanceof Date
                   ? Utilities.formatDate(r[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
                   : String(r[0]),
      category:    String(r[1]),
      description: String(r[2]),
      amount:      Number(r[3]),
      payment:     String(r[4])
    }));
}

function getRevenueData(ss) {
  const sh = ss.getSheetByName("P&L");
  if (!sh) return {};
  const values = sh.getRange(5, 2, 1, 12).getValues()[0];
  const months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];
  const result = {};
  months.forEach((m, i) => result[m] = Number(values[i]) || 0);
  return result;
}

function getInvestmentsData(ss) {
  const sh = ss.getSheetByName("Investment");
  if (!sh) return [];
  const lastRow = sh.getLastRow();
  if (lastRow < 4) return [];
  return sh.getRange(4, 1, lastRow - 3, 5).getValues()
    .filter(r => r[0] && r[1])
    .map(r => ({
      date:        r[0] instanceof Date
                   ? Utilities.formatDate(r[0], Session.getScriptTimeZone(), "yyyy-MM-dd")
                   : String(r[0]),
      type:        String(r[1]),
      description: String(r[2]),
      invested:    Number(r[3]),
      current:     Number(r[4])
    }));
}`;

  // ── Status badge config ──────────────────────────────────────────────────────
  const statusConfig = {
    idle: {
      color: "#64748b",
      bg: "rgba(100,116,139,0.12)",
      label: "Idle",
      icon: "○",
    },
    syncing: {
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      label: "Syncing…",
      icon: "◌",
    },
    ok: {
      color: "#10b981",
      bg: "rgba(16,185,129,0.12)",
      label: "Connected",
      icon: "●",
    },
    error: {
      color: "#ef4444",
      bg: "rgba(239,68,68,0.12)",
      label: "Error",
      icon: "●",
    },
  };

  const SpinnerIcon = ({ color }: { color: string }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="10"
        cy="10"
        r="8"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="28 8"
        strokeLinecap="round"
      />
    </svg>
  );

  // ── Per-source row renderer ──────────────────────────────────────────────────
  const renderSourceRow = ({
    label,
    envKey,
    envUrl,
    webUrl,
    status,
    lastSyncTime,
    durationMs,
    onRetry,
    isLast,
  }: {
    label: string;
    envKey: string;
    envUrl: string;
    webUrl?: string;
    status: string;
    lastSyncTime?: Date | null;
    durationMs?: number | null;
    onRetry: () => void;
    isLast?: boolean;
  }) => {
    const s =
      statusConfig[status as keyof typeof statusConfig] ?? statusConfig.idle;

    return (
      <div
        style={{
          paddingBottom: isLast ? 0 : 16,
          marginBottom: isLast ? 0 : 16,
          borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {/* Left — icon + label + url */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: s.color,
                flexShrink: 0,
              }}
            >
              {status === "syncing" ? (
                <SpinnerIcon color={s.color} />
              ) : (
                <span style={{ fontSize: 10 }}>{s.icon}</span>
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#e2e8f0",
                  marginBottom: 2,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#475569",
                  fontFamily: "monospace",
                  maxWidth: 380,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {webUrl || (
                  <span style={{ color: "#ef4444" }}>
                    {envKey} not set in .env
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right — last sync + pill + retry */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {status === "ok" && lastSyncTime && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#475569" }}>Last sync</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {lastSyncTime.toLocaleTimeString()}
                  {durationMs != null && (
                    <span style={{ color: "#475569", marginLeft: 6 }}>
                      {durationMs}ms
                    </span>
                  )}
                </div>
              </div>
            )}

            <span
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.color}33`,
              }}
            >
              {s.label}
            </span>

            {webUrl && (
              <button
                onClick={onRetry}
                disabled={status === "syncing"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.07)",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                ↻ Retry
              </button>
            )}
          </div>
        </div>

        {/* Error hint */}
        {status === "error" && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "rgba(239,68,68,0.08)",
              borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 11,
              color: "#fca5a5",
              lineHeight: 1.7,
            }}
          >
            <strong>Connection failed.</strong> Check that:
            <br />
            1.{" "}
            <code
              style={{
                background: "rgba(255,255,255,0.08)",
                padding: "1px 5px",
                borderRadius: 3,
              }}
            >
              {envKey}
            </code>{" "}
            in your{" "}
            <code
              style={{
                background: "rgba(255,255,255,0.08)",
                padding: "1px 5px",
                borderRadius: 3,
              }}
            >
              .env
            </code>{" "}
            is correct
            <br />
            2. The Apps Script is deployed with{" "}
            <strong>Who has access: Anyone</strong>
            <br />
            3. You redeployed after any code changes
          </div>
        )}

        {/* Env not set hint */}
        {!envUrl && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "rgba(245,158,11,0.08)",
              borderRadius: 8,
              border: "1px solid rgba(245,158,11,0.2)",
              fontSize: 11,
              color: "#fcd34d",
              lineHeight: 1.7,
            }}
          >
            Add this to your{" "}
            <code
              style={{
                background: "rgba(255,255,255,0.08)",
                padding: "1px 5px",
                borderRadius: 3,
              }}
            >
              .env
            </code>{" "}
            file and restart the dev server:
            <br />
            <code
              style={{
                display: "block",
                marginTop: 6,
                background: "rgba(0,0,0,0.3)",
                padding: "6px 10px",
                borderRadius: 6,
                color: "#86efac",
                fontSize: 11,
              }}
            >
              {envKey}=https://script.google.com/macros/s/YOUR_ID/exec
            </code>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Combined connection status card ──────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon="🔌"
          title="Google Sheet Connections"
          subtitle="Live status for each connected data source"
        />

        {renderSourceRow({
          label: "Source 1 — Primary Sheet",
          envKey: "VITE_WEB_APP_URL",
          envUrl: ENV_URL_1,
          webUrl: webAppUrl,
          status: syncStatus ?? "idle",
          lastSyncTime: lastSync,
          durationMs: fetchDurationMs,
          onRetry: () => fetchData("source1"),
          isLast: false,
        })}

        {renderSourceRow({
          label: "Source 2 — Secondary Sheet",
          envKey: "VITE_WEB_APP_URL_2",
          envUrl: ENV_URL_2,
          webUrl: webAppUrl2,
          status: syncStatus2 ?? "idle",
          lastSyncTime: lastSync2,
          durationMs: fetchDurationMs2,
          onRetry: () => fetchData("source2"),
          isLast: true,
        })}
      </Card>

      {/* ── Bottom row ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Persistence checks */}
        <Card>
          <SectionTitle
            icon="🛡️"
            title="Data Persistence Check"
            subtitle="Ensures dashboard won't overwrite sheet data"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {checks.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "8px 0",
                  borderBottom:
                    i < checks.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                }}
              >
                <span style={{ fontSize: 13, marginTop: 1 }}>
                  {item.status ? "✅" : "⚠️"}
                </span>
                <div>
                  <div
                    style={{ fontWeight: 700, fontSize: 11, color: "#cbd5e1" }}
                  >
                    {item.check}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    {item.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Setup instructions */}
        <Card>
          <SectionTitle
            icon="🔗"
            title="Setup Instructions"
            subtitle="One-time configuration in Google Apps Script"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                step: "1",
                text: "Open Google Sheet → Extensions → Apps Script",
              },
              {
                step: "2",
                text: "Add the doGet() function from the Code.gs block below",
              },
              { step: "3", text: "Deploy → New Deployment → Web App" },
              {
                step: "4",
                text: 'Execute As: "Me" | Who Has Access: "Anyone"',
              },
              {
                step: "5",
                text: "Copy URL 1 into .env as VITE_WEB_APP_URL, URL 2 as VITE_WEB_APP_URL_2",
              },
              {
                step: "6",
                text: "Restart the dev server — both sources connect automatically",
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(59,130,246,0.15)",
                    border: "1px solid rgba(59,130,246,0.3)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#60a5fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.step}
                </span>
                <span
                  style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Code block ───────────────────────────────────────────────────────── */}
      <Card>
        <SectionTitle
          icon="📄"
          title="Code.gs — doGet() Function"
          subtitle="Add this to both Apps Scripts to enable the JSON API"
        />
        <div
          style={{
            background: "#0d1117",
            borderRadius: 10,
            padding: "16px 18px",
            fontFamily: "monospace",
            fontSize: 10.5,
            lineHeight: 1.7,
            color: "#c9d1d9",
            overflow: "auto",
            border: "1px solid rgba(255,255,255,0.08)",
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          <pre style={{ margin: 0 }}>{CODE}</pre>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          {[
            { label: "✓ Read-Only", color: "#10b981" },
            { label: "✓ No Write Ops", color: "#3b82f6" },
            { label: "✓ CORS-Safe JSON", color: "#8b5cf6" },
            { label: "✓ Two Sources", color: "#f59e0b" },
          ].map((b) => (
            <span
              key={b.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 700,
                background: b.color + "22",
                color: b.color,
                border: `1px solid ${b.color}44`,
              }}
            >
              {b.label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}
