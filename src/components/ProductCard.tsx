import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Rating, Tag } from '@/components/Bits';
import type { Product } from '@/data/catalog';
import { useT } from '@/i18n';
import { discountPercent, formatPrice } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  product: Product;
  variant?: 'grid' | 'row';
  onQuickAdd?: (product: Product) => void;
};

export function ProductCard({ product, variant = 'grid', onQuickAdd }: Props) {
  const t = useT();
  const discount = discountPercent(product.priceCents, product.compareAtCents);

  const media = (
    <View style={[styles.media, variant === 'row' ? styles.mediaRow : styles.mediaGrid]}>
      <Image
        cachePolicy="memory-disk"
        contentFit="cover"
        recyclingKey={product.id}
        source={product.image}
        style={StyleSheet.absoluteFill}
        transition={180}
      />
      {discount ? <View style={styles.discountPill}><Text style={styles.discountText}>-{discount}%</Text></View> : null}
      {onQuickAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.bits.addToCartA11y(product.name)}
          android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
          hitSlop={6}
          onPress={() => onQuickAdd(product)}
          style={styles.quickAdd}>
          <Ionicons color={colors.white} name="add" size={20} />
        </Pressable>
      ) : null}
    </View>
  );

  const details = (
    <View style={variant === 'row' ? styles.bodyRow : styles.bodyGrid}>
      <Text style={styles.seller} numberOfLines={1}>
        {product.seller}
      </Text>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.blurb} numberOfLines={1}>
        {product.blurb}
      </Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPrice(product.priceCents)}</Text>
        {product.compareAtCents ? <Text style={styles.compare}>{formatPrice(product.compareAtCents)}</Text> : null}
      </View>
      <View style={styles.metaRow}>
        <Rating compact value={product.rating} />
        {product.freeShipping ? <Tag icon="cube-outline" label={t.bits.freeShippingTag} tone="success" /> : null}
      </View>
    </View>
  );

  return (
    <Link
      asChild
      href={{ pathname: '/product/[id]', params: { id: product.id } }}
      push>
      <Pressable
        android_ripple={{ color: 'rgba(11,17,32,0.06)', borderless: true }}
        style={({ pressed }) => [styles.card, variant === 'row' && styles.cardRow, pressed && styles.pressed]}>
        {variant === 'row' ? (
          <View style={styles.rowLayout}>
            {media}
            {details}
          </View>
        ) : (
          <>
            {media}
            {details}
          </>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  cardRow: { flexDirection: 'row' },
  rowLayout: { flexDirection: 'row', alignItems: 'stretch' },
  pressed: { opacity: 0.9 },
  media: { backgroundColor: '#EEF1F6', overflow: 'hidden' },
  mediaGrid: { height: 150, width: '100%' },
  mediaRow: { width: 110, height: '100%', minHeight: 120 },
  bodyGrid: { padding: spacing.md, gap: 2 },
  bodyRow: { padding: spacing.md, flex: 1, gap: 2 },
  seller: { ...typography.tiny, textTransform: 'uppercase', letterSpacing: 0.4 },
  name: { ...typography.subtitle, fontSize: 15, lineHeight: 20 },
  blurb: { ...typography.caption, marginTop: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: spacing.xs },
  price: { fontSize: 16, fontWeight: '800', color: colors.ink },
  compare: { fontSize: 12, fontWeight: '500', color: colors.faint, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  discountPill: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(11,17,32,0.82)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  discountText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  quickAdd: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});
