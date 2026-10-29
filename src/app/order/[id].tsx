import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen, ScreenHeader } from '@/components/Screen';
import { getProduct } from '@/data/catalog';
import { localizeStatus, useI18n } from '@/i18n';
import { formatDate, formatPrice } from '@/lib/format';
import { getOrder, orderHeadline, type PlacedOrder } from '@/lib/orders';
import { colors, radius, spacing, typography } from '@/theme';

/** Which steps are already done is order state; the wording comes from the dictionary. */
const steps = [
  { key: 'placed', done: true },
  { key: 'packing', done: true },
  { key: 'outForDelivery', done: false },
  { key: 'delivered', done: false },
] as const;

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const [order, setOrder] = useState<PlacedOrder | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getOrder(id).then((found) => {
      if (!cancelled) setOrder(found ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (id && order === undefined) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>{t.order.loading}</Text>
        </View>
      </Screen>
    );
  }

  if (!id || !order) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title={t.order.title} />
        <View style={styles.center}>
          <Ionicons color={colors.muted} name="file-tray-outline" size={40} />
          <Text style={styles.missingTitle}>{t.order.notFound}</Text>
          <Button label={t.order.backToShopping} onPress={() => router.replace('/')} variant="secondary" style={styles.wideButton} />
        </View>
      </Screen>
    );
  }

  const doneSteps = steps.filter((step) => step.done).length;

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button label={t.order.continueShopping} onPress={() => router.replace('/')} />
          <Button label={t.order.viewAccount} onPress={() => router.replace('/account')} variant="secondary" />
        </View>
      }>
      <ScreenHeader
        back
        subtitle={t.order.placed(formatDate(order.placedAt, t.dates))}
        title={t.order.confirmed}
      />

      <View style={styles.hero}>
        <View style={styles.checkWrap}>
          <Ionicons color={colors.white} name="checkmark" size={30} />
        </View>
        <Text style={styles.heroHeadline}>{orderHeadline(order, t)}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.orderId}>{order.id}</Text>
          <View style={styles.etaPill}>
            <Ionicons color={colors.ink} name="calendar-outline" size={13} />
            <Text style={styles.etaText}>{t.order.arrives(order.etaLabel)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.order.deliveryStatus}</Text>
        {steps.map((step, index) => {
          const copy = t.order.timeline[step.key];
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]} />
                {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{copy.label}</Text>
                <Text style={styles.stepDetail}>{copy.detail}</Text>
              </View>
              {step.done ? <Ionicons color={colors.success} name="checkmark-circle" size={18} /> : null}
            </View>
          );
        })}
        <Text style={styles.stepSummary}>
          {t.order.stepsComplete(doneSteps, steps.length, localizeStatus(order.status, t))}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.order.items}</Text>
        {order.lines.map((line, index) => {
          const product = getProduct(line.productId);
          return (
            <View key={`${line.productId}-${index}`} style={styles.itemRow}>
              {product ? (
                <Image
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  recyclingKey={`order-${line.productId}-${index}`}
                  source={product.image}
                  style={styles.itemImage}
                  transition={120}
                />
              ) : (
                <View style={styles.itemImage} />
              )}
              <View style={styles.itemBody}>
                <Text numberOfLines={2} style={styles.itemName}>
                  {product?.name ?? line.name}
                </Text>
                <Text style={styles.itemMeta}>
                  {line.qty} × {formatPrice(line.unitPriceCents)}
                  {line.optionValue ? ` · ${line.optionValue}` : ''}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(line.unitPriceCents * line.qty)}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.order.payment}</Text>
        <Row
          label={order.paymentId ? t.checkout[order.paymentId] : order.paymentLabel}
          strong
          value={formatPrice(order.totalCents)}
        />
        <View style={styles.divider} />
        <Row label={t.summary.subtotal} value={formatPrice(order.subtotalCents)} />
        <Row
          label={t.summary.delivery}
          value={order.shippingCents === 0 ? t.common.free : formatPrice(order.shippingCents)}
        />
        <Row label={t.summary.taxPlain} value={formatPrice(order.taxCents)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.order.shippingTo}</Text>
        <Text style={styles.bodyText}>{order.address.fullName}</Text>
        <Text style={styles.bodyText}>
          {order.address.line1}, {order.address.city}
        </Text>
        <Text style={styles.bodyText}>{order.address.phone}</Text>
      </View>
    </Screen>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowLabelStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loadingText: { ...typography.caption },
  missingTitle: { ...typography.subtitle, textAlign: 'center' },
  wideButton: { minWidth: 200 },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  heroHeadline: { color: colors.white, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  orderId: { color: '#94A3B8', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  etaText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: { ...typography.subtitle, fontSize: 15, marginBottom: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepLeft: { width: 14, alignItems: 'center', paddingTop: 6 },
  stepDot: { width: 10, height: 10, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface },
  stepDotDone: { borderColor: colors.success, backgroundColor: colors.success },
  stepLine: { width: StyleSheet.hairlineWidth, flex: 1, minHeight: 26, backgroundColor: colors.line, marginVertical: 2 },
  stepBody: { flex: 1, paddingBottom: spacing.md },
  stepLabel: { ...typography.bodyStrong, fontSize: 13.5 },
  stepLabelDone: { color: colors.ink },
  stepDetail: { ...typography.caption, marginTop: 1 },
  stepSummary: { ...typography.caption, marginTop: spacing.xs },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  itemImage: { width: 46, height: 46, borderRadius: radius.sm, backgroundColor: '#EEF1F6' },
  itemBody: { flex: 1 },
  itemName: { ...typography.bodyStrong, fontSize: 13.5, lineHeight: 18 },
  itemMeta: { ...typography.caption, marginTop: 1 },
  itemTotal: { fontSize: 14, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { ...typography.body },
  rowLabelStrong: { ...typography.bodyStrong },
  rowValue: { ...typography.body, fontVariant: ['tabular-nums'] },
  rowValueStrong: { fontSize: 16, fontWeight: '900', color: colors.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.xs },
  bodyText: { ...typography.body, lineHeight: 20 },
  footer: { gap: spacing.sm },
});
