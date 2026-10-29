/**
 * English dictionary.
 *
 * This file is the source of truth for the shape of every translation:
 * `my.ts` is typed as `Dictionary`, so a missing or mis-signed Myanmar string
 * fails `tsc` instead of silently falling back to English at runtime.
 *
 * Anything that interpolates is a plain function rather than a templated key.
 * That keeps call sites type-checked and lets each language choose its own word
 * order and plural rules — Myanmar has no plural inflection, so its `plural.*`
 * helpers always return the same word.
 *
 * Small local helpers (`oneOr`, `itemWord`) exist so no member references `en`
 * while its type is being inferred.
 *
 * Product names, sellers, blurbs and descriptions in `src/data/catalog.ts` stay
 * untouched: they are merchant content, not app chrome. Technical identifiers
 * (product ids, route paths, `KOO-XXXX` order ids, storage keys) are never
 * translated.
 */

function oneOr(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function itemWord(count: number): string {
  return oneOr(count, 'item', 'items');
}

function sellerWord(count: number): string {
  return oneOr(count, 'seller', 'sellers');
}

function resultWord(count: number): string {
  return oneOr(count, 'result', 'results');
}

function lineWord(count: number): string {
  return oneOr(count, 'line', 'lines');
}

function conversationWord(count: number): string {
  return oneOr(count, 'conversation', 'conversations');
}

/** Option labels come from merchant data; anything unlisted passes through. */
const optionLabels: Record<string, string> = {
  Colour: 'Colour',
  'Tip size': 'Tip size',
  Size: 'Size',
  Strap: 'Strap',
  Switch: 'Switch',
};

export const en = {
  /** Language names always render in their own script, in both dictionaries. */
  langLabel: {
    en: 'English',
    my: 'မြန်မာ',
  },

  common: {
    free: 'Free',
    goBack: 'Go back',
    option: 'Option',
    bullet: ' · ',
    edit: 'Edit',
  },

  plural: {
    item: itemWord,
    seller: sellerWord,
    result: resultWord,
    line: lineWord,
    conversation: conversationWord,
  },

  /** Month abbreviations and the date shape used by `formatDate` / delivery ETAs. */
  dates: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    formatDate: (day: number, month: string, year: number) => `${month} ${day}, ${year}`,
    dateRange: (from: string, to: string) => `${from} – ${to}`,
  },

  tabs: {
    home: 'Home',
    search: 'Search',
    cart: 'Cart',
    account: 'Account',
  },

  home: {
    brand: 'KOO',
    locationCity: 'Ikoyi, Lagos',
    deliveryEta: 'delivery in 2 days',
    notifications: 'Notifications',
    alertsBanner: 'You are all caught up — no unread alerts.',
    cartA11y: (count: number) => `Cart, ${count} ${itemWord(count)}`,
    dealOfTheDay: 'Deal of the day',
    viewDeal: 'View deal',
    trendingNow: 'Trending now',
    recommendedForYou: 'Recommended for you',
    seeAll: 'See all',
    popularSellers: 'Popular sellers',
    sellerTag: {
      audio: 'Audio',
      outdoor: 'Outdoor',
      home: 'Home',
      tech: 'Tech',
      living: 'Living',
    },
  },

  search: {
    title: 'Search',
    placeholder: (productCount: number) => `Search ${productCount} products`,
    nothingFound: 'Nothing found',
    emptyBody: 'No product matches this combination. Try a wider price range or another category.',
    resetFilters: 'Reset filters',
    price: {
      any: 'Any price',
      under50: 'Under $50',
      under100: 'Under $100',
      under200: 'Under $200',
    },
  },

  cart: {
    title: 'Cart',
    loading: 'Loading your cart…',
    emptyTitle: 'Your cart is empty',
    emptyBody: 'Nothing here yet. Browse the catalog and add a product — your cart is saved on this device.',
    startShopping: 'Start shopping',
    addMore: 'Add more',
    checkoutCta: (count: number) => `Checkout (${count} ${itemWord(count)})`,
    subtitle: (items: number, sellers: number) =>
      `${items} ${itemWord(items)} from ${sellers} ${sellerWord(sellers)}`,
    freeShippingProgress: (amount: string) => `Add ${amount} more for free delivery`,
    freeShippingUnlocked: 'Free delivery unlocked',
    clearCart: 'Clear cart',
    removeA11y: (name: string) => `Remove ${name} from cart`,
  },

  summary: {
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    tax: (rate: string) => `Tax (${rate}%)`,
    taxPlain: 'Tax',
    total: 'Total',
    promoDiscount: 'Promo discount',
    totalDue: 'Total due',
  },

  product: {
    screenTitle: 'Product',
    notListed: 'This product is no longer listed.',
    backToCatalog: 'Back to catalog',
    soldOut: 'Sold out',
    added: 'Added',
    addToCart: 'Add to cart',
    chatWithSeller: 'Chat with seller',
    openCartA11y: 'Open cart',
    freeDeliveryIncluded: 'Free delivery included',
    saveA11y: 'Save item',
    unsaveA11y: 'Remove from saved items',
    discountToday: (percent: number) => `-${percent}% today`,
    inCartBadge: (count: number) => `${count} in cart`,
    lowStock: (count: number) => `Only ${count} left with this seller`,
    quantity: 'Quantity',
    maxPerOrder: (count: number) => `Max ${count} per order`,
    description: 'Description',
    whatIsIncluded: 'What is included',
    freeDeliveryTitle: 'Free delivery in 2 days',
    standardDeliveryTitle: 'Standard delivery · $6.99',
    shippedBy: (seller: string) => `Shipped by ${seller} · dispatched within 24 h from Ikoyi hub`,
    returnsTitle: '14-day returns',
    returnsNote: 'Unused items in original packaging, refunded to KOO Wallet',
    categoryLine: (label: string) => `Category: ${label}`,
    youMayAlsoLike: 'You may also like',
    qtyPrefix: (count: number) => `${count} × `,
  },

  checkout: {
    title: 'Checkout',
    subtitle: (lines: number) => `${lines} ${lineWord(lines)} · secure KOO pay`,
    deliveryAddress: 'Delivery address',
    addressFromProfile: 'Name, city and phone come from your profile.',
    addressIncomplete: 'Add your city and phone in your profile so the seller can reach you.',
    deliveryMethod: 'Delivery method',
    payment: 'Payment',
    orderSummary: 'Order summary',
    standard: 'Standard',
    standardDetail: '2–4 days',
    express: 'Express',
    expressDetail: 'Next business day',
    included: 'Included',
    extraCost: (amount: string) => `+${amount}`,
    wallet: 'KOO Wallet',
    walletDetail: 'Balance $482.10',
    card: 'Visa •••• 4412',
    cardDetail: 'Expires 04/29',
    cod: 'Pay on delivery',
    codDetail: 'Cash or card at the door',
    promoCode: 'Promo code',
    apply: 'Apply',
    applied: 'Applied',
    promoInvalid: (code: string, validCode: string) => `“${code}” is not a valid code. Try ${validCode}.`,
    promoApplied: (code: string) => `${code} applied — 10% off your items.`,
    placeOrder: (amount: string) => `Place order · ${amount}`,
    assurance: 'KOO holds payment until your order is delivered. Returns within 14 days are free.',
  },

  order: {
    loading: 'Loading order…',
    title: 'Order',
    notFound: 'We could not find that order on this device.',
    backToShopping: 'Back to shopping',
    continueShopping: 'Continue shopping',
    viewAccount: 'View account',
    confirmed: 'Order confirmed',
    placed: (date: string) => `Placed ${date}`,
    arrives: (eta: string) => `Arrives ${eta}`,
    deliveryStatus: 'Delivery status',
    stepsComplete: (done: number, total: number, status: string) =>
      `${done} of ${total} steps complete · ${status}`,
    items: 'Items',
    payment: 'Payment',
    shippingTo: 'Shipping to',
    emptyOrder: 'Empty order',
    headline: (name: string, extra: number) => `${name} + ${extra} more`,
    timeline: {
      placed: { label: 'Order placed', detail: 'Payment confirmed' },
      packing: { label: 'Seller packing', detail: 'Expected within 12 h' },
      outForDelivery: { label: 'Out for delivery', detail: 'Ikoyi hub → your address' },
      delivered: { label: 'Delivered', detail: 'Arrives by 6 pm' },
    },
  },

  /**
   * Email + password accounts, backed by Supabase Auth. Server problems come
   * back as codes (`src/lib/supabase.ts` maps them to these keys) so no raw
   * English API text is ever shown.
   */
  auth: {
    loginTitle: 'Sign in to KOO',
    loginSubtitle: 'Sign in to message sellers and keep threads across devices.',
    registerTitle: 'Create your account',
    registerSubtitle: 'One KOO account covers buying and replying as a seller.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    signInCta: 'Sign in',
    signUpCta: 'Create account',
    haveAccount: 'Already have an account?',
    needAccount: 'New to KOO?',
    notNow: 'Not now',
    signOut: 'Sign out',
    sellerHint: (email: string) =>
      `Testing the seller side? Create the account with a merchant address such as ${email}, and buyer messages will arrive in that inbox.`,
    unavailableTitle: 'Sign-in is off in this build',
    unavailableBody:
      'This copy of KOO was built without Supabase details, so accounts and messaging are unavailable. Browsing, the cart and checkout still work.',
    validation: {
      emailRequired: 'Enter your email address.',
      passwordRequired: 'Enter your password.',
      emailInvalid: 'That does not look like an email address.',
      passwordShort: (count: number) => `Use at least ${count} characters.`,
    },
    errors: {
      notConfigured: 'Sign-in is switched off in this build.',
      invalidCredentials: 'That email and password do not match an account.',
      emailNotConfirmed: 'Confirm your email address first — there is a link in your inbox.',
      emailTaken: 'An account already uses that email address.',
      weakPassword: 'Choose a longer password.',
      invalidEmail: 'That email address is not valid.',
      rateLimited: 'Too many attempts. Wait a minute and try again.',
      offline: 'No connection right now. Check your network and try again.',
      unknown: 'Something went wrong. Please try again.',
    },
  },

  chat: {
    title: 'Messages',
    loading: 'Loading your conversations…',
    emptyTitle: 'No conversations yet',
    emptyBody: 'Open any product and tap “Chat with seller”. Your threads show up here.',
    noMessagesYet: 'No messages yet — say something to start.',
    openThread: 'Chat with seller',
    threadCount: (count: number) => `${count} ${conversationWord(count)}`,
    you: 'You',
    seller: 'Seller',
    inputPlaceholder: 'Write a message…',
    send: 'Send',
    sendA11y: 'Send message',
    emptyDraft: 'Type a message first.',
    failedToLoad: 'Your messages could not be loaded. Pull down to try again.',
    failedToSend: 'Message not sent. Check your connection and try again.',
    signInTitle: 'Sign in to start chatting',
    signInBody: 'Threads belong to your KOO account so the seller can reply to you.',
    unavailableTitle: 'Messaging needs a database',
    unavailableBody:
      'This build has no Supabase details, so messages cannot be sent or received.',
    refresh: 'Refresh',
  },

  account: {
    title: 'Account',
    signedOutTitle: 'Not signed in yet',
    signedOutHint: 'Sign in to chat with sellers',
    signInTitle: 'Sign in to KOO',
    signInBody:
      'An account keeps your conversations with sellers and saves the name, phone and city used at checkout.',
    authUnavailable: 'This copy of KOO was built without Supabase details, so signing in is unavailable.',
    editProfile: 'Edit profile',
    profileMissingTables:
      'Your profile has nowhere to be saved yet — the koo_profiles table has not been created in this database.',
    profileOffline: 'You look offline, so your profile could not be loaded.',
    profileFailed: 'Your profile could not be loaded. Your name below comes from your email address.',
    stat: {
      orders: 'Orders',
      inCart: 'In cart',
      messages: 'Messages',
    },
    recentOrders: 'Recent orders',
    browseCatalog: 'Browse catalog',
    demoTag: 'Demo',
    ordersEmptyTitle: 'No orders yet',
    ordersEmptyBody: 'Anything you place from this app is saved on your device and shows up here.',
    trackOrder: 'Track order',
    orderMeta: (date: string, items: number) => `${date} · ${items} ${itemWord(items)}`,
    preferences: 'Preferences',
    memberSince: (date: string) => `Member since ${date}`,
    addressMissing: 'No city saved yet',
    signInToSave: 'Sign in to save your own address',
    paymentMethodsTitle: 'Payment methods',
    paymentSubtitle: 'Wallet, card or pay on delivery — chosen at checkout',
    notificationsTitle: 'Notifications',
    privacyTitle: 'Privacy and security',
    helpCentre: 'Help centre',
    languageTitle: 'Language',
    languageDevice: 'Device default',
  },

  /**
   * The account form writes `public.koo_profiles` through Supabase. Length limits
   * mirror the schema's `char_length` checks, so the screen refuses what the
   * database would refuse.
   */
  profile: {
    title: 'Your profile',
    subtitle: 'Sellers see this; checkout uses it',
    loading: 'Loading your profile…',
    emailLabel: 'Email',
    emailNote: 'Your email is your sign-in and cannot be changed here.',
    nameLabel: 'Display name',
    namePlaceholder: 'e.g. Thiri Aung',
    phoneLabel: 'Phone',
    phonePlaceholder: 'e.g. +95 9 123 4567',
    cityLabel: 'City',
    cityPlaceholder: 'e.g. Yangon',
    save: 'Save profile',
    savedAt: (date: string) => `Last saved ${date}`,
    saved: 'Saved',
    notSignedInTitle: 'Sign in to edit your profile',
    notSignedInBody: 'A profile belongs to a KOO account, so there is nothing to change until you sign in.',
    missingTables:
      'This database has no koo_profiles table yet, so the profile cannot be saved. Run supabase/koo-profile-schema.sql in the SQL editor.',
    offline: 'You look offline — reconnect and try saving again.',
    forbidden: 'The database refused to save this profile. Check its row-level security policies.',
    failed: 'The profile could not be saved. Try again in a moment.',
    retry: 'Try again',
    noRowYet: 'Nothing is saved for this account yet — the first save creates your profile row.',
    validation: {
      nameRequired: 'Enter a display name.',
      tooLong: (max: number) => `Use ${max} characters or fewer.`,
    },
  },

  settings: {
    title: 'Settings',
    subtitle: 'Language and preferences',
    languageSection: 'Language',
    languageDescription: 'Choose the language used across KOO. Your choice is saved on this device.',
    followDevice: 'Follow device language',
    followingDevice: (language: string) => `Following your device (${language})`,
    manualChoice: (language: string) => `Manual choice: ${language}`,
    yourPreferences: 'Your preferences',
    note: 'Your cart, order history and sign-in stay exactly as they are — only the language changes.',
  },

  notFound: {
    title: 'This page is not in the catalog',
    body: 'The link you followed does not match a KOO screen. Head back to the storefront.',
    goHome: 'Go to Home',
  },

  bits: {
    searchPlaceholder: 'Search products, brands and sellers',
    searchA11y: 'Search',
    clearSearchA11y: 'Clear search',
    freeShippingTag: 'Free shipping',
    addToCartA11y: (name: string) => `Add ${name} to cart`,
    decreaseQtyA11y: 'Decrease quantity',
    increaseQtyA11y: 'Increase quantity',
  },

  /** App-chrome labels for the catalog taxonomy (the ids stay technical). */
  catalog: {
    all: 'All',
    category: {
      audio: 'Audio',
      apparel: 'Apparel',
      accessories: 'Accessories',
      home: 'Home',
      tech: 'Tech',
      fitness: 'Fitness',
    },
    sort: {
      relevance: 'Popular',
      priceAsc: 'Price: low to high',
      priceDesc: 'Price: high to low',
      rating: 'Top rated',
      newest: 'Newest',
    },
    status: {
      delivered: 'Delivered',
      inTransit: 'In transit',
      preparing: 'Preparing',
    },
    optionLabel: (raw: string) => optionLabels[raw] ?? raw,
  },
};

export type Dictionary = typeof en;

/** The date-formatting slice of a dictionary, for helpers in `src/lib`. */
export type DateCopy = Dictionary['dates'];
