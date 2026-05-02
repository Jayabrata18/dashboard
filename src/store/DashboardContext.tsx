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
  return {
    from: `${year}-01`,
    to: `${year}-${month}`,
  };
};

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState: DashboardState = {
  expenses: [],
  revenue: {},
  investments: [],
  expenseSummary: [],
  expenseGrandTotal: null,
  webAppUrl: import.meta.env.VITE_WEB_APP_URL || "",
  syncStatus: "idle",
  lastSync: null,
  nextSyncIn: null,
  fetchDurationMs: null,
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
  | { type: "SYNC_START" }
  | {
      type: "SYNC_SUCCESS";
      payload: { data: SheetApiResponse; durationMs: number };
    }
  | { type: "SYNC_ERROR" }
  | { type: "TICK_COUNTDOWN" };

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

    case "SYNC_START":
      return { ...state, syncStatus: "syncing" };

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

    case "SYNC_ERROR":
      return { ...state, syncStatus: "error" };

    case "TICK_COUNTDOWN":
      return {
        ...state,
        nextSyncIn:
          state.nextSyncIn !== null && state.nextSyncIn > 0
            ? state.nextSyncIn - 1
            : null,
      };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<Action>;
  fetchData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFetchedRef = useRef(false);

  // ── Countdown ticker ────────────────────────────────────────────────────────
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      dispatch({ type: "TICK_COUNTDOWN" });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
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

  // ── Auto-fetch on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (state.webAppUrl && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchData();
    }
  }, [state.webAppUrl, fetchData]);

  // ── Auto-fetch when countdown hits 0 ───────────────────────────────────────
  useEffect(() => {
    if (state.nextSyncIn === 0 && state.webAppUrl) {
      fetchData();
    }
  }, [state.nextSyncIn, state.webAppUrl, fetchData]);

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
