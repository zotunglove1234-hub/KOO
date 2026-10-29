import type { Dictionary } from './dictionaries/en';

/**
 * Order headlines are the one place where seeded catalog data (`pastOrders` in
 * `src/data/catalog.ts`) carries English app chrome: `Terra Ceramic Mug Set + 1
 * more`. The product name is merchant content and stays; the `+ N more` tail is
 * ours, so it is rebuilt from the active dictionary.
 */
const englishTail = /^(.*) \+ (\d+) more$/;

export function localizeHeadline(raw: string, t: Dictionary): string {
  const match = englishTail.exec(raw);
  if (!match) return raw;
  return t.order.headline(match[1], Number(match[2]));
}

/** Order status is stored as a data literal; only its label is translated. */
export type OrderStatusValue = 'Delivered' | 'In transit' | 'Preparing';

const statusLabelKey: Record<OrderStatusValue, keyof Dictionary['catalog']['status']> = {
  Delivered: 'delivered',
  'In transit': 'inTransit',
  Preparing: 'preparing',
};

export function localizeStatus(status: OrderStatusValue, t: Dictionary): string {
  return t.catalog.status[statusLabelKey[status]];
}
