import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Rating, Tag } from '@/components/Bits';
import { ChipRow, SectionHeader, SearchField, type ChipOption } from '@/components/Filters';
import { ProductCard } from '@/components/ProductCard';
import { Screen } from '@/components/Screen';
import { categories, products, type CategoryId, type Product } from '@/data/catalog';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useI18n, type Dictionary } from '@/i18n';
import { card, colors, radius, spacing, typography } from '@/theme';

const featured = products.find((product) => product.id === 'aurora-headphones') ?? products[0];

type SellerTagKey = keyof Dictionary['home']['sellerTag'];

const sellers: { name: string; tagKey: SellerTagKey; rating: string }[] = [
  { name: 'Soundlab Studio', tagKey: 'audio', rating: '4.9' },
  { name: 'Northbound Co.', tagKey: 'outdoor', rating: '4.7' },
  { name: 'Kiln & Co.', tagKey: 'home', rating: '4.8' },
  { name: 'Greygear Labs', tagKey: 'tech', rating: '4.6' },
  { name: 'Studio Goods', tagKey: 'living', rating: '4.5' },
];

function initialsOf(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function TrendingCard({ product }: { product: Product }) {
  return (
    <Link
      asChild
      href={{ params: { id: product.id }, pathname: '/product/[id]' }}
      push>
      <Pressable android_ripple={{ color: 'rgba(11,17,32,0.06)', borderless: true }} style={styles.trendingCard}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          recyclingKey={`trending-${product.id}`}
          source={product.image}
          style={styles.trendingImage}
          transition={200}
        />
        <Text style={styles.trendingName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.trendingMeta}>
          <Text style={styles.trendingPrice}>{formatPrice(product.priceCents)}</Text>
          <Rating compact value={product.rating} />
        </View>
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  const { add, totals } = useCart();
  const { t } = useI18n();
  const [alertsVisible, setAlertsVisible] = useState(false);

  const trending = useMemo(() => products.filter((product) => product.trending), []);
  const recommended = useMemo(() => {
    const rest = [...products].sort((a, b) => b.rating - a.rating);
    return rest.filter((product) => product.id !== featured.id);
  }, []);

  const recommendedRows = useMemo(() => {
    const rows: Product[][] = [];
    for (let index = 0; index < recommended.length; index += 2) rows.push(recommended.slice(index, index + 2));
    return rows;
  }, [recommended]);

  // Chip labels are app chrome, so they come from the dictionary while the
  // catalog keeps the ids and icons.
  const categoryOptions = useMemo<ChipOption<CategoryId | 'all'>[]>(
    () => [
      { id: 'all', icon: 'grid-outline', label: t.catalog.all },
      ...categories.map((category) => ({
        icon: category.icon,
        id: category.id,
        label: t.catalog.category[category.id],
      })),
    ],
    [t]
  );

  const openCategory = (id: CategoryId | 'all') => router.push({ params: { category: id }, pathname: '/search' });

  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={styles.brandWrap}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>K</Text>
          </View>
          <View>
            <Text style={styles.brand}>{t.home.brand}</Text>
            <View style={styles.locationRow}>
              <Ionicons color={colors.muted} name="location-outline" size={13} />
              <Text style={styles.location}>
                {t.home.locationCity}
                {t.common.bullet}
                {t.home.deliveryEta}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          accessibilityLabel={t.home.notifications}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setAlertsVisible((visible) => !visible)}
          style={styles.iconButton}>
          <View style={styles.iconInner}>
            <Ionicons color={colors.ink} name="notifications-outline" size={22} />
            <View style={styles.dot} />
          </View>
        </Pressable>
      </View>

      {alertsVisible ? (
        <View style={styles.alertsBanner}>
          <Ionicons color={colors.success} name="checkmark-circle" size={18} />
          <Text style={styles.alertsText}>{t.home.alertsBanner}</Text>
        </View>
      ) : null}

      <View style={styles.searchRow}>
        <SearchField onPress={() => router.push('/search')} value="" />
        <Link asChild href="/cart">
          <Pressable accessibilityLabel={t.home.cartA11y(totals.itemCount)} accessibilityRole="button" style={styles.cartButton}>
            <Ionicons color={colors.ink} name="cart-outline" size={22} />
            {totals.itemCount > 0 ? (
              <View style={styles.cartCount}>
                <Text style={styles.cartCountText}>{totals.itemCount > 9 ? '9+' : totals.itemCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </Link>
      </View>

      <ChipRow
        onSelect={openCategory}
        options={categoryOptions}
        selected="all"
        style={styles.chips}
      />

      <Link asChild href={{ params: { id: featured.id }, pathname: '/product/[id]' }}>
        <Pressable android_ripple={{ color: 'rgba(255,255,255,0.16)' }} style={styles.hero}>
          <View style={styles.heroBody}>
            <Tag label={t.home.dealOfTheDay} tone="brand" />
            <Text style={styles.heroTitle}>{featured.name}</Text>
            <Text style={styles.heroBlurb}>{featured.blurb}</Text>
            <View style={styles.heroPriceRow}>
              <Text style={styles.heroPrice}>{formatPrice(featured.priceCents)}</Text>
              {featured.compareAtCents ? (
                <Text style={styles.heroCompare}>{formatPrice(featured.compareAtCents)}</Text>
              ) : null}
            </View>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>{t.home.viewDeal}</Text>
              <Ionicons color={colors.white} name="arrow-forward" size={16} />
            </View>
          </View>
          <Image
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey="hero"
            source={featured.image}
            style={styles.heroImage}
            transition={250}
          />
        </Pressable>
      </Link>

      <SectionHeader title={t.home.trendingNow} />
      <ScrollView contentContainerStyle={styles.rail} horizontal showsHorizontalScrollIndicator={false}>
        {trending.map((product) => (
          <TrendingCard key={product.id} product={product} />
        ))}
      </ScrollView>

      <SectionHeader
        action={
          <Link href="/search" asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.seeAll}>{t.home.seeAll}</Text>
            </Pressable>
          </Link>
        }
        title={t.home.recommendedForYou}
      />
      {recommendedRows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.gridRow}>
          {row.map((product) => (
            <ProductCard
              key={product.id}
              onQuickAdd={(item) => add(item.id, { optionValue: item.option?.values[0] })}
              product={product}
            />
          ))}
        </View>
      ))}

      <SectionHeader title={t.home.popularSellers} />
      <ScrollView contentContainerStyle={styles.sellerRail} horizontal showsHorizontalScrollIndicator={false}>
        {sellers.map((seller) => (
          <View key={seller.name} style={styles.sellerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsOf(seller.name)}</Text>
            </View>
            <Text numberOfLines={1} style={styles.sellerName}>
              {seller.name}
            </Text>
            <Text numberOfLines={1} style={styles.sellerTagline}>
              {t.home.sellerTag[seller.tagKey]}
              {t.common.bullet}
              {seller.rating}
            </Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.brand, fontSize: 20, fontWeight: '900' },
  brand: { ...typography.title, fontSize: 18, letterSpacing: 0.6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { ...typography.tiny, color: colors.muted },
  iconButton: { padding: 4 },
  iconInner: { position: 'relative' },
  dot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#DCFCE7',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertsText: { fontSize: 13, fontWeight: '600', color: '#15803D', flex: 1 },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  chips: { marginTop: spacing.lg, marginBottom: spacing.sm },
  hero: {
    ...card,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.ink,
    padding: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  heroBody: { flex: 1, gap: 6 },
  heroImage: { width: 116, height: 116, borderRadius: radius.md, backgroundColor: '#EEF1F6' },
  heroTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: spacing.xs },
  heroBlurb: { color: '#CBD5E1', fontSize: 13, fontWeight: '500' },
  heroPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: 2 },
  heroPrice: { color: colors.white, fontSize: 22, fontWeight: '900' },
  heroCompare: { color: '#94A3B8', fontSize: 13, fontWeight: '500', textDecorationLine: 'line-through' },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  heroCtaText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  rail: { gap: spacing.md, paddingVertical: 2, paddingRight: spacing.lg },
  trendingCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
    padding: 0,
  },
  trendingImage: { width: '100%', height: 130, backgroundColor: '#EEF1F6' },
  trendingName: { ...typography.bodyStrong, fontSize: 13, marginTop: spacing.sm, paddingHorizontal: spacing.sm },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  trendingPrice: { fontSize: 14, fontWeight: '800', color: colors.ink },
  gridRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  seeAll: { ...typography.caption, color: colors.brandDark, fontWeight: '700' },
  sellerRail: { gap: spacing.md, paddingVertical: 2, paddingRight: spacing.lg },
  sellerCard: {
    width: 122,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.brandDark, fontSize: 15, fontWeight: '900' },
  sellerName: { ...typography.bodyStrong, fontSize: 13 },
  sellerTagline: { ...typography.tiny },
});
