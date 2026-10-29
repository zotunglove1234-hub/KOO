import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { currency } from '@/theme';
import { getProduct, products } from '@/data/catalog';

const STORAGE_KEY = 'koo.cart.v1';

export type CartLine = {
  /** Stable key: product id plus chosen option value. */
  key: string;
  productId: string;
  optionValue?: string;
  qty: number;
};

type CartState = {
  hydrated: boolean;
  lines: CartLine[];
};

type CartAction =
  | { type: 'hydrate'; lines: CartLine[] }
  | { type: 'add'; productId: string; optionValue?: string; qty: number }
  | { type: 'setQty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

const initialState: CartState = { hydrated: false, lines: [] };

function lineKey(productId: string, optionValue?: string): string {
  return optionValue ? `${productId}::${optionValue}` : productId;
}

function clampQty(qty: number, productId: string): number {
  const stock = getProduct(productId)?.stock ?? 99;
  return Math.max(1, Math.min(Math.floor(qty), Math.min(stock, 10)));
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'hydrate':
      return { hydrated: true, lines: action.lines };

    case 'add': {
      const key = lineKey(action.productId, action.optionValue);
      const existing = state.lines.find((line) => line.key === key);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((line) =>
            line.key === key ? { ...line, qty: clampQty(line.qty + action.qty, action.productId) } : line
          ),
        };
      }
      return {
        ...state,
        lines: [...state.lines, { key, productId: action.productId, optionValue: action.optionValue, qty: clampQty(action.qty, action.productId) }],
      };
    }

    case 'setQty': {
      if (action.qty <= 0) {
        return { ...state, lines: state.lines.filter((line) => line.key !== action.key) };
      }
      const line = state.lines.find((item) => item.key === action.key);
      if (!line) return state;
      return {
        ...state,
        lines: state.lines.map((item) =>
          item.key === action.key ? { ...item, qty: clampQty(action.qty, item.productId) } : item
        ),
      };
    }

    case 'remove':
      return { ...state, lines: state.lines.filter((line) => line.key !== action.key) };

    case 'clear':
      return { ...state, lines: [] };

    default:
      return state;
  }
}

export type CartLineItem = CartLine & {
  product: (typeof products)[number];
  lineTotalCents: number;
};

export type CartTotals = {
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  freeShipping: boolean;
  /** Cents still needed to unlock free shipping; 0 when already unlocked. */
  amountToFreeShippingCents: number;
};

type CartContextValue = {
  items: CartLineItem[];
  totals: CartTotals;
  hydrated: boolean;
  add: (productId: string, options?: { qty?: number; optionValue?: string }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  qtyOf: (productId: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const dirty = useRef(false);

  // Restore once on mount; a corrupt payload should never brick the app.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
        const valid = Array.isArray(parsed)
          ? parsed.filter((line) => line && typeof line.key === 'string' && getProduct(line.productId))
          : [];
        dispatch({ type: 'hydrate', lines: valid.map((line) => ({ ...line, qty: clampQty(line.qty ?? 1, line.productId) })) });
      } catch {
        if (!cancelled) dispatch({ type: 'hydrate', lines: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist after hydration so we never overwrite storage with the empty state.
  useEffect(() => {
    if (!state.hydrated || !dirty.current) return;
    dirty.current = false;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines)).catch(() => {
      /* storage failures are non-fatal for a demo cart */
    });
  }, [state.hydrated, state.lines]);

  const mutate = useCallback((action: CartAction) => {
    dirty.current = true;
    dispatch(action);
  }, []);

  const add = useCallback(
    (productId: string, options?: { qty?: number; optionValue?: string }) => {
      mutate({ type: 'add', productId, optionValue: options?.optionValue, qty: options?.qty ?? 1 });
    },
    [mutate]
  );

  const setQty = useCallback((key: string, qty: number) => mutate({ type: 'setQty', key, qty }), [mutate]);
  const remove = useCallback((key: string) => mutate({ type: 'remove', key }), [mutate]);
  const clear = useCallback(() => mutate({ type: 'clear' }), [mutate]);

  const items = useMemo<CartLineItem[]>(
    () =>
      state.lines.flatMap((line) => {
        const product = getProduct(line.productId);
        if (!product) return [];
        return [{ ...line, product, lineTotalCents: product.priceCents * line.qty }];
      }),
    [state.lines]
  );

  const totals = useMemo<CartTotals>(() => {
    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
    const freeShipping = subtotalCents === 0 || subtotalCents >= currency.freeShippingThresholdCents;
    const shippingCents = freeShipping ? 0 : currency.shippingCents;
    const taxCents = Math.round((subtotalCents * currency.taxRateBps) / 10_000);
    return {
      itemCount,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents: subtotalCents + shippingCents + taxCents,
      freeShipping,
      amountToFreeShippingCents: freeShipping ? 0 : currency.freeShippingThresholdCents - subtotalCents,
    };
  }, [items]);

  const qtyOf = useCallback(
    (productId: string) =>
      state.lines.filter((line) => line.productId === productId).reduce((sum, line) => sum + line.qty, 0),
    [state.lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, totals, hydrated: state.hydrated, add, setQty, remove, clear, qtyOf }),
    [items, totals, state.hydrated, add, setQty, remove, clear, qtyOf]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
