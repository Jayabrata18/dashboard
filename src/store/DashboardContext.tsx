import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import type {
  DashboardState,
  NavSection,
  Category,
  DateRange,
  BudgetMap,
  SheetApiResponse,
} from "../types";
import { DEFAULT_BUDGETS, AUTO_SYNC_INTERVAL_SEC } from "../utils/constants";

// ─── Initial Date Range ───────────────────────────────────────────────────────

const getInitialDateRange = (): DateRange => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return { from: `${year}-01`, to: `${year}-${month}` };
};

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: DashboardState = {
  // Source 1 — primary (expenses, revenue, investments, meta ads, instagram, inventory)
  expenses: [],
  revenue: {},
  investments: [],
  expenseSummary: [],
  expenseGrandTotal: null,
  metaAds: null,
  instagram: null,
  inventory: null,
  webAppUrl: import.meta.env.VITE_WEB_APP_URL_1 || "",
  syncStatus: "idle",
  lastSync: null,
  nextSyncIn: null,
  fetchDurationMs: null,

  // Source 2 — secondary (customers, orders)
  customers: null,
  orders: null,
  webAppUrl2: import.meta.env.VITE_WEB_APP_URL_2 || "",
  syncStatus2: "idle",
  lastSync2: null,
  nextSyncIn2: null,
  fetchDurationMs2: null,

  // UI
  activeSection: "overview",
  sidebarOpen: true,
  dateRange: getInitialDateRange(),
  selectedCategory: "All",
  budgets: DEFAULT_BUDGETS,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_SECTION"; payload: NavSection }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_DATE_RANGE"; payload: Partial<DateRange> }
  | { type: "SET_CATEGORY"; payload: Category | "All" }
  | { type: "SET_BUDGET"; payload: { cat: Category; value: number } }
  | { type: "SET_WEB_APP_URL"; payload: string }
  | { type: "SET_WEB_APP_URL_2"; payload: string }
  | { type: "SYNC_START" }
  | { type: "SYNC_START_2" }
  | {
      type: "SYNC_SUCCESS";
      payload: { data: SheetApiResponse; durationMs: number };
    }
  | {
      type: "SYNC_SUCCESS_2";
      payload: { data: SheetApiResponse; durationMs: number };
    }
  | { type: "SYNC_ERROR" }
  | { type: "SYNC_ERROR_2" }
  | { type: "TICK_COUNTDOWN" }
  | { type: "TICK_COUNTDOWN_2" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case "SET_SECTION":
      return { ...state, activeSection: action.payload };

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case "SET_DATE_RANGE":
      return { ...state, dateRange: { ...state.dateRange, ...action.payload } };

    case "SET_CATEGORY":
      return { ...state, selectedCategory: action.payload };

    case "SET_BUDGET":
      return {
        ...state,
        budgets: {
          ...state.budgets,
          [action.payload.cat]: action.payload.value,
        },
      };

    case "SET_WEB_APP_URL":
      return { ...state, webAppUrl: action.payload };

    case "SET_WEB_APP_URL_2":
      return { ...state, webAppUrl2: action.payload };

    case "SYNC_START":
      return { ...state, syncStatus: "syncing" };

    case "SYNC_START_2":
      return { ...state, syncStatus2: "syncing" };

    // ── Source 1 success — primary sheet data ─────────────────────────────
    case "SYNC_SUCCESS": {
      const { data, durationMs } = action.payload;
      return {
        ...state,
        syncStatus: "ok",
        lastSync: new Date(),
        nextSyncIn: AUTO_SYNC_INTERVAL_SEC,
        fetchDurationMs: durationMs,
        expenses: data.expenses ?? state.expenses,
        revenue: data.revenue ?? state.revenue,
        investments: data.investments ?? state.investments,
        expenseSummary: data.expenseSummary ?? state.expenseSummary,
        expenseGrandTotal: data.expenseGrandTotal ?? state.expenseGrandTotal,
      };
    }

    // ── Source 2 success — secondary sheet data ───────────────────────────
    case "SYNC_SUCCESS_2": {
      const { data, durationMs } = action.payload;
      return {
        ...state,
        syncStatus2: "ok",
        lastSync2: new Date(),
        nextSyncIn2: AUTO_SYNC_INTERVAL_SEC,
        fetchDurationMs2: durationMs,
        customers: data.customers ?? state.customers,
        orders: data.orders ?? state.orders,
        metaAds: data.metaAds ?? state.metaAds,
        instagram: data.instagram ?? state.instagram,
        inventory: data.inventory ?? state.inventory,
      };
    }

    case "SYNC_ERROR":
      return { ...state, syncStatus: "error" };

    case "SYNC_ERROR_2":
      return { ...state, syncStatus2: "error" };

    case "TICK_COUNTDOWN":
      return {
        ...state,
        nextSyncIn:
          state.nextSyncIn !== null && state.nextSyncIn > 0
            ? state.nextSyncIn - 1
            : null,
      };

    case "TICK_COUNTDOWN_2":
      return {
        ...state,
        nextSyncIn2:
          state.nextSyncIn2 !== null && state.nextSyncIn2 > 0
            ? state.nextSyncIn2 - 1
            : null,
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type FetchSource = "source1" | "source2" | "all";

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<Action>;
  fetchData: (source?: FetchSource) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const countdown1Ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdown2Ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetched1Ref = useRef(false);
  const hasFetched2Ref = useRef(false);

  // ── Countdown tickers ───────────────────────────────────────────────────────
  useEffect(() => {
    countdown1Ref.current = setInterval(() => {
      dispatch({ type: "TICK_COUNTDOWN" });
    }, 1000);
    return () => {
      if (countdown1Ref.current) clearInterval(countdown1Ref.current);
    };
  }, []);

  useEffect(() => {
    countdown2Ref.current = setInterval(() => {
      dispatch({ type: "TICK_COUNTDOWN_2" });
    }, 1000);
    return () => {
      if (countdown2Ref.current) clearInterval(countdown2Ref.current);
    };
  }, []);

  // ── Fetch source 1 ──────────────────────────────────────────────────────────
  const fetchSource1 = useCallback(async () => {
    if (!state.webAppUrl) return;
    dispatch({ type: "SYNC_START" });
    const t0 = performance.now();
    try {
      const res = await fetch(`${state.webAppUrl}?action=getAllData`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SheetApiResponse = await res.json();
      if (data.error) throw new Error(data.error);
      dispatch({
        type: "SYNC_SUCCESS",
        payload: { data, durationMs: Math.round(performance.now() - t0) },
      });
    } catch {
      dispatch({ type: "SYNC_ERROR" });
    }
  }, [state.webAppUrl]);

  // ── Fetch source 2 ──────────────────────────────────────────────────────────
  // const fetchSource2 = useCallback(async () => {
  //   if (!state.webAppUrl2) return;
  //   dispatch({ type: "SYNC_START_2" });
  //   const t0 = performance.now();
  //   try {
  //     const res = await fetch(`${state.webAppUrl2}?action=getAllData`);
  //     if (!res.ok) throw new Error(`HTTP ${res.status}`);
  //     const data: SheetApiResponse = await res.json();
  //     if (data.error) throw new Error(data.error);
  //     dispatch({
  //       type: "SYNC_SUCCESS_2",
  //       payload: { data, durationMs: Math.round(performance.now() - t0) },
  //     });
  //   } catch {
  //     dispatch({ type: "SYNC_ERROR_2" });
  //   }
  // }, [state.webAppUrl2]);

const fetchSource2 = useCallback(async () => {
  if (!state.webAppUrl2) return;
  dispatch({ type: "SYNC_START_2" });
  const t0 = performance.now();
  try {
    const res = await fetch(`${state.webAppUrl2}?sheet=all`); // ← changed
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.message ?? "Unknown error");

    // Unwrap — source 2 returns { sheet, generated, data: { meta, instagram, inventory, customers, orders } }
    const data: SheetApiResponse = {
      metaAds: json.data?.meta ?? null,
      instagram: json.data?.instagram ?? null,
      inventory: json.data?.inventory ?? null,
      customers: json.data?.customers ?? null,
      orders: json.data?.orders ?? null,
    };

    console.log("SOURCE 2 unwrapped:", Object.keys(data));
    console.log("SOURCE 2 customers:", data.customers?.summary);

    dispatch({
      type: "SYNC_SUCCESS_2",
      payload: { data, durationMs: Math.round(performance.now() - t0) },
    });
  } catch (e) {
    console.error("SOURCE 2 fetch error:", e);
    dispatch({ type: "SYNC_ERROR_2" });
  }
}, [state.webAppUrl2]);
  // ── Unified fetchData — accepts optional source param ───────────────────────
  const fetchData = useCallback(
    async (source: FetchSource = "all") => {
      if (source === "source1") {
        await fetchSource1();
      } else if (source === "source2") {
        await fetchSource2();
      } else {
        // "all" — fire both in parallel
        await Promise.all([fetchSource1(), fetchSource2()]);
      }
    },
    [fetchSource1, fetchSource2],
  );

  // ── Auto-fetch source 1 on mount ────────────────────────────────────────────
  useEffect(() => {
    if (state.webAppUrl && !hasFetched1Ref.current) {
      hasFetched1Ref.current = true;
      fetchSource1();
    }
  }, [state.webAppUrl, fetchSource1]);

  // ── Auto-fetch source 2 on mount ────────────────────────────────────────────
  useEffect(() => {
    if (state.webAppUrl2 && !hasFetched2Ref.current) {
      hasFetched2Ref.current = true;
      fetchSource2();
    }
  }, [state.webAppUrl2, fetchSource2]);

  // ── Auto-sync source 1 when countdown hits 0 ────────────────────────────────
  useEffect(() => {
    if (state.nextSyncIn === 0 && state.webAppUrl) {
      fetchSource1();
    }
  }, [state.nextSyncIn, state.webAppUrl, fetchSource1]);

  // ── Auto-sync source 2 when countdown hits 0 ────────────────────────────────
  useEffect(() => {
    if (state.nextSyncIn2 === 0 && state.webAppUrl2) {
      fetchSource2();
    }
  }, [state.nextSyncIn2, state.webAppUrl2, fetchSource2]);

  return (
    <DashboardContext.Provider value={{ state, dispatch, fetchData }}>
      {children}
    </DashboardContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
