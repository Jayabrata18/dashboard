import type { Category, PaymentMode, Month, BudgetMap } from "../types";

export const CATEGORIES: Category[] = [
    "Ads", "Salary", "Inventory", "Manufacturing",
    "Packaging", "Sampling", "Logistics", "Software", "Miscellaneous",
];

export const MONTHS: Month[] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const PAYMENT_MODES: PaymentMode[] = [
    "Cash", "Bank Transfer", "Credit Card", "Debit Card", "UPI", "Cheque", "COD",
];

export const CAT_COLORS: Record<Category, string> = {
    Ads: "#3B82F6",
    Salary: "#8B5CF6",
    Inventory: "#10B981",
    Manufacturing: "#F59E0B",
    Packaging: "#EC4899",
    Sampling: "#06B6D4",
    Logistics: "#EF4444",
    Software: "#6366F1",
    Miscellaneous: "#78716C",
};

export const CHART_COLORS = [
    "#3b82f6", "#8b5cf6", "#10b981",
    "#f59e0b", "#ec4899", "#06b6d4", "#ef4444",
];

export const DEFAULT_BUDGETS: BudgetMap = {
    Ads: 80000,
    Salary: 90000,
    Inventory: 150000,
    Manufacturing: 100000,
    Packaging: 25000,
    Sampling: 15000,
    Logistics: 40000,
    Software: 15000,
    Miscellaneous: 10000,
};

export const AUTO_SYNC_INTERVAL_SEC = 300; // 5 minutes
