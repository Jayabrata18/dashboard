import React, { type CSSProperties, type ReactNode } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Card({ children, style = {} }: CardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "20px 22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────

interface SectionTitleProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export function SectionTitle({ icon, title, subtitle }: SectionTitleProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <h2
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p
          style={{
            fontSize: 11,
            color: "#64748b",
            margin: 0,
            paddingLeft: icon ? 24 : 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode;
  color: string;
}

export function Badge({ children, color }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 10,
        fontWeight: 700,
        background: color + "22",
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {children}
    </span>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  data: { v: number }[];
  color?: string;
  height?: number;
}

export function Sparkline({
  data,
  color = "#3b82f6",
  height = 40,
}: SparklineProps) {
  const gradId = `sg-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  sparkData?: { v: number }[];
  color?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  sparkData,
  color = "#3b82f6",
}: KpiCardProps) {
  const trendUp = (trend ?? 0) > 0;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14,
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: color,
          borderRadius: "14px 14px 0 0",
        }}
      />
      <p
        style={{
          fontSize: 11,
          color: "#64748b",
          margin: "0 0 6px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#f1f5f9",
          margin: "0 0 4px",
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {trend !== undefined && (
          <span
            style={{
              fontSize: 10,
              color: trendUp ? "#10b981" : "#ef4444",
              fontWeight: 700,
            }}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 10, color: "#475569" }}>{sub}</span>}
      </div>
      {sparkData && (
        <div style={{ marginTop: 8 }}>
          <Sparkline data={sparkData} color={color} height={32} />
        </div>
      )}
    </div>
  );
}

// ─── HeatCell ─────────────────────────────────────────────────────────────────

interface HeatCellProps {
  value: number;
  max: number;
}

export function HeatCell({ value, max }: HeatCellProps) {
  const pct = max > 0 ? value / max : 0;
  const bg =
    pct === 0
      ? "rgba(255,255,255,0.04)"
      : pct < 0.25
        ? "#1e3a5f"
        : pct < 0.5
          ? "#1d4ed8"
          : pct < 0.75
            ? "#3b82f6"
            : "#93c5fd";
  return (
    <td
      style={{
        background: bg,
        color: pct > 0.5 ? "#1e3a5f" : "#94a3b8",
        fontSize: 10,
        textAlign: "center",
        padding: "5px 4px",
        borderRadius: 4,
        fontWeight: pct > 0.7 ? 700 : 400,
        transition: "all 0.2s",
      }}
    >
      {value > 0
        ? value >= 1000
          ? `₹${(value / 1000).toFixed(0)}K`
          : `₹${value}`
        : "—"}
    </td>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const fmtK = (n: number): string =>
    n >= 100_000
      ? `₹${(n / 100_000).toFixed(1)}L`
      : n >= 1_000
        ? `₹${(n / 1_000).toFixed(0)}K`
        : `₹${n}`;

  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 12,
        minWidth: 140,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <p
        style={{
          fontWeight: 600,
          marginBottom: 6,
          color: "#cbd5e1",
          fontSize: 11,
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: p.color ?? p.fill,
              display: "inline-block",
            }}
          />
          <span style={{ color: "#94a3b8" }}>{p.name}:</span>
          <span
            style={{
              fontWeight: 600,
              color: "#f1f5f9",
              marginLeft: "auto",
              paddingLeft: 8,
            }}
          >
            {typeof p.value === "number" ? fmtK(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Table primitives ─────────────────────────────────────────────────────────

interface ThProps {
  children: ReactNode;
  align?: "left" | "right" | "center";
}

export function Th({ children, align = "left" }: ThProps) {
  return (
    <th
      style={{
        padding: "8px 12px",
        color: "#475569",
        fontWeight: 700,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        textAlign: align,
      }}
    >
      {children}
    </th>
  );
}

interface TdProps {
  children: ReactNode;
  rowIndex: number;
  align?: "left" | "right" | "center";
  style?: CSSProperties;
}

export function Td({
  children,
  rowIndex,
  align = "left",
  style = {},
}: TdProps) {
  return (
    <td
      style={{
        padding: "9px 12px",
        background:
          rowIndex % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent",
        textAlign: align,
        ...style,
      }}
    >
      {children}
    </td>
  );
}
