export type CategoryId = 'audio' | 'apparel' | 'accessories' | 'home' | 'tech' | 'fitness';

/** Literal union of the Ionicons glyph names used for category chips. */
export type CategoryIcon =
  | 'headset-outline'
  | 'shirt-outline'
  | 'watch-outline'
  | 'home-outline'
  | 'laptop-outline'
  | 'barbell-outline';

export type Product = {
  id: string;
  name: string;
  seller: string;
  category: CategoryId;
  priceCents: number;
  compareAtCents?: number;
  rating: number;
  reviews: number;
  /** Bundled asset id from require(). */
  image: number;
  blurb: string;
  description: string;
  highlights: string[];
  /** Single purchase option group, e.g. colour or size. */
  option?: { label: string; values: string[] };
  stock: number;
  freeShipping: boolean;
  trending?: boolean;
};

export type Category = {
  id: CategoryId;
  label: string;
  icon: CategoryIcon;
};

export const categories: Category[] = [
  { id: 'audio', label: 'Audio', icon: 'headset-outline' },
  { id: 'apparel', label: 'Apparel', icon: 'shirt-outline' },
  { id: 'accessories', label: 'Accessories', icon: 'watch-outline' },
  { id: 'home', label: 'Home', icon: 'home-outline' },
  { id: 'tech', label: 'Tech', icon: 'laptop-outline' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell-outline' },
];

// Metro cannot resolve dynamic requires that climb above the module directory,
// so every asset is required explicitly and looked up by key.
const img = {
  headphones: require('../../assets/products/headphones.jpg') as number,
  earbuds: require('../../assets/products/earbuds.jpg') as number,
  sneakers: require('../../assets/products/sneakers.jpg') as number,
  watch: require('../../assets/products/watch.jpg') as number,
  backpack: require('../../assets/products/backpack.jpg') as number,
  lamp: require('../../assets/products/lamp.jpg') as number,
  mugs: require('../../assets/products/mugs.jpg') as number,
  jacket: require('../../assets/products/jacket.jpg') as number,
  keyboard: require('../../assets/products/keyboard.jpg') as number,
  speaker: require('../../assets/products/speaker.jpg') as number,
  yogamat: require('../../assets/products/yogamat.jpg') as number,
  sunglasses: require('../../assets/products/sunglasses.jpg') as number,
};

export const products: Product[] = [
  {
    id: 'aurora-headphones',
    name: 'Aurora Over-Ear Headphones',
    seller: 'Soundlab Studio',
    category: 'audio',
    priceCents: 18900,
    compareAtCents: 22900,
    rating: 4.8,
    reviews: 1284,
    image: img.headphones,
    blurb: 'Adaptive noise cancelling, 40h battery',
    description:
      'Aurora pairs a dual-chamber driver with adaptive noise cancelling that re-tunes every 0.4 seconds. Memory-foam earcups and a 268 g frame keep long sessions comfortable, and multipoint pairing holds your laptop and phone at once.',
    highlights: ['40 h playback, 10 min quick charge', 'Adaptive ANC with transparency mode', 'Multipoint Bluetooth 5.4', 'Detachable boom mic included'],
    option: { label: 'Colour', values: ['Midnight', 'Sand', 'Forest'] },
    stock: 12,
    freeShipping: true,
    trending: true,
  },
  {
    id: 'pulse-earbuds',
    name: 'Pulse Wireless Earbuds',
    seller: 'Soundlab Studio',
    category: 'audio',
    priceCents: 9900,
    compareAtCents: 12900,
    rating: 4.6,
    reviews: 2317,
    image: img.earbuds,
    blurb: 'Pocket ANC with wireless charging case',
    description:
      'Six-microphone array, indoor-tuned equaliser presets and an IPX5 coating make Pulse the everyday pair. The case adds three extra charges and tops up over any Qi pad.',
    highlights: ['8 h per charge, 32 h with case', 'Six-mic call clarity', 'IPX5 sweat and rain resistant', 'Qi wireless charging case'],
    option: { label: 'Tip size', values: ['Small', 'Medium', 'Large'] },
    stock: 34,
    freeShipping: true,
    trending: true,
  },
  {
    id: 'drift-speaker',
    name: 'Drift Portable Speaker',
    seller: 'Nomad Audio',
    category: 'audio',
    priceCents: 7900,
    rating: 4.5,
    reviews: 640,
    image: img.speaker,
    blurb: '360° sound, 20 h playtime, IP67',
    description:
      'A racetrack woofer and twin tweeters throw sound in every direction. Rubberised ends, IP67 sealing and a washable fabric shell mean it survives the beach and the backpack alike.',
    highlights: ['360° driver array', '20 h playtime at 60% volume', 'IP67 dust and water proof', 'Stereo pair with a second Drift'],
    stock: 21,
    freeShipping: false,
  },
  {
    id: 'koo-runner-sneakers',
    name: 'KOO Runner Sneakers',
    seller: 'KOO Originals',
    category: 'apparel',
    priceCents: 12900,
    compareAtCents: 14900,
    rating: 4.7,
    reviews: 892,
    image: img.sneakers,
    blurb: 'Everyday trainer with nitrogen foam midsole',
    description:
      'Knit upper over a nitrogen-infused foam midsole gives a springy, stable ride for commuting and easy runs. Reinforced heel counter and 4 mm lugs keep traction honest on wet pavement.',
    highlights: ['270 g per shoe (size 9)', 'Nitrogen foam midsole', 'Recycled knit upper', 'Reflective heel details'],
    option: { label: 'Size', values: ['7', '8', '9', '10', '11', '12'] },
    stock: 8,
    freeShipping: true,
    trending: true,
  },
  {
    id: 'nimbus-puffer-jacket',
    name: 'Nimbus Puffer Jacket',
    seller: 'Northbound Co.',
    category: 'apparel',
    priceCents: 14900,
    rating: 4.4,
    reviews: 318,
    image: img.jacket,
    blurb: 'Packable 800-fill weather shell',
    description:
      'Water-repellent ripstop face with responsibly sourced 800-fill down. Packs into its own chest pocket, so it is never a bulk problem on the commute.',
    highlights: ['800-fill certified down', 'Packs into chest pocket', 'Wind-flap two-way zip', 'Adjustable hem cords'],
    option: { label: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
    stock: 15,
    freeShipping: true,
  },
  {
    id: 'meridian-watch',
    name: 'Meridian Field Watch',
    seller: 'Meridian Time',
    category: 'accessories',
    priceCents: 21900,
    compareAtCents: 25900,
    rating: 4.9,
    reviews: 456,
    image: img.watch,
    blurb: 'Sapphire crystal, 100 m water resistance',
    description:
      'A 38 mm brushed steel case with domed sapphire crystal and a genuine leather strap. Miyota automatic movement, 41 h reserve, and a lume layout that stays legible at night.',
    highlights: ['Sapphire crystal glass', 'Automatic, 41 h reserve', '100 m water resistance', 'Quick-release leather strap'],
    option: { label: 'Strap', values: ['Brown leather', 'Black leather', 'Steel bracelet'] },
    stock: 6,
    freeShipping: true,
    trending: true,
  },
  {
    id: 'lumen-sunglasses',
    name: 'Lumen Sunglasses',
    seller: 'Coastline Optics',
    category: 'accessories',
    priceCents: 8900,
    rating: 4.3,
    reviews: 211,
    image: img.sunglasses,
    blurb: 'Polarised amber lenses, acetate frame',
    description:
      'Hand-polished acetate frame with polarised amber lenses that lift contrast on overcast days. Spring hinges and silicone temple tips keep the fit steady.',
    highlights: ['Polarised, CAT-3 amber lenses', 'UV400 protection', 'Spring-loaded hinges', 'Includes hard case and cloth'],
    stock: 27,
    freeShipping: false,
  },
  {
    id: 'summit-backpack',
    name: 'Summit 25L Daypack',
    seller: 'Northbound Co.',
    category: 'accessories',
    priceCents: 11900,
    compareAtCents: 13500,
    rating: 4.6,
    reviews: 1043,
    image: img.backpack,
    blurb: 'Laptop commute bag with weather shell',
    description:
      'A suspended 16" laptop sleeve, lay-flat main compartment and a hidden magnetic pocket for the small things. Back panel channels air so the commute does not turn into a sweat.',
    highlights: ['Fits 16" laptop + 10" tablet', 'Weatherproof recycled shell', 'Lay-flat 25 L main compartment', 'Tuck-away luggage pass-through'],
    option: { label: 'Colour', values: ['Slate', 'Black', 'Clay'] },
    stock: 19,
    freeShipping: true,
  },
  {
    id: 'halo-desk-lamp',
    name: 'Halo Desk Lamp',
    seller: 'Studio Goods',
    category: 'home',
    priceCents: 6900,
    rating: 4.5,
    reviews: 388,
    image: img.lamp,
    blurb: 'Flicker-free LED with touch dimming',
    description:
      'A 2700–5000 K tunable head with flicker-free drivers, so late work does not fatigue the eyes. Weighted base and a 340° swing arm keep it exactly where you put it.',
    highlights: ['2700–5000 K tunable white', 'Flicker-free, CRI 95', 'Touch dimmer and 4 presets', 'USB-C power, 10 W'],
    stock: 40,
    freeShipping: false,
  },
  {
    id: 'terra-mug-set',
    name: 'Terra Ceramic Mug Set',
    seller: 'Kiln & Co.',
    category: 'home',
    priceCents: 4500,
    compareAtCents: 5600,
    rating: 4.8,
    reviews: 674,
    image: img.mugs,
    blurb: 'Set of three stoneware mugs',
    description:
      'Reactive glaze stoneware fired at 1240 °C, so every mug carries its own surface pattern. 350 ml capacity, dishwasher safe, and a handle sized for a full grip.',
    highlights: ['Set of three, 350 ml each', 'Reactive glaze — no two alike', 'Dishwasher and microwave safe', 'Sold in plastic-free packaging'],
    stock: 23,
    freeShipping: false,
    trending: true,
  },
  {
    id: 'volt-keyboard',
    name: 'Volt Mechanical Keyboard',
    seller: 'Greygear Labs',
    category: 'tech',
    priceCents: 15900,
    rating: 4.7,
    reviews: 512,
    image: img.keyboard,
    blurb: '75% hot-swap board, tri-mode wireless',
    description:
      'Gasket-mounted 75% layout with hot-swap sockets, south-facing switches and a 4000 mAh cell. Connect over 2.4 GHz, Bluetooth, or cable without re-pairing macros.',
    highlights: ['Hot-swap north-facing sockets', '2.4 GHz + Bluetooth + USB-C', 'Gasket mount, PBT dye-sub keycaps', 'On-board macro storage'],
    option: { label: 'Switch', values: ['Tactile', 'Linear', 'Silent'] },
    stock: 11,
    freeShipping: true,
  },
  {
    id: 'zen-yoga-mat',
    name: 'Zen Alignment Yoga Mat',
    seller: 'Studio Goods',
    category: 'fitness',
    priceCents: 3900,
    compareAtCents: 4900,
    rating: 4.4,
    reviews: 927,
    image: img.yogamat,
    blurb: '6 mm cushioning with alignment lines',
    description:
      'A natural-rubber base with a polyurethane top that grips harder as it gets damp. Etched alignment lines place hands and feet consistently across the pose.',
    highlights: ['6 mm cushioning, 183 × 66 cm', 'Alignment guide lines', 'Natural rubber, closed-cell top', 'Carry strap included'],
    stock: 30,
    freeShipping: false,
  },
];

const productIndex = new Map(products.map((product) => [product.id, product]));

export function getProduct(id: string | undefined): Product | undefined {
  return id ? productIndex.get(id) : undefined;
}

/**
 * Merchant contact addresses, keyed by the exact `Product.seller` string.
 *
 * Buyer <-> seller chat needs a stable identity for the other side of a thread,
 * and the seller name is the only one the catalog carries. `koo_conversations`
 * stores this address; once the merchant registers a Supabase account with it,
 * a database trigger links their `auth.users` id to every thread they were named
 * in, so buyer messages from before they joined still show up in their inbox.
 *
 * The addresses are illustrative demo identities on `sellers.koo.market`; with
 * email confirmation switched off they can be signed up for testing.
 */
export const sellerEmails: Record<string, string> = {
  'Soundlab Studio': 'soundlab@sellers.koo.market',
  'Nomad Audio': 'nomad.audio@sellers.koo.market',
  'KOO Originals': 'koo.originals@sellers.koo.market',
  'Northbound Co.': 'northbound@sellers.koo.market',
  'Meridian Time': 'meridian.time@sellers.koo.market',
  'Coastline Optics': 'coastline.optics@sellers.koo.market',
  'Studio Goods': 'studio.goods@sellers.koo.market',
  'Kiln & Co.': 'kilnandco@sellers.koo.market',
  'Greygear Labs': 'greygear@sellers.koo.market',
};

export function getSellerEmail(seller: string): string {
  return sellerEmails[seller] ?? `${seller.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@sellers.koo.market`;
}

export function categoryLabel(id: CategoryId): string {
  return categories.find((category) => category.id === id)?.label ?? id;
}

export function relatedProducts(product: Product, limit = 6): Product[] {
  const sameCategory = products.filter((item) => item.category === product.category && item.id !== product.id);
  const fill = products.filter((item) => item.category !== product.category && item.id !== product.id);
  return [...sameCategory, ...fill].slice(0, limit);
}

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export const sortOptions: { id: SortKey; label: string }[] = [
  { id: 'relevance', label: 'Popular' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'newest', label: 'Newest' },
];

export function searchProducts(options: {
  query?: string;
  category?: CategoryId | 'all';
  sort?: SortKey;
  maxPriceCents?: number;
  onlyFreeShipping?: boolean;
}): Product[] {
  const { query = '', category = 'all', sort = 'relevance', maxPriceCents, onlyFreeShipping } = options;
  const needle = query.trim().toLowerCase();

  const matches = products.filter((product) => {
    if (category !== 'all' && product.category !== category) return false;
    if (maxPriceCents !== undefined && product.priceCents > maxPriceCents) return false;
    if (onlyFreeShipping && !product.freeShipping) return false;
    if (!needle) return true;
    const haystack = `${product.name} ${product.seller} ${product.blurb} ${categoryLabel(product.category)}`.toLowerCase();
    return needle.split(/\s+/).every((word) => haystack.includes(word));
  });

  const sorted = [...matches];
  switch (sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      break;
    case 'newest':
      sorted.sort((a, b) => Number(!!b.trending) - Number(!!a.trending) || b.reviews - a.reviews);
      break;
    default:
      sorted.sort((a, b) => b.reviews - a.reviews);
  }
  return sorted;
}

export type OrderSummary = {
  id: string;
  placedAt: string;
  status: 'Delivered' | 'In transit' | 'Preparing';
  items: number;
  totalCents: number;
  headline: string;
};

/** Deterministic stand-in for an order history API. */
export const pastOrders: OrderSummary[] = [
  {
    id: 'KOO-4821',
    placedAt: '2026-10-19',
    status: 'Delivered',
    items: 2,
    totalCents: 14350,
    headline: 'Terra Ceramic Mug Set + 1 more',
  },
  {
    id: 'KOO-4610',
    placedAt: '2026-10-04',
    status: 'Delivered',
    items: 1,
    totalCents: 11900,
    headline: 'Summit 25L Daypack',
  },
  {
    id: 'KOO-4502',
    placedAt: '2026-09-22',
    status: 'Delivered',
    items: 3,
    totalCents: 25680,
    headline: 'Pulse Wireless Earbuds + 2 more',
  },
];
