import type { Dictionary } from './en';

/**
 * Myanmar (မြန်မာ) dictionary.
 *
 * Typed as `Dictionary`, so TypeScript rejects any missing key or mismatched
 * function signature — the app can never silently ship half-translated.
 *
 * Notes on the Burmese copy:
 * - Counts use Arabic digits (2 ရက်, 14 ခု) because prices, order ids and the
 *   tab badge all render Arabic digits too; mixing Myanmar numerals in prose
 *   would look inconsistent next to `$1,234.56`.
 * - Myanmar has no plural inflection, so `plural.*` returns the measure word
 *   (ခု / ဆိုင် / ရလဒ် / ကြောင်း) for every count.
 * - Brand and payment names (KOO, KOO Wallet, Visa) stay untranslated.
 * - Numbers, `$` amounts and product/seller names come from the catalog and are
 *   left as merchant content.
 */

const optionLabels: Record<string, string> = {
  Colour: 'အရောင်',
  'Tip size': 'ခေါင်းပုံ',
  Size: 'အရွယ်အစား',
  Strap: 'ကြိုး',
  Switch: 'ခလုတ်',
};

export const my: Dictionary = {
  langLabel: {
    en: 'English',
    my: 'မြန်မာ',
  },

  common: {
    free: 'အခမဲ့',
    goBack: 'နောက်သို့ ပြန်သွားရန်',
    option: 'ရွေးချယ်စရာ',
    bullet: ' · ',
    edit: 'ပြင်ရန်',
  },

  plural: {
    item: () => 'ခု',
    seller: () => 'ဆိုင်',
    result: () => 'ရလဒ်',
    line: () => 'ကြောင်း',
    conversation: () => 'စကားပြောခန်း',
  },

  dates: {
    months: ['ဇန်', 'ဖေ', 'မတ်', 'ဧ', 'မေ', 'ဇွန်', 'ဇူ', 'ဩ', 'စက်', 'အောက်', 'နို', 'ဒီ'],
    formatDate: (day, month, year) => `${day} ${month} ${year}`,
    dateRange: (from, to) => `${from} – ${to}`,
  },

  tabs: {
    home: 'ပင်မ',
    search: 'ရှာဖွေ',
    cart: 'ဈေးတောင်း',
    account: 'အကောင့်',
  },

  home: {
    brand: 'KOO',
    locationCity: 'အိုင်ကိုင်း၊ လာဂိုစ်',
    deliveryEta: '2 ရက်အတွင်း ပို့ဆောင်မည်',
    notifications: 'အသိပေးချက်များ',
    alertsBanner: 'အားလုံး ဖတ်ရှုပြီးပါပြီ — ဖတ်ရန်ကျန်နေသော အသိပေးချက်များ မရှိပါ။',
    cartA11y: (count) => `ဈေးတောင်း၊ ပစ္စည်း ${count} ခု`,
    dealOfTheDay: 'ယနေ့အထူးလျှော့ဈေး',
    viewDeal: 'အထူးလျှော့ဈေးကို ကြည့်ရန်',
    trendingNow: 'လက်ရှိ ရေပန်းအများဆုံး',
    recommendedForYou: 'သင့်အတွက် အကြံပြုထားသည်များ',
    seeAll: 'အားလုံး ကြည့်ရန်',
    popularSellers: 'ရေပန်းအများဆုံး ဆိုင်များ',
    sellerTag: {
      audio: 'အသံပစ္စည်း',
      outdoor: 'ပြင်ပသုံးပစ္စည်း',
      home: 'အိမ်သုံး',
      tech: 'နည်းပညာ',
      living: 'နေထိုင်မှု',
    },
  },

  search: {
    title: 'ရှာဖွေရန်',
    placeholder: (productCount) => `ပစ္စည်း ${productCount} မျိုးကို ရှာဖွေပါ`,
    nothingFound: 'ဘာမှ မတွေ့ရပါ',
    emptyBody:
      'ဤသတ်မှတ်ချက်များနှင့် ကိုက်ညီသော ပစ္စည်း မရှိပါ။ ဈေးနှုန်းပိုကျယ်အောင် သို့မဟုတ် အခြားအမျိုးအစားတစ်ခုဖြင့် ပြန်ရှာကြည့်ပါ။',
    resetFilters: 'စစ်ထုတ်မှုများ ပြန်သတ်မှတ်ရန်',
    price: {
      any: 'ဈေးနှုန်း အားလုံး',
      under50: '$50 အောက်',
      under100: '$100 အောက်',
      under200: '$200 အောက်',
    },
  },

  cart: {
    title: 'ဈေးတောင်း',
    loading: 'သင့်ဈေးတောင်းကို ဖွင့်နေပါသည်…',
    emptyTitle: 'သင့်ဈေးတောင်းထဲ ဘာမှ မရှိသေးပါ',
    emptyBody:
      'ပစ္စည်းစာရင်းမှ ရွေးချယ်ထည့်ဝင်ပါ။ သင့်ဈေးတောင်းကို ဤစက်ထဲတွင် သိမ်းဆည်းထားပေးပါမည်။',
    startShopping: 'ဈေးဝယ်မှု စတင်ရန်',
    addMore: 'ပိုထည့်ရန်',
    checkoutCta: (count) => `ငွေရှင်းရန် (${count} ခု)`,
    subtitle: (items, sellers) => `ဆိုင် ${sellers} ဆိုင်မှ ပစ္စည်း ${items} ခု`,
    freeShippingProgress: (amount) => `${amount} ထပ်ထည့်ပါက အခမဲ့ ပို့ဆောင်ပေးမည်`,
    freeShippingUnlocked: 'အခမဲ့ပို့ဆောင်မှု ရရှိပြီးဖြစ်သည်',
    clearCart: 'ဈေးတောင်းကို ရှင်းလင်းရန်',
    removeA11y: (name) => `${name} ကို ဈေးတောင်းမှ ဖယ်ရှားရန်`,
  },

  summary: {
    subtotal: 'ပစ္စည်းဈေး စုစုပေါင်း',
    delivery: 'ပို့ဆောင်ခ',
    tax: (rate) => `အခွန် (${rate}%)`,
    taxPlain: 'အခွန်',
    total: 'စုစုပေါင်း',
    promoDiscount: 'လျှော့ဈေး',
    totalDue: 'ပေးချေရမည့် ပမာဏ',
  },

  product: {
    screenTitle: 'ပစ္စည်း',
    notListed: 'ဤပစ္စည်းကို စာရင်းမှ ဖယ်ရှားပြီးဖြစ်သည်။',
    backToCatalog: 'ပစ္စည်းစာရင်းသို့ ပြန်သွားရန်',
    soldOut: 'ပစ္စည်းကုန်သွားပါပြီ',
    added: 'ထည့်ပြီးပါပြီ',
    addToCart: 'ဈေးတောင်းထဲ ထည့်ရန်',
    chatWithSeller: 'ဆိုင်နှင့် စကားပြောရန်',
    openCartA11y: 'ဈေးတောင်းကို ဖွင့်ရန်',
    freeDeliveryIncluded: 'အခမဲ့ပို့ဆောင်မှု ပါဝင်သည်',
    saveA11y: 'ဤပစ္စည်းကို သိမ်းဆည်းရန်',
    unsaveA11y: 'သိမ်းဆည်းထားသည်များမှ ဖယ်ရှားရန်',
    discountToday: (percent) => `ယနေ့ ${percent}% လျှော့`,
    inCartBadge: (count) => `ဈေးတောင်းထဲ ${count} ခု`,
    lowStock: (count) => `ဤဆိုင်တွင် ${count} ခုသာ ကျန်ပါသေးသည်`,
    quantity: 'အရေအတွက်',
    maxPerOrder: (count) => `တစ်အော်ဒါလျှင် အများဆုံး ${count} ခု`,
    description: 'ပစ္စည်းအကြောင်း',
    whatIsIncluded: 'ပါဝင်သည့် အရာများ',
    freeDeliveryTitle: '2 ရက်အတွင်း အခမဲ့ပို့ဆောင်',
    standardDeliveryTitle: 'ပုံမှန်ပို့ဆောင်မှု · $6.99',
    shippedBy: (seller) =>
      `${seller} မှ ပို့ဆောင်သည် · အိုင်ကိုင်းထပ်မှ 24 နာရီအတွင်း ထုတ်ပို့ပါမည်`,
    returnsTitle: '14 ရက်အတွင်း ပြန်ပို့နိုင်',
    returnsNote:
      'မသုံးစွဲရသေးသော ပစ္စည်းများကို မူလထုပ်ပိုးမှုအတိုင်း ပြန်ပို့၍ KOO Wallet သို့ ငွေပြန်ရယူနိုင်သည်',
    categoryLine: (label) => `အမျိုးအစား- ${label}`,
    youMayAlsoLike: 'သင် ပိုကြိုက်နိုင်သော ပစ္စည်းများ',
    qtyPrefix: (count) => `${count} × `,
  },

  checkout: {
    title: 'ငွေရှင်းရန်',
    subtitle: (lines) => `ကြောင်း ${lines} ကြောင်း · လုံခြုံသော KOO pay`,
    deliveryAddress: 'ပို့ဆောင်ရမည့် လိပ်စာ',
    addressFromProfile: 'အမည်၊ မြို့နှင့် ဖုန်းတို့သည် သင့်ပရိုဖိုင်မှ လာပါသည်။',
    addressIncomplete: 'ဆိုင်မှ သင့်ထံ ဆက်သွယ်နိုင်ရန် သင့်ပရိုဖိုင်တွင် မြို့နှင့် ဖုန်းကို ထည့်သွင်းပါ။',
    deliveryMethod: 'ပို့ဆောင်နည်း',
    payment: 'ငွေပေးချေမှု',
    orderSummary: 'အော်ဒါ အကျဉ်းချုပ်',
    standard: 'ပုံမှန်',
    standardDetail: '2–4 ရက်',
    express: 'အမြန်',
    expressDetail: 'နောက်တစ်နေ့ ရောက်မည်',
    included: 'ပါဝင်သည်',
    extraCost: (amount) => `+${amount}`,
    wallet: 'KOO Wallet',
    walletDetail: 'လက်ကျန်ငွေ $482.10',
    card: 'Visa •••• 4412',
    cardDetail: 'သက်တမ်း 04/29',
    cod: 'ပို့ဆောင်ချိန် ငွေပေးချေမည်',
    codDetail: 'ပို့ဆောင်သူလက်တွင် ငွေသား သို့မဟုတ် ကတ်ဖြင့် ပေးချေနိုင်သည်',
    promoCode: 'ပရိုမိုးရှင်း ကုဒ်',
    apply: 'အသုံးပြုရန်',
    applied: 'အသုံးပြုပြီး',
    promoInvalid: (code, validCode) =>
      `“${code}” သည် မှားယွင်းသော ကုဒ်ဖြစ်သည်။ ${validCode} ကို စမ်းကြည့်ပါ။`,
    promoApplied: (code) => `${code} အသုံးပြုပြီး — ပစ္စည်းဈေး၏ 10% လျှော့ပေးမည်။`,
    placeOrder: (amount) => `အော်ဒါ မှာယူရန် · ${amount}`,
    assurance:
      'သင့်အော်ဒါ ပို့ဆောင်ပြီးသည်အထိ ငွေကို KOO က သိမ်းဆည်းထားပေးပါမည်။ 14 ရက်အတွင်း ပြန်ပို့ခြင်းသည် အခမဲ့ဖြစ်သည်။',
  },

  order: {
    loading: 'အော်ဒါကို ဖွင့်နေပါသည်…',
    title: 'အော်ဒါ',
    notFound: 'ဤစက်ထဲတွင် ထိုအော်ဒါကို မတွေ့ရပါ။',
    backToShopping: 'ပစ္စည်းစာရင်းသို့ ပြန်သွားရန်',
    continueShopping: 'ဈေးဆက်ဝယ်ရန်',
    viewAccount: 'အကောင့်ကို ကြည့်ရန်',
    confirmed: 'အော်ဒါ အတည်ဖြစ်ပါပြီ',
    placed: (date) => `မှာယူခဲ့သည်- ${date}`,
    arrives: (eta) => `${eta} ရောက်မည်`,
    deliveryStatus: 'ပို့ဆောင်ရေး အခြေအနေ',
    stepsComplete: (done, total, status) =>
      `ခြေလှမ်း ${total} ခုအနက် ${done} ခု ပြီးဆုံး · ${status}`,
    items: 'ပစ္စည်းများ',
    payment: 'ငွေပေးချေမှု',
    shippingTo: 'ပို့ဆောင်မည့် လိပ်စာ',
    emptyOrder: 'အော်ဒါ အလွတ်',
    headline: (name, extra) => `${name} နှင့် အခြား ${extra} မျိုး`,
    timeline: {
      placed: { label: 'အော်ဒါ မှာယူပြီး', detail: 'ငွေပေးချေမှု အတည်ဖြစ်ပြီ' },
      packing: { label: 'ဆိုင်မှ ထုပ်ပိုးနေသည်', detail: '12 နာရီအတွင်း ထုတ်ပို့မည်ဟု ခန့်မှန်း' },
      outForDelivery: { label: 'ပို့ရန် ထွက်ခွာပြီ', detail: 'အိုင်ကိုင်းထပ် → သင့်လိပ်စာ' },
      delivered: { label: 'ပို့ဆောင်ပြီး', detail: 'ညနေ 6 နာရီအတွင်း ရောက်မည်' },
    },
  },

  /**
   * အကောင့်ဖွင့်/ဝင်ရောက်ခြင်း (Supabase Auth)။ ဆာဗာမှ လာသော အမှား code များကို
   * `src/lib/supabase.ts` ရှိ key များဖြင့် ဤနေရာတွင် ဘာသာပြန်သည် — အင်္ဂလိပ် API စာသား
   * တိုက်ရိုက်မပြပါ။
   */
  auth: {
    loginTitle: 'KOO သို့ ဝင်ရောက်ပါ',
    loginSubtitle: 'ဆိုင်များနှင့် စကားပြောရန် အကောင့်ဝင်ပါ။ စကားပြောခန်းများကို အခြားစက်များတွင်လည်း ဆက်ဖတ်နိုင်ပါသည်။',
    registerTitle: 'အကောင့် အသစ်ဖွင့်ရန်',
    registerSubtitle: 'KOO အကောင့်တစ်ခုတည်းဖြင့် ဈေးဝယ်နိုင်သလို၊ ဆိုင်ရှင်အဖြစ်လည်း ဖြေကြားနိုင်ပါသည်။',
    emailLabel: 'အီးမေးလ်',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'စကားဝှက်',
    passwordPlaceholder: 'စာလုံး 6 လုံး အနည်းဆုံး',
    signInCta: 'အကောင့်ဝင်ရန်',
    signUpCta: 'အကောင့် ဖွင့်ရန်',
    haveAccount: 'အကောင့် ရှိပြီးသားလား?',
    needAccount: 'KOO တွင် ပထမဆုံးလား?',
    notNow: 'နောက်မှ',
    signOut: 'အကောင့်မှ ထွက်ရန်',
    sellerHint: (email) =>
      `ဆိုင်ဘက်ကို စမ်းသပ်လိုပါက ${email} ကဲ့သို့သော ဆိုင်အီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပါ။ ဈေးဝယ်သူ စာသားများကို ထိုအကောင့်တွင် တွေ့ရပါမည်။`,
    unavailableTitle: 'ဤ build တွင် အကောင့်ဝင်ခြင်း မသုံးနိုင်ပါ',
    unavailableBody:
      'KOO ကို Supabase အချက်အလက်မပါဘဲ တည်ဆောက်ထားသဖြင့် အကောင့်နှင့် စကားပြောခြင်းများ မသုံးနိုင်ပါ။ ကြည့်ရှုခြင်း၊ ဈေးတောင်းနှင့် ငွေရှင်းခြင်းတို့မှာ ပုံမှန်အတိုင်း အလုပ်လုပ်ပါသည်။',
    validation: {
      emailRequired: 'အီးမေးလ်လိပ်စာကို ရိုက်ထည့်ပါ။',
      passwordRequired: 'စကားဝှက်ကို ရိုက်ထည့်ပါ။',
      emailInvalid: 'အီးမေးလ်လိပ်စာ အမှန်မဟုတ်ပါ။',
      passwordShort: (count) => `အနည်းဆုံး ${count} စာလုံး သုံးပါ။`,
    },
    errors: {
      notConfigured: 'ဤ build တွင် အကောင့်ဝင်ခြင်း ပိတ်ထားပါသည်။',
      invalidCredentials: 'အီးမေးလ်နှင့် စကားဝှက်သည် အကောင့်တစ်ခုနှင့် မကိုက်ညီပါ။',
      emailNotConfirmed: 'အီးမေးလ်ကို အတည်ပြုပြီးမှ ဝင်ရောက်ပါ — inbox တွင် link ပါဝင်ပါသည်။',
      emailTaken: 'ထိုအီးမေးလ်ကို သုံးထားသော အကောင့်ရှိပြီးဖြစ်သည်။',
      weakPassword: 'စကားဝှက် ပိုရှည်အောင် ရွေးချယ်ပါ။',
      invalidEmail: 'ထိုအီးမေးလ်လိပ်စာ မှားယွင်းနေပါသည်။',
      rateLimited: 'ကြိုးစားမှု အလွန်များနေပါသည်။ 1 မိနစ်စောင့်ပြီး ပြန်ကြိုးစားပါ။',
      offline: 'ချိတ်ဆက်မှု မရှိပါ။ ကွန်ရက်ကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။',
      unknown: 'တစ်ခုခု မှားယွင်းသွားပါသည်။ ပြန်ကြိုးစားပါ။',
    },
  },

  chat: {
    title: 'စကားပြောခန်းများ',
    loading: 'သင့်စကားပြောခန်းများကို ဖွင့်နေပါသည်…',
    emptyTitle: 'စကားပြောခန်း မရှိသေးပါ',
    emptyBody: 'ပစ္စည်းတစ်ခုကို ဖွင့်ပြီး “ဆိုင်နှင့် စကားပြောရန်” ကို နှိပ်ပါ။ စကားပြောခန်းများ ဤနေရာတွင် ပေါ်လာမည်။',
    noMessagesYet: 'စာသား မရှိသေးပါ — စတင်ရန် ရေးသားပါ။',
    openThread: 'ဆိုင်နှင့် စကားပြောရန်',
    threadCount: (count) => `စကားပြောခန်း ${count} ခု`,
    you: 'သင်',
    seller: 'ဆိုင်',
    inputPlaceholder: 'စာသား ရေးပါ…',
    send: 'ပို့ရန်',
    sendA11y: 'စာသား ပို့ရန်',
    emptyDraft: 'စာသား ရိုက်ထည့်ပါ။',
    failedToLoad: 'စာသားများကို မဖွင့်နိုင်ပါ။ ပြန်ကြိုးစားရန် အောက်သို့ ဆွဲပါ။',
    failedToSend: 'စာသား မပို့ရပါ။ ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ပြန်ကြိုးစားပါ။',
    signInTitle: 'စကားပြောရန် အကောင့်ဝင်ပါ',
    signInBody: 'စကားပြောခန်းများသည် သင့် KOO အကောင့်နှင့် ချိတ်ဆက်ထားပြီး၊ ဆိုင်မှ သင့်ထံ ပြန်ဖြေနိုင်ရန်ဖြစ်သည်။',
    unavailableTitle: 'စကားပြောရန် ဒေတာဘေ့စ် လိုအပ်သည်',
    unavailableBody: 'ဤ build တွင် Supabase အချက်အလက် မပါသဖြင့် စာသားများကို မပို့နိုင်၊ မလက်ခံနိုင်ပါ။',
    refresh: 'ပြန်လည်ဖွင့်ရန်',
  },

  account: {
    title: 'အကောင့်',
    signedOutTitle: 'အကောင့်မဝင်ရသေးပါ',
    signedOutHint: 'ဆိုင်များနှင့် စကားပြောရန် အကောင့်ဝင်ပါ',
    signInTitle: 'KOO သို့ အကောင့်ဝင်ပါ',
    signInBody:
      'အကောင့်ရှိလျှင် ဆိုင်များနှင့်၏ စကားပြောခန်းများ ဆက်လက်ရရှိပြီး၊ အော်ဒါမှာရာတွင် သုံးမည့် အမည်၊ ဖုန်းနှင့် မြို့တို့ကို သိမ်းဆည်းနိုင်ပါသည်။',
    authUnavailable: 'ဤ KOO ကူးသည် Supabase အချက်အလက် မပါဘဲ တည်ဆောက်ထားသဖြင့် အကောင့်ဝင်၍ မရပါ။',
    editProfile: 'ပရိုဖိုင် ပြင်ဆင်ရန်',
    profileMissingTables:
      'ဤဒေတာဘေ့စ်တွင် koo_profiles ဇယား မရှိသေးသဖြင့် သင့်ပရိုဖိုင်ကို သိမ်းဆည်း၍ မရပါ။',
    profileOffline: 'အင်တာနက် ချိတ်ဆက်မှု မရှိသည့်အတိုင်း သင့်ပရိုဖိုင်ကို ဖွင့်၍ မရပါ။',
    profileFailed: 'ပရိုဖိုင်ကို ဖွင့်၍ မရပါ။ အောက်ပါအမည်သည် သင့်အီးမေးလ်မှ ယူထားသည်။',
    stat: {
      orders: 'အော်ဒါများ',
      inCart: 'ဈေးတောင်းထဲ',
      messages: 'စကားပြောခန်း',
    },
    recentOrders: 'မကြာသေးမီ အော်ဒါများ',
    browseCatalog: 'ပစ္စည်းစာရင်း ကြည့်ရန်',
    demoTag: 'နမူနာ',
    ordersEmptyTitle: 'အော်ဒါ မရှိသေးပါ',
    ordersEmptyBody: 'ဤအပ်တွင် မှာလိုက်သော အော်ဒါများကို ဤစက်ထဲ သိမ်းဆည်းပြီး ဤနေရာတွင် ပြသပါမည်။',
    trackOrder: 'အော်ဒါကို နောက်ယောင်ခံ ကြည့်ရန်',
    orderMeta: (date, items) => `${date} · ပစ္စည်း ${items} ခု`,
    preferences: 'ဦးစားပေးမှုများ',
    memberSince: (date) => `${date} တွင် အသင်းဝင်ခဲ့သည်`,
    addressMissing: 'မြို့ မသိမ်းရသေးပါ',
    signInToSave: 'လိပ်စာ သိမ်းရန် အကောင့်ဝင်ပါ',
    paymentMethodsTitle: 'ငွေပေးချေနည်းလမ်းများ',
    paymentSubtitle: 'ပိုက်ဆံအိတ်၊ ကတ် သို့မဟုတ် ပစ္စည်းရရှိချိန် ငွေပေးချေနည်းကို အော်ဒါမှာရာတွင် ရွေးပါသည်',
    notificationsTitle: 'အသိပေးချက်များ',
    privacyTitle: 'ပုဂ္ဂလိကနှင့် လုံခြုံရေး',
    helpCentre: 'အကူအညီ စင်တာ',
    languageTitle: 'ဘာသာစကား',
    languageDevice: 'စက်၏ ဘာသာစကား',
  },

  profile: {
    title: 'သင့်ပရိုဖိုင်',
    subtitle: 'ဆိုင်များမြင်ရပြီး အော်ဒါမှာရာတွင် သုံးသည်',
    loading: 'သင့်ပရိုဖိုင်ကို ဖွင့်နေပါသည်…',
    emailLabel: 'အီးမေးလ်',
    emailNote: 'အီးမေးလ်သည် အကောင့်ဝင်ရာတွင် သုံးသဖြင့် ဤနေရာ၌ မပြောင်းနိုင်ပါ။',
    nameLabel: 'ပြသအမည်',
    namePlaceholder: 'ဥပမာ သီရိအောင်',
    phoneLabel: 'ဖုန်း',
    phonePlaceholder: 'ဥပမာ +95 9 123 4567',
    cityLabel: 'မြို့',
    cityPlaceholder: 'ဥပမာ ရန်ကုန်',
    save: 'ပရိုဖိုင် သိမ်းရန်',
    savedAt: (date) => `နောက်ဆုံးသိမ်းသည် - ${date}`,
    saved: 'သိမ်းပြီးပါပြီ',
    notSignedInTitle: 'ပရိုဖိုင် ပြင်ရန် အကောင့်ဝင်ပါ',
    notSignedInBody: 'ပရိုဖိုင်သည် KOO အကောင့်တစ်ခုနှင့် ချိတ်ဆက်ထားသဖြင့် ဝင်ရောက်မှသာ ပြင်ဆင်နိုင်ပါသည်။',
    missingTables:
      'ဤဒေတာဘေ့စ်တွင် koo_profiles ဇယား မရှိသေးပါ။ SQL တည်းဖြတ်ရေးထဲ supabase/koo-profile-schema.sql ကို ကူးထည့်ပါ။',
    offline: 'အင်တာနက် ချိတ်ဆက်မှု မရှိပါ — ပြန်ချိတ်ပြီးမှ ပြန်လည်သိမ်းဆည်းပါ။',
    forbidden: 'ဒေတာဘေ့စ်က ဤပရိုဖိုင်ကို သိမ်းခွင့် မပြုပါ။ row-level security စည်းမျဉ်းများကို စစ်ဆေးပါ။',
    failed: 'ပရိုဖိုင်ကို မသိမ်းနိုင်ပါ — ခဏစောင့်ပြီး ပြန်ကြိုးစားပါ။',
    retry: 'ပြန်ကြိုးစားရန်',
    noRowYet: 'ဤအကောင့်အတွက် ယခုအထိ မသိမ်းရသေးပါ — ပထမဆုံး သိမ်းလိုက်သည့်အခါ ပရိုဖိုင်ကြောင်း ဖန်တီးပါမည်။',
    validation: {
      nameRequired: 'ပြသအမည်ကို ရေးသားပါ။',
      tooLong: (max) => `${max} လုံးအောက်သာ သုံးပါ။`,
    },
  },

  settings: {
    title: 'ဆက်တင်များ',
    subtitle: 'ဘာသာစကားနှင့် ဦးစားပေးမှုများ',
    languageSection: 'ဘာသာစကား',
    languageDescription:
      'KOO တစ်ခုလုံးတွင် သုံးမည့် ဘာသာစကားကို ရွေးချယ်ပါ။ သင့်ရွေးချယ်မှုကို ဤစက်ထဲတွင် သိမ်းဆည်းပါမည်။',
    followDevice: 'စက်၏ ဘာသာစကားကို လိုက်နာရန်',
    followingDevice: (language) => `စက်၏ ဘာသာစကားကို လိုက်နာနေသည် (${language})`,
    manualChoice: (language) => `လက်ဖြင့် ရွေးချယ်ထားသည်- ${language}`,
    yourPreferences: 'သင့် ဦးစားပေးမှုများ',
    note: 'သင့်ဈေးတောင်း၊ အော်ဒါမှတ်တမ်းနှင့် အကောင့်ဝင်မှုတို့ မပြောင်းလဲပါ — ဘာသာစကားသာ ပြောင်းလဲပါသည်။',
  },

  notFound: {
    title: 'ဤစာမျက်နှာသည် ပစ္စည်းစာရင်းထဲ မရှိပါ',
    body: 'ဖွင့်လိုက်သော လင့်ခ်သည် KOO စာမျက်နှာနှင့် မကိုက်ညီပါ။ ပင်မစာမျက်နှာသို့ ပြန်သွားပါ။',
    goHome: 'ပင်မစာမျက်နှာသို့',
  },

  bits: {
    searchPlaceholder: 'ပစ္စည်းများ၊ အမှတ်တံဆိပ်များ၊ ဆိုင်များကို ရှာဖွေပါ',
    searchA11y: 'ရှာဖွေရန်',
    clearSearchA11y: 'ရှာဖွေမှုကို ရှင်းလင်းရန်',
    freeShippingTag: 'အခမဲ့ပို့ဆောင်',
    addToCartA11y: (name) => `${name} ကို ဈေးတောင်းထဲ ထည့်ရန်`,
    decreaseQtyA11y: 'အရေအတွက် လျှော့ရန်',
    increaseQtyA11y: 'အရေအတွက် တိုးရန်',
  },

  catalog: {
    all: 'အားလုံး',
    category: {
      audio: 'အသံပစ္စည်း',
      apparel: 'အဝတ်အစား',
      accessories: 'ဆက်စပ်ပစ္စည်း',
      home: 'အိမ်သုံးပစ္စည်း',
      tech: 'နည်းပညာ',
      fitness: 'ကျန်းမာရေး',
    },
    sort: {
      relevance: 'လူကြိုက်များ',
      priceAsc: 'ဈေးနှုန်း နည်းမှ များ',
      priceDesc: 'ဈေးနှုန်း များမှ နည်း',
      rating: 'အဆင့်သတ်မှတ်ချက် အကောင်းဆုံး',
      newest: 'အသစ်ဆုံး',
    },
    status: {
      delivered: 'ပို့ဆောင်ပြီး',
      inTransit: 'လမ်းပေါ်တွင်',
      preparing: 'ပြင်ဆင်နေသည်',
    },
    optionLabel: (raw) => optionLabels[raw] ?? raw,
  },
};
