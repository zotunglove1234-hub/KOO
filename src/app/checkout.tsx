import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useI18n } from '@/i18n';
import {
  addressFromProfile,
  buildOrder,
  defaultAddress,
  nextOrderId,
  persistOrder,
  type OrderLine,
} from '@/lib/orders';
import { displayNameFor } from '@/lib/profile';
import { formatPrice } from '@/lib/format';
import { colors, currency, radius, spacing, typography } from '@/theme';

const PROMO_CODE = 'KOO10';
const promoRateBps = 1000; // 10% off

/** `labelKey`/`detailKey` name the dictionary entry; the rows themselves are behaviour. */
const deliveryMethods = [
  { id: 'standard', labelKey: 'standard', detailKey: 'standardDetail', deltaCents: 0 },
  { id: 'express', labelKey: 'express', detailKey: 'expressDetail', deltaCents: 1200 },
] as const;

const paymentMethods = [
  { id: 'wallet', labelKey: 'wallet', detailKey: 'walletDetail', icon: 'wallet-outline' },
  { id: 'card', labelKey: 'card', detailKey: 'cardDetail', icon: 'card-outline' },
  { id: 'cod', labelKey: 'cod', detailKey: 'codDetail', icon: 'cash-outline' },
] as const;

type PaymentId = (typeof paymentMethods)[number]['id'];

export default function CheckoutScreen() {
  const { items, totals, clear, hydrated } = useCart();
  const { profile, status, user } = useAuth();
  const { t } = useI18n();
  const [delivery, setDelivery] = useState<(typeof deliveryMethods)[number]['id']>('standard');
  const [payment, setPayment] = useState<PaymentId>('wallet');
  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState<string | null>(null);
  // Stored as a flag: the message itself comes from the active dictionary, so it
  // re-renders correctly if the language changes while this screen is open.
  const [promoError, setPromoError] = useState(false);
  const [placing, setPlacing] = useState(false);

  // Never leave the checkout reachable with an empty cart.
  useEffect(() => {
    if (hydrated && items.length === 0 && !placing) router.back();
  }, [hydrated, items.length, placing]);

  const { discountCents, shippingCents, taxCents, totalCents } = useMemo(() => {
    const subtotal = totals.subtotalCents;
    const discount = promoCode === PROMO_CODE ? Math.round((subtotal * promoRateBps) / 10_000) : 0;
    const baseShipping = totals.shippingCents;
    const express = deliveryMethods.find((method) => method.id === delivery)?.deltaCents ?? 0;
    const shipping = subtotal === 0 ? 0 : baseShipping + express;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round((taxable * currency.taxRateBps) / 10_000);
    return {
      discountCents: discount,
      shippingCents: shipping,
      taxCents: tax,
      totalCents: taxable + shipping + tax,
    };
  }, [delivery, promoCode, totals.shippingCents, totals.subtotalCents]);

  const applyPromo = () => {
    const candidate = promoInput.trim().toUpperCase();
    if (!candidate) return;
    if (candidate === PROMO_CODE) {
      setPromoCode(candidate);
      setPromoError(false);
    } else {
      setPromoCode(null);
      setPromoError(true);
    }
  };

  /**
   * Signed-in shoppers check out with their saved profile. Visitors keep the
   * storefront sample so the card is never blank before they register.
   */
  const signedIn = status === 'signedIn' && Boolean(user);
  const address = useMemo(
    () => (signedIn ? addressFromProfile(profile, displayNameFor(profile, user)) : defaultAddress()),
    [profile, signedIn, user]
  );
  const addressCityLine = [address.line1, address.city].filter(Boolean).join(', ');
  const addressIncomplete = signedIn && (!address.city || !address.phone);

  const placeOrder = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    const lines: OrderLine[] = items.map((item) => ({
      productId: item.productId,
      name: item.product.name,
      optionValue: item.optionValue,
      qty: item.qty,
      unitPriceCents: item.product.priceCents,
    }));

    const method = paymentMethods.find((item) => item.id === payment);

    const order = buildOrder({
      id: nextOrderId(),
      lines,
      subtotalCents: totals.subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      address,
      dates: t.dates,
      paymentId: method?.id ?? 'wallet',
      paymentLabel: method ? t.checkout[method.labelKey] : t.checkout.wallet,
    });

    await persistOrder(order);
    clear();
    router.replace({ params: { id: order.id }, pathname: '/order/[id]' });
  };

  return (
    <Screen
      footer={
        <Button
          disabled={!hydrated || items.length === 0}
          label={t.checkout.placeOrder(formatPrice(totalCents))}
          loading={placing}
          onPress={() => void placeOrder()}
          testID="place-order"
        />
      }>
      <ScreenHeader back subtitle={t.checkout.subtitle(items.length)} title={t.checkout.title} />

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Ionicons color={colors.inkSoft} name="location-outline" size={18} />
          <Text style={styles.cardTitle}>{t.checkout.deliveryAddress}</Text>
        </View>
        <Text style={styles.addressName}>{address.fullName}</Text>
        {addressCityLine ? <Text style={styles.addressLine}>{addressCityLine}</Text> : null}
        {address.phone ? <Text style={styles.addressLine}>{address.phone}</Text> : null}
        {signedIn ? (
          <Text style={styles.addressNote}>
            {addressIncomplete ? t.checkout.addressIncomplete : t.checkout.addressFromProfile}
          </Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>{t.checkout.deliveryMethod}</Text>
      <View style={styles.card}>
        {deliveryMethods.map((method, index) => (
          <OptionRow
            detail={t.checkout[method.detailKey]}
            key={method.id}
            label={t.checkout[method.labelKey]}
            onSelect={() => setDelivery(method.id)}
            selected={delivery === method.id}
            separator={index > 0}
            trailing={
              method.deltaCents === 0
                ? t.checkout.included
                : t.checkout.extraCost(formatPrice(method.deltaCents))
            }
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t.checkout.payment}</Text>
      <View style={styles.card}>
        {paymentMethods.map((method, index) => (
          <OptionRow
            detail={t.checkout[method.detailKey]}
            icon={method.icon}
            key={method.id}
            label={t.checkout[method.labelKey]}
            onSelect={() => setPayment(method.id)}
            selected={payment === method.id}
            separator={index > 0}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t.checkout.orderSummary}</Text>
      <View style={styles.card}>
        {items.map((item) => (
          <View key={item.key} style={styles.itemRow}>
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              recyclingKey={`checkout-${item.key}`}
              source={item.product.image}
              style={styles.itemImage}
              transition={120}
            />
            <View style={styles.itemBody}>
              <Text numberOfLines={2} style={styles.itemName}>
                {item.product.name}
              </Text>
              <Text style={styles.itemMeta}>
                {item.qty} × {formatPrice(item.product.priceCents)}
                {item.optionValue ? ` · ${item.optionValue}` : ''}
              </Text>
            </View>
            <Text style={styles.itemTotal}>{formatPrice(item.lineTotalCents)}</Text>
          </View>
        ))}

        <View style={styles.promoRow}>
          <TextInput
            accessibilityLabel={t.checkout.promoCode}
            autoCapitalize="characters"
            keyboardAppearance="light"
            onChangeText={(value) => {
              setPromoInput(value);
              setPromoError(false);
            }}
            placeholder={t.checkout.promoCode}
            placeholderTextColor={colors.faint}
            style={styles.promoInput}
            value={promoInput}
          />
          <Button
            label={promoCode ? t.checkout.applied : t.checkout.apply}
            onPress={applyPromo}
            style={styles.promoButton}
            variant="secondary"
          />
        </View>
        {promoError ? (
          <Text style={styles.promoError}>
            {t.checkout.promoInvalid(promoInput.trim().toUpperCase(), PROMO_CODE)}
          </Text>
        ) : null}
        {promoCode ? <Text style={styles.promoOk}>{t.checkout.promoApplied(promoCode)}</Text> : null}

        <View style={styles.totals}>
          <TotalLine label={t.summary.subtotal} value={formatPrice(totals.subtotalCents)} />
          {discountCents > 0 ? (
            <TotalLine label={t.summary.promoDiscount} value={`-${formatPrice(discountCents)}`} positive />
          ) : null}
          <TotalLine
            label={t.summary.delivery}
            value={
              shippingCents === totals.shippingCents && shippingCents === 0
                ? t.common.free
                : formatPrice(shippingCents)
            }
          />
          <TotalLine label={t.summary.taxPlain} value={formatPrice(taxCents)} />
          <View style={styles.totalDivider} />
          <TotalLine bold label={t.summary.totalDue} value={formatPrice(totalCents)} />
        </View>
      </View>

      <View style={styles.assurance}>
        <Ionicons color={colors.success} name="shield-checkmark-outline" size={17} />
        <Text style={styles.assuranceText}>{t.checkout.assurance}</Text>
      </View>
    </Screen>
  );
}

function OptionRow({
  label,
  detail,
  trailing,
  icon,
  selected,
  separator,
  onSelect,
}: {
  label: string;
  detail: string;
  trailing?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  separator: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      android_ripple={{ color: 'rgba(11,17,32,0.05)' }}
      onPress={onSelect}
      style={[styles.optionRow, separator && styles.optionBorder]}>
      {icon ? <Ionicons color={selected ? colors.brandDark : colors.muted} name={icon} size={19} /> : null}
      <View style={styles.optionBody}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>{label}</Text>
        <Text style={styles.optionDetail}>{detail}</Text>
      </View>
      {trailing ? <Text style={styles.optionTrailing}>{trailing}</Text> : null}
      <View style={[styles.radio, selected && styles.radioActive]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function TotalLine({ label, value, bold, positive }: { label: string; value: string; bold?: boolean; positive?: boolean }) {
  return (
    <View style={styles.totalLine}>
      <Text style={[styles.totalLabel, bold && styles.totalLabelBold]}>{label}</Text>
      <Text
        style={[
          styles.totalValue,
          bold && styles.totalValueBold,
          positive && styles.totalDiscount,
        ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  cardTitle: { ...typography.subtitle, fontSize: 15 },
  addressName: { ...typography.bodyStrong },
  addressLine: { ...typography.caption, lineHeight: 18 },
  addressNote: { ...typography.tiny, color: colors.brandDark, marginTop: 4 },
  sectionTitle: { ...typography.subtitle, marginTop: spacing.xl, marginBottom: spacing.sm },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  optionBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  optionBody: { flex: 1 },
  optionLabel: { ...typography.bodyStrong },
  optionLabelActive: { color: colors.brandDark },
  optionDetail: { ...typography.caption, marginTop: 1 },
  optionTrailing: { fontSize: 12, fontWeight: '700', color: colors.muted },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.brand },
  radioDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.brand },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  itemImage: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: '#EEF1F6' },
  itemBody: { flex: 1 },
  itemName: { ...typography.bodyStrong, fontSize: 13.5, lineHeight: 18 },
  itemMeta: { ...typography.caption, marginTop: 1 },
  itemTotal: { fontSize: 14, fontWeight: '800', color: colors.ink },
  promoRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.canvas,
  },
  promoButton: { minWidth: 96, minHeight: 46 },
  promoError: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  promoOk: { color: colors.success, fontSize: 12, fontWeight: '700' },
  totals: { marginTop: spacing.md, gap: 6 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.body },
  totalLabelBold: { ...typography.bodyStrong },
  totalValue: { ...typography.body, fontVariant: ['tabular-nums'] },
  totalValueBold: { fontSize: 17, fontWeight: '900', color: colors.ink },
  totalDiscount: { color: colors.success, fontWeight: '700' },
  totalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.sm },
  assurance: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  assuranceText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: '#166534', fontWeight: '500' },
});
