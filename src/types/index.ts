// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Category =
    | "Ads"
    | "Salary"
    | "Inventory"
    | "Manufacturing"
    | "Packaging"
    | "Sampling"
    | "Logistics"
    | "Software"
    | "Shipping"
    | "Wallet Load"
    | "Influencer Marketing"
    | "Meta Ads"
    | "Google Ads"
    | "Miscellaneous";

export type PaymentMode =
    | "Cash"
    | "Bank Transfer"
    | "Credit Card"
    | "Debit Card"
    | "UPI"
    | "Cheque"
    | "COD";

export type Month =
    | "Jan" | "Feb" | "Mar" | "Apr" | "May" | "Jun"
    | "Jul" | "Aug" | "Sep" | "Oct" | "Nov" | "Dec";

export type SyncStatus = "idle" | "syncing" | "ok" | "error";

export type NavSection =
    | "overview"
    | "financial"
    | "analytics"
    | "marketing"
    | "inventory"
    | "budget"
    | "investments"
    | "settings";

// ─── Raw API Types ────────────────────────────────────────────────────────────

export interface Expense {
    date: string;
    category: Category;
    description: string;
    amount: number;
    payment: PaymentMode;
}

export type RevenueMap = Partial<Record<Month, number>>;

export interface Investment {
    date: string;
    type: string;
    description: string;
    invested: number;
    current: number;
}

export interface ExpenseSummaryRow {
    category: Category;
    totalSpent: number;
    percentOfTotal: number;
    txnCount: number;
}

export interface ExpenseGrandTotal {
    label: string;
    totalSpent: number;
    percentOfTotal: number;
    txnCount: number;
}

export interface SheetApiResponse {
    expenses?: Expense[];
    revenue?: RevenueMap;
    investments?: Investment[];
    expenseSummary?: ExpenseSummaryRow[];
    expenseGrandTotal?: ExpenseGrandTotal;
    meta?: {
        lastUpdated: string;
        totalRows: number;
    };
    error?: string;
}

// ─── Derived / Computed Types ─────────────────────────────────────────────────

export interface MonthlyRow {
    month: Month;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface CategoryBreakdown {
    name: Category;
    value: number;
    color: string;
}

export interface PaymentBreakdown {
    name: PaymentMode;
    value: number;
}

export interface BudgetRow {
    cat: Category;
    actual: number;
    budget: number;
    over: boolean;
}

export interface CampaignRow {
    name: string;
    spend: number;
    revenue: number;
    roas: number;
    conversions: number;
}

// ─── Store / State Types ──────────────────────────────────────────────────────

export interface DateRange {
    from: string; // "YYYY-MM"
    to: string;   // "YYYY-MM"
}

export type BudgetMap = Record<Category, number>;

export interface DashboardState {
    // Raw data from sheet
    expenses: Expense[];
    revenue: RevenueMap;
    investments: Investment[];
    expenseSummary: ExpenseSummaryRow[];
    expenseGrandTotal: ExpenseGrandTotal | null;

    // Sync
    webAppUrl: string;
    syncStatus: SyncStatus;
    lastSync: Date | null;
    nextSyncIn: number | null;
    fetchDurationMs: number | null;

    // UI
    activeSection: NavSection;
    sidebarOpen: boolean;
    dateRange: DateRange;
    selectedCategory: Category | "All";
    budgets: BudgetMap;
}