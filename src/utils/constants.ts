import type { Category, PaymentMode, Month, BudgetMap, ProductCategory } from "../types";

export const CATEGORIES: Category[] = [
    "Ads",
    "Salary",
    "Inventory",
    "Manufacturing",
    "Packaging",
    "Sampling",
    "Logistics",
    "Software",
    "Shipping",
    "Wallet Load",
    "Influencer Marketing",
    "Meta Ads",
    "Google Ads",
    "Miscellaneous",
];

// Your actual products — used for mock revenue breakdown
export const PRODUCT_CATEGORIES: ProductCategory[] = [
    "T-Shirt",
    "Polo",
    "Acid Wash",
    "Jacket",
    "Hoodie",
    "Shirts",
    "Shorts",
    "Cargo",
    "Jogger",
];

export const MONTHS: Month[] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const PAYMENT_MODES: PaymentMode[] = [
    "Cash", "Bank Transfer", "Credit Card", "Debit Card", "UPI", "Cheque", "COD",
];

export const CAT_COLORS: Record<Category, string> = {
    "Ads": "#3B82F6",
    "Salary": "#8B5CF6",
    "Inventory": "#10B981",
    "Manufacturing": "#F59E0B",
    "Packaging": "#EC4899",
    "Sampling": "#06B6D4",
    "Logistics": "#EF4444",
    "Software": "#6366F1",
    "Shipping": "#F97316",
    "Wallet Load": "#14B8A6",
    "Influencer Marketing": "#A855F7",
    "Meta Ads": "#0EA5E9",
    "Google Ads": "#22C55E",
    "Miscellaneous": "#78716C",
};

export const PRODUCT_COLORS: Record<ProductCategory, string> = {
    "T-Shirt": "#3B82F6",
    "Polo": "#8B5CF6",
    "Acid Wash": "#10B981",
    "Jacket": "#F59E0B",
    "Hoodie": "#EC4899",
    "Shirts": "#06B6D4",
    "Shorts": "#EF4444",
    "Cargo": "#6366F1",
    "Jogger": "#F97316",
};

export const CHART_COLORS = [
    "#3b82f6", "#8b5cf6", "#10b981",
    "#f59e0b", "#ec4899", "#06b6d4",
    "#ef4444", "#6366f1", "#f97316",
    "#14b8a6", "#a855f7", "#0ea5e9",
    "#22c55e", "#78716c",
];

export const DEFAULT_BUDGETS: BudgetMap = {
    "Ads": 80_000,
    "Salary": 90_000,
    "Inventory": 150_000,
    "Manufacturing": 100_000,
    "Packaging": 25_000,
    "Sampling": 15_000,
    "Logistics": 40_000,
    "Software": 15_000,
    "Shipping": 30_000,
    "Wallet Load": 20_000,
    "Influencer Marketing": 50_000,
    "Meta Ads": 60_000,
    "Google Ads": 40_000,
    "Miscellaneous": 10_000,
};

export const AUTO_SYNC_INTERVAL_SEC = 300; // 5 minutes