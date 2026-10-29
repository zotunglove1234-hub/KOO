import AsyncStorage from '@react-native-async-storage/async-storage';

import { getProduct, pastOrders, type OrderSummary } from '@/data/catalog';
import type { DateCopy, Dictionary } from '@/i18n';
import { offsetDate } from '@/lib/format';

const ORDERS_KEY = 'koo.orders.v1';

export type PaymentMethodId = 'wallet' | 'card' | 'cod';

export type OrderLine = {
  productId: string;
  name: string;
  optionValue?: string;
  qty: number;
  unitPriceCents: number;
};

export type Address = {
  fullName: string;
  line1: string;
  city: string;
  phone: string;
};

export type PlacedOrder = {
  id: string;
  placedAt: string;
  status: OrderSummary['status'];
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  address: Address;
  etaLabel: string;
  paymentLabel: string;
  /**
   * Which payment method was chosen. The label is kept for the receipt text,
   * but the id is what the order screen translates, so an order placed in
   * English still reads correctly after switching to Myanmar.
   */
  paymentId?: PaymentMethodId;
};

const savedOrderIndex = new Map<string, PlacedOrder>();

/** KOO-XXXX style ids: deterministic enough to read, unique enough to key on. */
export function nextOrderId(): string {
  const seed = Date.now().toString(36).slice(-4).toUpperCase();
  return `KOO-${seed}`;
}

export function defaultAddress(): Address {
  return {
    fullName: 'Ada Okonkwo',
    line1: '14 Fulan Street, Ikoyi',
    city: 'Lagos',
    phone: '+234 800 555 0113',
  };
}

export function buildOrder(options: {
  id: string;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  address: Address;
  paymentLabel: string;
  paymentId: PaymentMethodId;
  /** Active dictionary date slice, so the stored ETA matches the chosen language. */
  dates: DateCopy;
}): PlacedOrder {
  const { dates, ...rest } = options;
  const placedAt = new Date().toISOString().slice(0, 10);
  return {
    ...rest,
    placedAt,
    status: 'Preparing',
    etaLabel: deliveryEtaLabel(dates),
  };
}

function deliveryEtaLabel(dates: DateCopy): string {
  const label = (days: number) => {
    const { day, monthIndex, year } = offsetDate(days);
    return dates.formatDate(day, dates.months[monthIndex] ?? '', year);
  };
  return dates.dateRange(label(3), label(5));
}

export async function persistOrder(order: PlacedOrder): Promise<void> {
  savedOrderIndex.set(order.id, order);
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    const existing = raw ? (JSON.parse(raw) as PlacedOrder[]) : [];
    const next = [order, ...existing.filter((item) => item.id !== order.id)].slice(0, 25);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  } catch {
    // In-memory copy still serves this session if storage is unavailable.
  }
}

export async function getOrder(id: string): Promise<PlacedOrder | undefined> {
  if (savedOrderIndex.has(id)) return savedOrderIndex.get(id);
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    const stored = raw ? (JSON.parse(raw) as PlacedOrder[]) : [];
    for (const order of stored) savedOrderIndex.set(order.id, order);
    return savedOrderIndex.get(id);
  } catch {
    return undefined;
  }
}

/** Order history = locally placed orders plus the seeded catalog orders. */
export async function listOrders(): Promise<PlacedOrder[]> {
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    const stored = raw ? (JSON.parse(raw) as PlacedOrder[]) : [];
    return stored;
  } catch {
    return [];
  }
}

export function orderHeadline(order: PlacedOrder, t: Dictionary): string {
  const first = order.lines[0];
  if (!first) return t.order.emptyOrder;
  const name = getProduct(first.productId)?.name ?? first.name;
  return order.lines.length > 1 ? t.order.headline(name, order.lines.length - 1) : name;
}

export function summaryFromOrder(order: PlacedOrder, t: Dictionary): OrderSummary {
  return {
    id: order.id,
    placedAt: order.placedAt,
    status: order.status,
    items: order.lines.reduce((sum, line) => sum + line.qty, 0),
    totalCents: order.totalCents,
    headline: orderHeadline(order, t),
  };
}

export { pastOrders };
