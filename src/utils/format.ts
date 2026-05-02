export const fmt = (n: number): string =>
    `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const fmtK = (n: number): string =>
    n >= 100_000
        ? `₹${(n / 100_000).toFixed(1)}L`
        : n >= 1_000
            ? `₹${(n / 1_000).toFixed(0)}K`
            : `₹${n}`;

export const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

export const fmtDuration = (ms: number): string => {
    if (ms < 1_000) return `${ms}ms`;
    return `${(ms / 1_000).toFixed(1)}s`;
};

export const fmtCountdown = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export const fmtTime = (date: Date): string =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const monthIndex = (mo: string): number => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.indexOf(mo);
};

export const toYM = (monthName: string, year = 2026): string => {
    const idx = monthIndex(monthName) + 1;
    return `${year}-${String(idx).padStart(2, "0")}`;
};
