import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Rating, Tag } from '@/components/Bits';
import { Button } from '@/components/Button';
import { ChipRow, SectionHeader } from '@/components/Filters';
import { QtyStepper } from '@/components/QtyStepper';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { getProduct, relatedProducts } from '@/data/catalog';
import { useI18n } from '@/i18n';
import { openConversation } from '@/lib/chat';
import { discountPercent, formatPrice } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = useMemo(() => getProduct(id), [id]);
  const { add, totals, qtyOf } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();

  const [optionValue, setOptionValue] = useState<string | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [chatNote, setChatNote] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  if (!product) {
    return (
      <Screen>
        <ScreenHeader back title={t.product.screenTitle} />
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>{t.product.notListed}</Text>
          <Button label={t.product.backToCatalog} onPress={() => router.replace('/search')} style={styles.missingButton} variant="secondary" />
        </View>
      </Screen>
    );
  }

  const discount = discountPercent(product.priceCents, product.compareAtCents);
  const inCart = qtyOf(product.id);
  const lowStock = product.stock <= 8;

  const handleAdd = () => {
    add(product.id, { optionValue: optionValue ?? product.option?.values[0], qty });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  /**
   * Opens (or resumes) the buyer <-> seller thread for this product. Signing in
   * is a precondition, so an unauthenticated tap parks on /login first; the
   * thread itself is only created once there is a real user id to own it.
   */
  const handleChat = async () => {
    setChatNote(null);
    if (!user) {
      router.push('/login');
      return;
    }
    setOpeningChat(true);
    const result = await openConversation({ userId: user.id, productId: product.id, sellerName: product.seller });
    setOpeningChat(false);

    if (result.ok) {
      router.push({ params: { id: result.data.id }, pathname: '/chat/[id]' });
      return;
    }
    if (result.reason === 'signedOut') {
      router.push('/login');
      return;
    }
    setChatNote(
      result.reason === 'unavailable' || result.reason === 'missingTables'
        ? t.chat.unavailableBody
        : t.chat.failedToLoad
    );
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>
              {qty > 1 ? t.product.qtyPrefix(qty) : ''}
              {formatPrice(product.priceCents)}
            </Text>
            {product.freeShipping ? <Text style={styles.footerNote}>{t.product.freeDeliveryIncluded}</Text> : null}
          </View>
          <View style={styles.footerActions}>
            <Button
              disabled={product.stock === 0}
              label={product.stock === 0 ? t.product.soldOut : justAdded ? t.product.added : t.product.addToCart}
              onPress={handleAdd}
              style={styles.addButton}
              testID="add-to-cart"
            />
            <Link asChild href="/cart">
              <Pressable accessibilityLabel={t.product.openCartA11y} accessibilityRole="button" style={styles.cartPulse}>
                <Ionicons color={colors.ink} name="cart-outline" size={22} />
                {totals.itemCount > 0 ? (
                  <View style={styles.pulseCount}>
                    <Text style={styles.pulseText}>{totals.itemCount > 9 ? '9+' : totals.itemCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </Link>
          </View>
        </View>
      }>
      <ScreenHeader
        back
        right={
          <Pressable
            accessibilityLabel={saved ? t.product.unsaveA11y : t.product.saveA11y}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            hitSlop={8}
            onPress={() => setSaved((value) => !value)}
            style={styles.saveButton}>
            <Ionicons color={saved ? colors.brand : colors.muted} name={saved ? 'heart' : 'heart-outline'} size={22} />
          </Pressable>
        }
        subtitle={product.seller}
        title={product.name.split(' ').slice(0, 2).join(' ')}
      />

      <View style={styles.media}>
        <Image
          allowDownscaling
          cachePolicy="memory-disk"
          contentFit="contain"
          recyclingKey={`detail-${product.id}`}
          source={product.image}
          style={StyleSheet.absoluteFill}
          transition={250}
        />
        <View style={styles.mediaBadges}>
          {discount ? <Tag label={t.product.discountToday(discount)} tone="brand" /> : null}
          {inCart > 0 ? <Tag icon="cart-outline" label={t.product.inCartBadge(inCart)} tone="neutral" /> : null}
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.priceCents)}</Text>
          {product.compareAtCents ? <Text style={styles.compare}>{formatPrice(product.compareAtCents)}</Text> : null}
          <View style={styles.ratingWrap}>
            <Rating reviews={product.reviews} value={product.rating} />
          </View>
        </View>

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.blurb}>{product.blurb}</Text>

        {lowStock && product.stock > 0 ? (
          <View style={styles.stockRow}>
            <Ionicons color={colors.danger} name="flame-outline" size={15} />
            <Text style={styles.stockText}>{t.product.lowStock(product.stock)}</Text>
          </View>
        ) : null}

        {product.option ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{t.catalog.optionLabel(product.option.label)}</Text>
            <ChipRow
              onSelect={(value) => setOptionValue(value)}
              options={product.option.values.map((value) => ({ id: value, label: value }))}
              selected={optionValue ?? product.option.values[0]}
            />
          </View>
        ) : null}

        <View style={styles.qtyBlock}>
          <QtyStepper
            label={t.product.quantity}
            max={Math.min(product.stock, 10)}
            onChange={setQty}
            qty={qty}
          />
          <Text style={styles.qtyNote}>{t.product.maxPerOrder(Math.min(product.stock, 10))}</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.blockTitle}>{t.product.description}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <Text style={[styles.blockTitle, styles.highlightsTitle]}>{t.product.whatIsIncluded}</Text>
        <View style={styles.highlights}>
          {product.highlights.map((highlight) => (
            <View key={highlight} style={styles.highlightRow}>
              <Ionicons color={colors.success} name="checkmark-circle" size={17} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>

        <View style={styles.shippingCard}>
          <View style={styles.shippingRow}>
            <Ionicons color={colors.inkSoft} name={product.freeShipping ? 'car-outline' : 'cube-outline'} size={19} />
            <View style={styles.shippingBody}>
              <Text style={styles.shippingTitle}>
                {product.freeShipping ? t.product.freeDeliveryTitle : t.product.standardDeliveryTitle}
              </Text>
              <Text style={styles.shippingNote}>{t.product.shippedBy(product.seller)}</Text>
            </View>
          </View>
          <View style={styles.shippingRow}>
            <Ionicons color={colors.inkSoft} name="refresh-outline" size={19} />
            <View style={styles.shippingBody}>
              <Text style={styles.shippingTitle}>{t.product.returnsTitle}</Text>
              <Text style={styles.shippingNote}>{t.product.returnsNote}</Text>
            </View>
          </View>
        </View>

        <View style={styles.chatBlock}>
          <Button
            label={t.product.chatWithSeller}
            loading={openingChat}
            onPress={() => void handleChat()}
            testID="chat-with-seller"
            variant="secondary"
          />
          {chatNote ? <Text style={styles.chatNote}>{chatNote}</Text> : null}
        </View>

        <Text style={styles.category}>{t.product.categoryLine(t.catalog.category[product.category])}</Text>
      </View>

      <SectionHeader title={t.product.youMayAlsoLike} />
      <ScrollView contentContainerStyle={styles.rail} horizontal showsHorizontalScrollIndicator={false}>
        {relatedProducts(product).map((related) => (
          <Link asChild href={{ params: { id: related.id }, pathname: '/product/[id]' }} push key={related.id}>
            <Pressable android_ripple={{ color: 'rgba(11,17,32,0.06)', borderless: true }} style={styles.relatedCard}>
              <Image
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={`related-${related.id}`}
                source={related.image}
                style={styles.relatedImage}
                transition={180}
              />
              <Text numberOfLines={2} style={styles.relatedName}>
                {related.name}
              </Text>
              <Text style={styles.relatedPrice}>{formatPrice(related.priceCents)}</Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: { alignItems: 'center', paddingTop: spacing.xxl * 2, gap: spacing.lg },
  missingTitle: { ...typography.subtitle },
  missingButton: { minWidth: 180 },
  saveButton: { padding: spacing.xs },
  media: {
    height: 320,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  mediaBadges: { position: 'absolute', top: spacing.md, left: spacing.md, flexDirection: 'row', gap: spacing.sm },
  info: { paddingTop: spacing.lg, gap: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  price: { fontSize: 26, fontWeight: '900', color: colors.ink },
  compare: { fontSize: 14, fontWeight: '500', color: colors.faint, textDecorationLine: 'line-through' },
  ratingWrap: { marginLeft: 'auto' },
  name: { ...typography.title, marginTop: spacing.sm },
  blurb: { ...typography.caption, fontSize: 13, lineHeight: 19 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  stockText: { fontSize: 12, fontWeight: '700', color: colors.danger },
  block: { marginTop: spacing.md },
  blockTitle: { ...typography.subtitle, fontSize: 15, marginBottom: spacing.sm },
  qtyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  qtyNote: { ...typography.caption },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginTop: spacing.lg, marginBottom: spacing.sm },
  description: { ...typography.body, lineHeight: 22 },
  highlightsTitle: { marginTop: spacing.lg },
  highlights: { gap: spacing.sm },
  highlightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  highlightText: { ...typography.body, flex: 1 },
  shippingCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  shippingRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  shippingBody: { flex: 1 },
  shippingTitle: { ...typography.bodyStrong },
  shippingNote: { ...typography.caption, marginTop: 2, lineHeight: 17 },
  chatBlock: { gap: spacing.sm, marginTop: spacing.md },
  chatNote: { ...typography.caption, color: colors.danger, lineHeight: 17 },
  category: { ...typography.caption, marginTop: spacing.md },
  rail: { gap: spacing.md, paddingRight: spacing.lg, paddingVertical: 2 },
  relatedCard: {
    width: 132,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  relatedImage: { width: '100%', height: 112, backgroundColor: '#EEF1F6' },
  relatedName: { ...typography.bodyStrong, fontSize: 12.5, lineHeight: 17, paddingHorizontal: spacing.sm, marginTop: spacing.sm },
  relatedPrice: { ...typography.caption, fontSize: 13, fontWeight: '800', color: colors.ink, padding: spacing.sm, paddingTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  footerLabel: { fontSize: 17, fontWeight: '900', color: colors.ink },
  footerNote: { ...typography.caption },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  addButton: { minWidth: 150 },
  cartPulse: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseText: { color: colors.white, fontSize: 11, fontWeight: '800' },
});
