import React from "react";

interface ProfitGaugeProps {
  margin: number;
}

export function ProfitGauge({ margin }: ProfitGaugeProps) {
  const pct = Math.min(Math.max(margin, -50), 100);
  const color = pct < 0 ? "#ef4444" : pct < 15 ? "#f59e0b" : "#10b981";
  const cx = 100;
  const cy = 100;
  const r = 70;

  const arcRanges: { from: number; to: number; color: string }[] = [
    { from: -225, to: -135, color: "#ef4444" },
    { from: -135, to: -45, color: "#f59e0b" },
    { from: -45, to: 45, color: "#10b981" },
  ];

  const describeArc = (start: number, end: number, radius: number): string => {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const x1 = cx + radius * Math.cos(toRad(start));
    const y1 = cy + radius * Math.sin(toRad(start));
    const x2 = cx + radius * Math.cos(toRad(end));
    const y2 = cy + radius * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleAngleDeg = -225 + (pct + 50) * (270 / 150);
  const needleRad = needleAngleDeg * (Math.PI / 180);
  const nx = cx + 58 * Math.cos(needleRad);
  const ny = cy + 58 * Math.sin(needleRad);

  return (
    <div style={{ textAlign: "center" }}>
      <svg
        viewBox="0 0 200 160"
        style={{
          width: "100%",
          maxWidth: 200,
          margin: "0 auto",
          display: "block",
        }}
      >
        {/* Background track */}
        <path
          d={describeArc(-225, 45, r)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={14}
          strokeLinecap="round"
        />

        {/* Colored arc segments (faint) */}
        {arcRanges.map((arc, i) => (
          <path
            key={i}
            d={describeArc(arc.from, arc.to, r)}
            fill="none"
            stroke={arc.color}
            strokeWidth={14}
            opacity={0.3}
            strokeLinecap="round"
          />
        ))}

        {/* Active fill */}
        {pct > -50 && (
          <path
            d={describeArc(-225, -225 + (pct + 50) * (270 / 150), r)}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill="white" />

        {/* Labels */}
        <text x="28" y="135" fontSize="9" fill="#6b7280" textAnchor="middle">
          -50%
        </text>
        <text x="100" y="24" fontSize="9" fill="#6b7280" textAnchor="middle">
          25%
        </text>
        <text x="172" y="135" fontSize="9" fill="#6b7280" textAnchor="middle">
          100%
        </text>

        {/* Center value */}
        <text
          x={cx}
          y={cy + 25}
          fontSize="22"
          fontWeight="700"
          fill={color}
          textAnchor="middle"
        >
          {pct.toFixed(1)}%
        </text>
        <text
          x={cx}
          y={cy + 40}
          fontSize="10"
          fill="#6b7280"
          textAnchor="middle"
        >
          margin
        </text>
      </svg>
    </div>
  );
}
