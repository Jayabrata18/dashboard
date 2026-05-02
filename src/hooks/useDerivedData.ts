import { useMemo } from "react";
import { useDashboard } from "../store/DashboardContext";
import { CATEGORIES, MONTHS, PAYMENT_MODES, CAT_COLORS } from "../utils/constants";
import { toYM } from "../utils/format";
import type {
    Expense,
    Month,
    MonthlyRow,
    CategoryBreakdown,
    PaymentBreakdown,
    BudgetRow,
} from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidExpense = (e: Expense): boolean => {
    if (e.amount <= 0) return false;
    if (e.amount === 9000 && (!e.description || e.description.trim() === "")) return false;
    return true;
};

// ─── Simple summary hook (reads pre-computed sheet data) ──────────────────────

export function useDerivedData1() {
    const { state } = useDashboard();
    const { revenue, investments, expenseSummary, expenseGrandTotal } = state;

    const totalExpenses1 = expenseGrandTotal?.totalSpent ?? 0;

    const totalRevenue1 = useMemo(
        () => Object.values(revenue).reduce((s, v) => s + (v ?? 0), 0),
        [revenue]
    );

    const adSpend = useMemo(
        () => expenseSummary.find((c) => c.category === "Ads")?.totalSpent ?? 0,
        [expenseSummary]
    );

    return {
        totalExpenses1,
        totalRevenue1,
        investments,
        adSpend,
    };
}

// ─── Full derived data hook ───────────────────────────────────────────────────

export function useDerivedData() {
    const { state } = useDashboard();
    const { expenses, revenue, investments, dateRange, selectedCategory, budgets } = state;

    // ── Filtered expenses ───────────────────────────────────────────────────────
    const filteredExpenses = useMemo<Expense[]>(() => {
        return expenses.filter((e) => {
            if (!isValidExpense(e)) return false;
            const ym = e.date.slice(0, 7);
            const inRange = ym >= dateRange.from && ym <= dateRange.to;
            const inCat = selectedCategory === "All" || e.category === selectedCategory;
            return inRange && inCat;
        });
    }, [expenses, dateRange, selectedCategory]);

    // ── Totals ──────────────────────────────────────────────────────────────────
    const totalExpenses = useMemo(
        () => filteredExpenses.reduce((s, e) => s + e.amount, 0),
        [filteredExpenses]
    );

    const totalRevenue = useMemo(
        () =>
            MONTHS.reduce((sum, mo) => {
                const ym = toYM(mo);
                if (ym >= dateRange.from && ym <= dateRange.to) {
                    return sum + (revenue[mo] ?? 0);
                }
                return sum;
            }, 0),
        [revenue, dateRange]
    );

    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // ── Monthly rows ────────────────────────────────────────────────────────────
    const monthlyData = useMemo<MonthlyRow[]>(() => {
        return MONTHS.flatMap((mo) => {
            const ym = toYM(mo);
            if (ym < dateRange.from || ym > dateRange.to) return [];
            const exp = expenses
                .filter((e) => isValidExpense(e) && e.date.slice(0, 7) === ym)
                .reduce((s, e) => s + e.amount, 0);
            const rev = revenue[mo] ?? 0;
            return [{ month: mo as Month, revenue: rev, expenses: exp, profit: rev - exp }];
        });
    }, [expenses, revenue, dateRange]);

    const activeMths = useMemo(
        () => monthlyData.filter((m) => m.expenses > 0).length || 1,
        [monthlyData]
    );

    // ── Category breakdown ──────────────────────────────────────────────────────
    const catBreakdown = useMemo<CategoryBreakdown[]>(() => {
        return CATEGORIES.map((cat) => ({
            name: cat,
            value: filteredExpenses
                .filter((e) => e.category === cat)
                .reduce((s, e) => s + e.amount, 0),
            color: CAT_COLORS[cat],
        }))
            .filter((c) => c.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [filteredExpenses]);

    // ── Payment breakdown ───────────────────────────────────────────────────────
    const payBreakdown = useMemo<PaymentBreakdown[]>(() => {
        return PAYMENT_MODES.map((mode) => ({
            name: mode,
            value: filteredExpenses
                .filter((e) => e.payment === mode)
                .reduce((s, e) => s + e.amount, 0),
        })).filter((p) => p.value > 0);
    }, [filteredExpenses]);

    // ── Ad / marketing metrics ──────────────────────────────────────────────────
    const adSpend = useMemo(
        () =>
            filteredExpenses
                .filter((e) => e.category === "Ads")
                .reduce((s, e) => s + e.amount, 0),
        [filteredExpenses]
    );
    const roas = adSpend > 0 ? totalRevenue / adSpend : 0;

    // ── Inventory metrics ───────────────────────────────────────────────────────
    const inventoryCost = useMemo(
        () =>
            filteredExpenses
                .filter((e) => e.category === "Inventory")
                .reduce((s, e) => s + e.amount, 0),
        [filteredExpenses]
    );
    const inventoryTurnover = inventoryCost > 0 ? totalRevenue / inventoryCost : 0;

    // ── Burn metrics ────────────────────────────────────────────────────────────
    const avgMonthlyBurn = totalExpenses / activeMths;
    const cashRunway = avgMonthlyBurn > 0 ? totalRevenue / avgMonthlyBurn : 0;

    // ── Sparklines (last 6 months) ──────────────────────────────────────────────
    const revSpark = useMemo(
        () => MONTHS.slice(0, 6).map((mo) => ({ v: revenue[mo] ?? 0 })),
        [revenue]
    );

    const expSpark = useMemo(
        () =>
            MONTHS.slice(0, 6).map((mo) => {
                const ym = toYM(mo);
                return {
                    v: expenses
                        .filter((e) => isValidExpense(e) && e.date.slice(0, 7) === ym)
                        .reduce((s, e) => s + e.amount, 0),
                };
            }),
        [expenses]
    );

    // ── Heatmap ─────────────────────────────────────────────────────────────────
    const heatmapData = useMemo(
        () =>
            CATEGORIES.map((cat) => ({
                cat,
                values: MONTHS.map((mo) => {
                    const ym = toYM(mo);
                    return expenses
                        .filter((e) => isValidExpense(e) && e.date.slice(0, 7) === ym && e.category === cat)
                        .reduce((s, e) => s + e.amount, 0);
                }),
            })),
        [expenses]
    );

    const heatMax = useMemo(
        () => Math.max(...heatmapData.flatMap((r) => r.values), 1),
        [heatmapData]
    );

    // ── Budget vs actual ────────────────────────────────────────────────────────
    const budgetActual = useMemo<BudgetRow[]>(
        () =>
            CATEGORIES.map((cat) => {
                const actual = filteredExpenses
                    .filter((e) => e.category === cat)
                    .reduce((s, e) => s + e.amount, 0);
                const budget = budgets[cat] * activeMths;
                return { cat, actual, budget, over: actual > budget };
            }),
        [filteredExpenses, budgets, activeMths]
    );

    // ── Investments ─────────────────────────────────────────────────────────────
    const totalInvested = investments.reduce((s, i) => s + i.invested, 0);
    const totalCurrentValue = investments.reduce((s, i) => s + i.current, 0);
    const investReturn = totalCurrentValue - totalInvested;
    const investReturnPct = totalInvested > 0 ? (investReturn / totalInvested) * 100 : 0;
    console.log("Derived data computed: ", {
        filteredExpenses,
        totalExpenses,
        totalRevenue,
        netProfit,
        margin,
        monthlyData,
        activeMths,
        catBreakdown,
        payBreakdown,
        adSpend,
        roas,
        inventoryCost,
        inventoryTurnover,
        avgMonthlyBurn,
        cashRunway,
        revSpark,
        expSpark,
        heatmapData,
        heatMax,
        budgetActual,
        totalInvested,
        totalCurrentValue,
        investReturn,
        investReturnPct,
    });
    return {
        filteredExpenses,
        totalExpenses,
        totalRevenue,
        netProfit,
        margin,
        monthlyData,
        activeMths,
        catBreakdown,
        payBreakdown,
        adSpend,
        roas,
        inventoryCost,
        inventoryTurnover,
        avgMonthlyBurn,
        cashRunway,
        revSpark,
        expSpark,
        heatmapData,
        heatMax,
        budgetActual,
        totalInvested,
        totalCurrentValue,
        investReturn,
        investReturnPct,
    };
}