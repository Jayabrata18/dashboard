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

export type ProductCategory =
    | "T-Shirt"
    | "Polo"
    | "Acid Wash"
    | "Jacket"
    | "Hoodie"
    | "Shirts"
    | "Shorts"
    | "Cargo"
    | "Jogger";

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
    | "calculator"
    | "settings"
    | "instagram"

// ─── Raw API Types ────────────────────────────────────────────────────────────

export interface Expense {
    date: string;        // "YYYY-MM-DD"
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
    meta?: { lastUpdated: string; totalRows: number };
    error?: string;
    metaAds?: {
        rows: any[];
        summary: any;
        monthly: any[];
        campaigns: any[];
        adCreatives: any[];
    };
    instagram?: InstagramData;
    inventory?: InventoryData;
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

// ── Mock-only types (revenue analytics) ──────────────────────────────────────

export interface ProductRevenueRow {
    product: ProductCategory;
    revenue: number;
    units: number;
    color: string;
}

export interface ChannelRevenueRow {
    channel: string;
    value: number;
    color: string;
}

export interface DailyRevenueRow {
    date: string;   // "DD MMM"
    revenue: number;
    orders: number;
}

export interface AOVRow {
    month: Month;
    aov: number;
}

// ─── Store / State Types ──────────────────────────────────────────────────────

export interface DateRange {
    from: string; // "YYYY-MM"
    to: string;   // "YYYY-MM"
}

export type BudgetMap = Record<Category, number>;

export interface DashboardState {
    expenses: Expense[];
    revenue: RevenueMap;
    investments: Investment[];
    expenseSummary: ExpenseSummaryRow[];
    expenseGrandTotal: ExpenseGrandTotal | null;
    webAppUrl: string;
    syncStatus: SyncStatus;
    lastSync: Date | null;
    nextSyncIn: number | null;
    fetchDurationMs: number | null;
    activeSection: NavSection;
    sidebarOpen: boolean;
    dateRange: DateRange;
    selectedCategory: Category | "All";
    budgets: BudgetMap;
    metaAds: {
        rows: any[];
        summary: any;
        monthly: any[];
        campaigns: any[];
        adCreatives: any[];
    } | null;
    instagram: InstagramData | null;
    inventory: InventoryData | null;
}

// ─── Instagram Types ──────────────────────────────────────────────────────────

export interface InstagramPost {
    date: string;
    month: string;
    caption: string;
    permalink: string;
    category: string;        // Reel | Story | Image | Carousel | Video
    likes: number;
    comments: number;
    saved: number;
    shares: number;
    reach: number;
    views: number;
    follows: number;
    interactions: number;
    profileVisits: number;
    avgWatchTime: number;
    engRate: number;
    saveRate: number;
    shareRate: number;
}

export interface InstagramMonthly {
    month: string;
    posts: number;
    likes: number;
    comments: number;
    saved: number;
    shares: number;
    reach: number;
    views: number;
    follows: number;
    interactions: number;
    profileVisits: number;
    avgEngRate: number;
    cumulativeFollows: number;
}

export interface InstagramByType {
    category: string;
    count: number;
    avgEngRate: number;
    avgReach: number;
    avgLikes: number;
    avgSaved: number;
    avgShares: number;
    avgViews: number;
    likes: number;
    saved: number;
    shares: number;
    reach: number;
    views: number;
    follows: number;
}

export interface InstagramSummary {
    totalPosts: number;
    totalReels: number;
    totalStories: number;
    totalImages: number;
    likes: number;
    comments: number;
    saved: number;
    shares: number;
    reach: number;
    views: number;
    follows: number;
    interactions: number;
    profileVisits: number;
    avgEngRate: number;
    avgReach: number;
}

export interface InstagramData {
    summary: InstagramSummary;
    monthly: InstagramMonthly[];
    byType: InstagramByType[];
    topPosts: any[];
    reels: any[];
}

// ─── Inventory Types ──────────────────────────────────────────────────────────

export interface InventoryRow {
    id: string;
    title: string;
    displayName: string;
    variantTitle: string;
    size: string;
    productType: string;
    vendor: string;
    status: string;
    price: number;
    compareAt: number;
    unitCost: number;
    inventoryQty: number;
    sellableQty: number;
    totalInventory: number;
    inventoryValue: number;
    retailValue: number;
    availableForSale: boolean;
    tracked: boolean;
    daysInStock: number;
    agingBucket: string;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryByProduct {
    title: string;
    productType: string;
    totalQty: number;
    totalValue: number;
    retailValue: number;
    price: number;
    variants: number;
    outOfStock: number;
    sizes: string;
}

export interface InventoryBySize {
    size: string;
    qty: number;
    value: number;
    skus: number;
}

export interface InventoryByCategory {
    category: string;
    qty: number;
    value: number;
    retailValue: number;
    skus: number;
}

export interface InventoryAging {
    bucket: string;
    qty: number;
    value: number;
    skus: number;
}

export interface InventoryStockHealth {
    label: string;
    qty: number;
    value: number;
    color: string;
}

export interface InventoryReorderItem {
    title: string;
    size: string;
    qty: number;
    price: number;
    daysInStock: number;
    status: "OUT" | "CRITICAL" | "LOW";
}

export interface InventorySummary {
    totalSKUs: number;
    totalUnits: number;
    totalValue: number;
    totalRetailValue: number;
    potentialMargin: number;
    outOfStock: number;
    lowStock: number;
    deadStock: number;
    activeProducts: number;
    outOfStockRate: number;
    avgDaysInStock: number;
}

export interface InventoryData {
    rows: InventoryRow[];
    summary: InventorySummary;
    byProduct: InventoryByProduct[];
    bySize: InventoryBySize[];
    byCategory: InventoryByCategory[];
    aging: InventoryAging[];
    stockHealth: InventoryStockHealth[];
    reorderList: InventoryReorderItem[];
    holdingCost: number;
}

