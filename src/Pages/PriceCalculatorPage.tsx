import React, { useState, useCallback } from "react";
import { Card, SectionTitle, Badge } from "../components/ui";
import { fmt, fmtK } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalcInputs {
  productName: string;
  category: string;
  quantity: number;
  // Manufacturing
  fabric: number;
  stitching: number;
  print: number;
  making: number;
  // Finishing
  tag: number;
  packing: number;
  packageTag: number; // ← new: package + tag combined
  transport: number;
  courier: number;
  sampling: number;
  // Development
  devCost: number; // ← new: design / pattern / development
  // Sales
  ads: number;
  paymentPct: number;
  other: number;
  // Pricing
  targetMargin: number;
  offerPct: number;
  // Toggles
  useTax: boolean;
  includeOffer: boolean;
  b2bMode: boolean;
}

interface CalcResult {
  mfgCost: number;
  finishCost: number;
  devPerUnit: number;
  mktCost: number;
  platformAmt: number;
  taxAmt: number;
  samplingPer: number;
  totalCost: number;
  taxRate: number;
  mrp: number;
  salePrice: number;
  breakeven: number;
  minPrice: number;
  wholesale: number;
  price3x: number;
  price4x: number;
  price5x: number;
  profit: number;
  profitMoq: number;
  marginPct: number;
  margin3x: number;
  margin4x: number;
  margin5x: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "T-Shirt",
  "Polo",
  "Hoodie",
  "Jacket",
  "Cargo",
  "Jogger",
  "Shorts",
  "Shirts",
  "Acid Wash",
];

const roundUp10 = (n: number) => Math.ceil(n / 10) * 10;

function compute(i: CalcInputs): CalcResult {
  const qty = Math.max(i.quantity, 1);
  const courier = i.b2bMode ? i.courier * 0.5 : i.courier;
  const ads = i.b2bMode ? 0 : i.ads;
  const samplingPer = i.sampling / qty;
  const devPerUnit = i.devCost / qty; // dev cost spread over MOQ

  const mfgCost = i.fabric + i.stitching + i.print + i.making;
  const finishCost =
    i.tag + i.packing + i.packageTag + i.transport + courier + samplingPer;
  const mktCost = ads + i.other;
  const baseCost = mfgCost + finishCost + devPerUnit + mktCost;

  const payPct = i.paymentPct / 100;
  const targetM = i.targetMargin / 100;

  // Trial MRP to detect tax bracket
  const trialMrp = baseCost / Math.max(1 - payPct - targetM, 0.01);
  const taxRate = i.useTax ? (trialMrp <= 2500 ? 0.05 : 0.18) : 0;

  // Solve: S*(1 - payPct - targetM - taxRate) = baseCost
  const denom = 1 - payPct - targetM - taxRate;
  const mrpRaw = denom > 0.01 ? baseCost / denom : baseCost * 3;
  const mrp = roundUp10(mrpRaw);

  const platformAmt = mrp * payPct;
  const taxAmt = mrp * taxRate;
  const totalCost = baseCost + platformAmt + taxAmt;
  const profit = mrp - totalCost;
  const marginPct = mrp > 0 ? (profit / mrp) * 100 : 0;
  const salePrice = i.includeOffer
    ? roundUp10(mrp * (1 - i.offerPct / 100))
    : mrp;

  // Multiplier prices based on total cost (before platform/tax — clean COGS multiple)
  const cogsCost = baseCost; // pure COGS, no platform/tax
  const price3x = roundUp10(cogsCost * 3);
  const price4x = roundUp10(cogsCost * 4);
  const price5x = roundUp10(cogsCost * 5);

  // Margin at each multiplier (after platform % on that price)
  const marginAt = (p: number) => {
    const plat = p * payPct;
    const tax = i.useTax ? p * taxRate : 0;
    const cost = totalCost + plat + tax - platformAmt - taxAmt; // recalc at this price
    return p > 0 ? ((p - totalCost) / p) * 100 : 0;
  };

  return {
    mfgCost,
    finishCost,
    devPerUnit,
    mktCost,
    platformAmt,
    taxAmt,
    samplingPer,
    totalCost,
    taxRate,
    mrp,
    salePrice,
    breakeven: roundUp10(totalCost),
    minPrice: roundUp10(totalCost / 0.9),
    wholesale: roundUp10(totalCost * 1.12),
    price3x,
    price4x,
    price5x,
    profit,
    profitMoq: profit * qty,
    marginPct,
    margin3x: marginAt(price3x),
    margin4x: marginAt(price4x),
    margin5x: marginAt(price5x),
  };
}

// ─── Reusable input components ────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        cursor: "pointer",
        background: on ? "#10b981" : "rgba(255,255,255,0.1)",
        border: `1px solid ${on ? "#10b981" : "rgba(255,255,255,0.15)"}`,
        position: "relative",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "white",
          top: 2,
          left: on ? 18 : 2,
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  prefix = "₹",
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          fontSize: 10,
          fontWeight: 600,
          color: "#64748b",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
        {hint && (
          <span
            style={{
              color: "#475569",
              fontWeight: 400,
              marginLeft: 4,
              textTransform: "none",
            }}
          >
            ({hint})
          </span>
        )}
      </label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "#475569",
              pointerEvents: "none",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value || ""}
          placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "8px 12px",
            paddingLeft: prefix ? 24 : 12,
            paddingRight: suffix ? 32 : 12,
            fontSize: 13,
            color: "#f1f5f9",
            fontFamily: "'JetBrains Mono', monospace",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        {suffix && (
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 10,
              color: "#475569",
              pointerEvents: "none",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  sub = false,
  highlight = false,
  color,
}: {
  label: string;
  value: string;
  sub?: boolean;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: sub ? "5px 0 5px 10px" : "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        style={{ fontSize: sub ? 10 : 12, color: sub ? "#475569" : "#94a3b8" }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: highlight ? 15 : sub ? 11 : 12,
          fontWeight: highlight ? 800 : 600,
          color: color ?? (sub ? "#64748b" : "#f1f5f9"),
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT: CalcInputs = {
  productName: "",
  category: "T-Shirt",
  quantity: 100,
  fabric: 0,
  stitching: 0,
  print: 0,
  making: 0,
  tag: 0,
  packing: 0,
  packageTag: 0,
  transport: 0,
  courier: 100,
  sampling: 0,
  devCost: 0,
  ads: 500,
  paymentPct: 5,
  other: 0,
  targetMargin: 30,
  offerPct: 10,
  useTax: false,
  includeOffer: true,
  b2bMode: false,
};

export function PriceCalculatorPage() {
  const [inp, setInp] = useState<CalcInputs>(DEFAULT);

  const set = useCallback(
    <K extends keyof CalcInputs>(key: K, val: CalcInputs[K]) =>
      setInp((prev) => ({ ...prev, [key]: val })),
    [],
  );

  const r = compute(inp);

  const marginColor = (m: number) =>
    m > 25 ? "#10b981" : m > 10 ? "#f59e0b" : "#ef4444";

  const healthLabel =
    r.marginPct > 25
      ? "Healthy margin"
      : r.marginPct > 10
        ? "Moderate margin"
        : "Thin / loss margin";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    color: "#f1f5f9",
    outline: "none",
  };

  const g2: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };
  const g3: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
  };

  const toggleRow = (label: string, sub: string, key: keyof CalcInputs) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
        <div style={{ fontSize: 10, color: "#475569" }}>{sub}</div>
      </div>
      <Toggle
        on={inp[key] as boolean}
        onToggle={() => set(key, !inp[key] as CalcInputs[typeof key])}
      />
    </div>
  );

  const multiplierCard = (
    label: string,
    price: number,
    margin: number,
    accent: string,
  ) => (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${accent}33`,
        borderRadius: 10,
        padding: "12px 14px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#475569",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: accent,
          fontFamily: "monospace",
          marginBottom: 4,
        }}
      >
        {fmt(price)}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "monospace",
          color: marginColor(margin),
          background: `${marginColor(margin)}18`,
          borderRadius: 8,
          padding: "2px 8px",
          display: "inline-block",
        }}
      >
        {margin.toFixed(1)}% margin
      </div>
    </div>
  );

  const handleCopy = () => {
    const lines = [
      `📦 ${inp.productName || "Product"} (${inp.category}) — MOQ: ${inp.quantity}`,
      `─────────────────────────────────`,
      `Total Cost / Unit : ${fmt(r.totalCost)}`,
      `Break-even        : ${fmt(r.breakeven)}`,
      `Recommended MRP   : ${fmt(r.mrp)}`,
      `Sale Price        : ${fmt(r.salePrice)}`,
      `3× Price          : ${fmt(r.price3x)} (${r.margin3x.toFixed(1)}% margin)`,
      `4× Price          : ${fmt(r.price4x)} (${r.margin4x.toFixed(1)}% margin)`,
      `5× Price          : ${fmt(r.price5x)} (${r.margin5x.toFixed(1)}% margin)`,
      `Wholesale         : ${fmt(r.wholesale)}`,
      `Margin %          : ${r.marginPct.toFixed(1)}%`,
      `Profit / Unit     : ${fmt(r.profit)}`,
      `Profit at MOQ     : ${fmtK(r.profitMoq)}`,
    ].join("\n");
    navigator.clipboard.writeText(lines).catch(() => {});
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px",
        gap: 16,
        alignItems: "start",
      }}
    >
      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Product Info */}
        <Card>
          <SectionTitle icon="🏷️" title="Product Info" />
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 10,
                fontWeight: 600,
                color: "#64748b",
                marginBottom: 5,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Product Name
            </label>
            <input
              type="text"
              value={inp.productName}
              placeholder="e.g. Oversized Drop-shoulder Tee"
              onChange={(e) => set("productName", e.target.value)}
              style={{ ...inputStyle, fontWeight: 600, fontSize: 14 }}
            />
          </div>
          <div style={g2}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#64748b",
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Category
              </label>
              <select
                value={inp.category}
                onChange={(e) => set("category", e.target.value)}
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <NumInput
              label="Quantity (MOQ)"
              value={inp.quantity}
              onChange={(v) => set("quantity", v)}
              prefix="×"
            />
          </div>
        </Card>

        {/* Manufacturing */}
        <Card>
          <SectionTitle icon="🏭" title="Manufacturing Costs" />
          <div style={g2}>
            <NumInput
              label="Fabric Cost"
              value={inp.fabric}
              onChange={(v) => set("fabric", v)}
            />
            <NumInput
              label="Stitching Cost"
              value={inp.stitching}
              onChange={(v) => set("stitching", v)}
            />
            <NumInput
              label="Screen Print / Embroidery"
              value={inp.print}
              onChange={(v) => set("print", v)}
            />
            <NumInput
              label="Other Making Cost"
              value={inp.making}
              onChange={(v) => set("making", v)}
            />
          </div>
        </Card>

        {/* Development */}
        <Card>
          <SectionTitle
            icon="✏️"
            title="Development Cost"
            subtitle="Design, pattern making, samples — spread across MOQ"
          />
          <div style={g2}>
            <NumInput
              label="Total Dev Cost"
              value={inp.devCost}
              onChange={(v) => set("devCost", v)}
              hint="total ÷ MOQ"
            />
            <div
              style={{
                background: "rgba(59,130,246,0.08)",
                borderRadius: 8,
                border: "1px solid rgba(59,130,246,0.15)",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 10, color: "#475569", marginBottom: 4 }}>
                Per Unit Dev Cost
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#60a5fa",
                  fontFamily: "monospace",
                }}
              >
                {fmt(r.devPerUnit)}
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                ÷ {inp.quantity} units
              </div>
            </div>
          </div>
        </Card>

        {/* Finishing & Logistics */}
        <Card>
          <SectionTitle icon="📦" title="Finishing & Logistics" />
          <div style={g3}>
            <NumInput
              label="Tag Cost"
              value={inp.tag}
              onChange={(v) => set("tag", v)}
            />
            <NumInput
              label="Pressing & Packing"
              value={inp.packing}
              onChange={(v) => set("packing", v)}
            />
            <NumInput
              label="Package + Tag Cost"
              value={inp.packageTag}
              onChange={(v) => set("packageTag", v)}
              hint="poly bag, box, etc."
            />
          </div>
          <div style={g3}>
            <NumInput
              label="Transport Cost"
              value={inp.transport}
              onChange={(v) => set("transport", v)}
            />
            <NumInput
              label="Courier (per unit)"
              value={inp.courier}
              onChange={(v) => set("courier", v)}
              hint="default ₹100"
            />
            <NumInput
              label="Sampling Cost"
              value={inp.sampling}
              onChange={(v) => set("sampling", v)}
              hint="total ÷ MOQ"
            />
          </div>
        </Card>

        {/* Sales & Marketing */}
        <Card>
          <SectionTitle icon="📣" title="Sales & Marketing" />
          <div style={g2}>
            <NumInput
              label="Ads Cost (per unit)"
              value={inp.ads}
              onChange={(v) => set("ads", v)}
              hint="default ₹500"
            />
            <NumInput
              label="Payment & Website %"
              value={inp.paymentPct}
              onChange={(v) => set("paymentPct", v)}
              prefix=""
              suffix="%"
              hint="default 5%"
            />
            <NumInput
              label="Other Charges"
              value={inp.other}
              onChange={(v) => set("other", v)}
            />
            <NumInput
              label="Target Margin %"
              value={inp.targetMargin}
              onChange={(v) => set("targetMargin", v)}
              prefix=""
              suffix="%"
            />
          </div>
        </Card>

        {/* Pricing Controls */}
        <Card>
          <SectionTitle icon="⚙️" title="Pricing Controls" />
          <NumInput
            label="Offer / Discount %"
            value={inp.offerPct}
            onChange={(v) => set("offerPct", v)}
            prefix=""
            suffix="%"
          />
          {toggleRow(
            "GST / Tax",
            inp.useTax
              ? r.mrp <= 2500
                ? "5% applied (≤₹2500)"
                : "18% applied (>₹2500)"
              : "Toggle to enable GST calculation",
            "useTax",
          )}
          {toggleRow(
            "Include Offer in MRP",
            "Show slashed sale price below MRP",
            "includeOffer",
          )}
          {toggleRow(
            "B2B / Wholesale Mode",
            "Removes ads, halves courier cost",
            "b2bMode",
          )}
        </Card>
      </div>

      {/* ── RIGHT: Results ────────────────────────────────────────────────── */}
      <div
        style={{
          position: "sticky",
          top: 80,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Cost summary card */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 20px",
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.08))",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#f1f5f9",
                marginBottom: 2,
              }}
            >
              {inp.productName || "— Product —"}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                fontFamily: "monospace",
              }}
            >
              {inp.category} · MOQ: {inp.quantity} units
              {inp.b2bMode && " · B2B Mode"}
            </div>
          </div>

          <div style={{ padding: "16px 20px" }}>
            <ResultRow label="Manufacturing" value={fmt(r.mfgCost)} sub />
            <ResultRow
              label="Development (per unit)"
              value={fmt(r.devPerUnit)}
              sub
              color="#60a5fa"
            />
            <ResultRow
              label="Finishing + Logistics"
              value={fmt(r.finishCost)}
              sub
            />
            <ResultRow label="Ads + Other" value={fmt(r.mktCost)} sub />
            <ResultRow
              label="Platform % charge"
              value={fmt(r.platformAmt)}
              sub
            />
            <ResultRow
              label={`GST (${(r.taxRate * 100).toFixed(0)}%)`}
              value={fmt(r.taxAmt)}
              sub
              color={inp.useTax ? "#f59e0b" : "#475569"}
            />
            <ResultRow
              label="Sampling (per unit)"
              value={fmt(r.samplingPer)}
              sub
            />

            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.08)",
                margin: "10px 0",
              }}
            />
            <ResultRow
              label="Total Cost / Unit"
              value={fmt(r.totalCost)}
              highlight
              color="#f1f5f9"
            />

            {/* Price bands */}
            <div
              style={{
                margin: "14px 0 0",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#475569",
                  marginBottom: 10,
                  fontFamily: "monospace",
                }}
              >
                Selling Price Bands
              </div>
              {[
                {
                  label: "Break-even",
                  value: fmt(r.breakeven),
                  color: "#ef4444",
                },
                {
                  label: "Min Price (10% margin)",
                  value: fmt(r.minPrice),
                  color: "#f59e0b",
                },
                {
                  label: "✦ Recommended MRP",
                  value: fmt(r.mrp),
                  color: "#60a5fa",
                  big: true,
                },
                {
                  label: `Sale (${inp.offerPct}% off)`,
                  value: fmt(r.salePrice),
                  color: "#10b981",
                },
                {
                  label: "Wholesale (B2B)",
                  value: fmt(r.wholesale),
                  color: "#a78bfa",
                },
              ].map(({ label, value, color, big }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: big ? 17 : 12,
                      fontWeight: big ? 800 : 600,
                      color,
                      fontFamily: "monospace",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Margin bar */}
            <div
              style={{
                margin: "12px 0 0",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#475569",
                  marginBottom: 8,
                  fontFamily: "monospace",
                }}
              >
                Margin at MRP
              </div>
              <div
                style={{
                  height: 8,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    width: `${Math.min(Math.max(r.marginPct, 0), 100)}%`,
                    background: marginColor(r.marginPct),
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: "#475569",
                  marginBottom: 10,
                }}
              >
                <span>0%</span>
                <span
                  style={{ color: marginColor(r.marginPct), fontWeight: 700 }}
                >
                  {r.marginPct.toFixed(1)}%
                </span>
                <span>100%</span>
              </div>
              <ResultRow
                label="Profit / Unit"
                value={fmt(r.profit)}
                color={r.profit >= 0 ? "#10b981" : "#ef4444"}
              />
              <ResultRow
                label="Profit at MOQ"
                value={fmtK(r.profitMoq)}
                color={r.profitMoq >= 0 ? "#10b981" : "#ef4444"}
              />
              <div style={{ marginTop: 10 }}>
                <Badge color={marginColor(r.marginPct)}>{healthLabel}</Badge>
              </div>
            </div>

            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                marginTop: 14,
                padding: "10px",
                borderRadius: 8,
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "#60a5fa",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ⎘ Copy Price Summary
            </button>
          </div>
        </Card>

        {/* ── Multiplier Price Cards ────────────────────────────────────────── */}
        <Card>
          <SectionTitle
            icon="✕"
            title="Cost Multiplier Pricing"
            subtitle="Based on pure COGS (excl. platform & tax)"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10,
            }}
          >
            {multiplierCard("3× Cost", r.price3x, r.margin3x, "#f59e0b")}
            {multiplierCard("4× Cost", r.price4x, r.margin4x, "#10b981")}
            {multiplierCard("5× Cost", r.price5x, r.margin5x, "#3b82f6")}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              fontSize: 10,
              color: "#475569",
              lineHeight: 1.7,
            }}
          >
            💡 Industry standard for apparel:{" "}
            <span style={{ color: "#f59e0b" }}>4×–5× COGS</span> for D2C.
            Wholesale typically{" "}
            <span style={{ color: "#a78bfa" }}>2×–2.5× COGS</span>. Your COGS ={" "}
            <span style={{ color: "#60a5fa", fontFamily: "monospace" }}>
              {fmt(
                compute(inp).totalCost -
                  compute(inp).platformAmt -
                  compute(inp).taxAmt,
              )}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}

//   function multiplierCard(
//     label: string,
//     price: number,
//     margin: number,
//     accent: string,
//   ) {
//     return (
//       <div
//         style={{
//           background: "rgba(255,255,255,0.04)",
//           border: `1px solid ${accent}33`,
//           borderRadius: 10,
//           padding: "12px 10px",
//           textAlign: "center",
//         }}
//       >
//         <div
//           style={{
//             fontSize: 10,
//             color: "#475569",
//             fontWeight: 700,
//             textTransform: "uppercase",
//             letterSpacing: "0.08em",
//             marginBottom: 6,
//           }}
//         >
//           {label}
//         </div>
//         <div
//           style={{
//             fontSize: 18,
//             fontWeight: 800,
//             color: accent,
//             fontFamily: "monospace",
//             marginBottom: 6,
//           }}
//         >
//           {fmt(price)}
//         </div>
//         <div
//           style={{
//             fontSize: 10,
//             fontWeight: 700,
//             fontFamily: "monospace",
//             color: marginColor(margin),
//             background: `${marginColor(margin)}18`,
//             borderRadius: 8,
//             padding: "2px 8px",
//             display: "inline-block",
//           }}
//         >
//           {margin.toFixed(1)}% margin
//         </div>
//       </div>
//     );
//   }
// }
