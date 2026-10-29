import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/Filters';
import { QtyStepper } from '@/components/QtyStepper';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/i18n';
import { formatPrice } from '@/lib/format';
import { colors, currency, radius, spacing, typography } from '@/theme';

export default function CartScreen() {
  const { items, totals, remove, setQty, clear, hydrated } = useCart();
  const { t } = useI18n();
  const sellerCount = new Set(items.map((item) => item.product.seller)).size;

  if (!hydrated) {
    return (
      <Screen scroll={false}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t.cart.loading}</Text>
        </View>
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title={t.cart.title} />
        <EmptyState
          action={<Button label={t.cart.startShopping} onPress={() => router.push('/search')} style={styles.emptyButton} />}
          body={t.cart.emptyBody}
          icon="cart-outline"
          title={t.cart.emptyTitle}
        />
      </Screen>
    );
  }

  const progress = Math.min(1, totals.subtotalCents / currency.freeShippingThresholdCents);

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>{t.summary.total}</Text>
            <Text style={styles.footerTotal}>{formatPrice(totals.totalCents)}</Text>
          </View>
          <Button
            label={t.cart.checkoutCta(totals.itemCount)}
            onPress={() => router.push('/checkout')}
            testID="checkout-button"
          />
        </View>
      }>
      <ScreenHeader
        right={
          <Link href="/search" asChild>
            <Text style={styles.addMore}>{t.cart.addMore}</Text>
          </Link>
        }
        subtitle={t.cart.subtitle(totals.itemCount, sellerCount)}
        title={t.cart.title}
      />

      {!totals.freeShipping ? (
        <View style={styles.shippingCard}>
          <View style={styles.shippingHead}>
            <Ionicons color={colors.brandDark} name="car-outline" size={16} />
            <Text style={styles.shippingText}>
              {t.cart.freeShippingProgress(formatPrice(totals.amountToFreeShippingCents))}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        </View>
      ) : (
        <View style={[styles.shippingCard, styles.shippingCardDone]}>
          <Ionicons color={colors.success} name="checkmark-circle" size={16} />
          <Text style={[styles.shippingText, styles.shippingTextDone]}>{t.cart.freeShippingUnlocked}</Text>
        </View>
      )}

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.key} style={styles.row}>
            <Link asChild href={{ params: { id: item.productId }, pathname: '/product/[id]' }}>
              <Pressable style={styles.thumbWrap}>
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  recyclingKey={item.key}
                  source={item.product.image}
                  style={styles.thumb}
                  transition={150}
                />
              </Pressable>
            </Link>

            <View style={styles.rowBody}>
              <Text style={styles.seller} numberOfLines={1}>
                {item.product.seller}
              </Text>
              <Text style={styles.name} numberOfLines={2}>
                {item.product.name}
              </Text>
              {item.optionValue ? (
                <Text style={styles.option}>
                  {`${item.product.option ? t.catalog.optionLabel(item.product.option.label) : t.common.option}: ${item.optionValue}`}
                </Text>
              ) : null}

              <View style={styles.rowActions}>
                <QtyStepper max={Math.min(item.product.stock, 10)} onChange={(qty) => setQty(item.key, qty)} qty={item.qty} size="sm" />
                <Text style={styles.lineTotal}>{formatPrice(item.lineTotalCents)}</Text>
              </View>
            </View>

            <Pressable
              accessibilityLabel={t.cart.removeA11y(item.product.name)}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => remove(item.key)}
              style={styles.remove}>
              <Ionicons color={colors.faint} name="trash-outline" size={20} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <SummaryLine label={t.summary.subtotal} value={formatPrice(totals.subtotalCents)} />
        <SummaryLine
          label={t.summary.delivery}
          value={totals.shippingCents === 0 ? t.common.free : formatPrice(totals.shippingCents)}
          valueTone={totals.shippingCents === 0 ? 'success' : 'default'}
        />
        <SummaryLine label={t.summary.tax((currency.taxRateBps / 100).toFixed(2))} value={formatPrice(totals.taxCents)} />
        <View style={styles.divider} />
        <SummaryLine bold label={t.summary.total} value={formatPrice(totals.totalCents)} />
      </View>

      <Pressable accessibilityRole="button" hitSlop={8} onPress={clear} style={styles.clearWrap}>
        <Text style={styles.clear}>{t.cart.clearCart}</Text>
      </Pressable>
    </Screen>
  );
}

function SummaryLine({
  label,
  value,
  bold,
  valueTone = 'default',
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueTone?: 'default' | 'success';
}) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryValueBold, valueTone === 'success' && styles.summarySuccess]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.caption },
  addMore: { ...typography.caption, color: colors.brandDark, fontWeight: '700', fontSize: 13 },
  emptyButton: { minWidth: 180 },
  shippingCard: { backgroundColor: '#FFF7ED', borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, marginTop: spacing.sm },
  shippingCardDone: { backgroundColor: '#DCFCE7', flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shippingHead: { gap: 6 },
  shippingText: { fontSize: 13, fontWeight: '600', color: '#9A3412' },
  shippingTextDone: { color: '#15803D' },
  progressTrack: { height: 6, borderRadius: radius.pill, backgroundColor: '#FFD8B0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.brand },
  list: { marginTop: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.md,
  },
  thumbWrap: { width: 76, height: 76, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#EEF1F6' },
  thumb: { width: '100%', height: '100%' },
  rowBody: { flex: 1, gap: 2 },
  seller: { ...typography.tiny, textTransform: 'uppercase', letterSpacing: 0.4 },
  name: { ...typography.bodyStrong, fontSize: 14, lineHeight: 19 },
  option: { ...typography.caption },
  rowActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  lineTotal: { fontSize: 15, fontWeight: '800', color: colors.ink },
  remove: { alignSelf: 'flex-start', padding: spacing.xs },
  summary: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...typography.body },
  summaryLabelBold: { ...typography.bodyStrong },
  summaryValue: { ...typography.body, fontVariant: ['tabular-nums'] },
  summaryValueBold: { fontSize: 17, fontWeight: '800', color: colors.ink },
  summarySuccess: { color: colors.success, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.xs },
  clearWrap: { alignSelf: 'center', padding: spacing.md, marginTop: spacing.md },
  clear: { ...typography.caption, color: colors.danger, fontWeight: '700' },
  footer: { gap: spacing.md },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { ...typography.bodyStrong },
  footerTotal: { fontSize: 20, fontWeight: '900', color: colors.ink },
});
