import { Platform } from 'react-native';

/**
 * Design tokens for KOO. Single source of truth for colour, spacing, radius and
 * typography so screens stay visually consistent on Android and iOS.
 */
export const colors = {
  brand: '#F97316',
  brandDark: '#EA580C',
  ink: '#0B1120',
  inkSoft: '#1E293B',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#E2E8F0',
  surface: '#FFFFFF',
  canvas: '#F6F7FB',
  success: '#16A34A',
  danger: '#DC2626',
  star: '#F59E0B',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 26, fontWeight: '800', color: colors.ink },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  body: { fontSize: 14, fontWeight: '400', color: colors.inkSoft },
  bodyStrong: { fontSize: 14, fontWeight: '600', color: colors.ink },
  caption: { fontSize: 12, fontWeight: '500', color: colors.muted },
  tiny: { fontSize: 11, fontWeight: '600', color: colors.faint },
} as const;

/** Android uses elevation; iOS uses shadow. Keep call sites to one helper. */
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  padding: spacing.lg,
  ...(Platform.OS === 'android'
    ? { elevation: 2 }
    : {
        shadowColor: colors.ink,
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }),
} as const;

export const currency = {
  symbol: '$',
  /** Free shipping over this cart subtotal (in cents to stay exact). */
  freeShippingThresholdCents: 15000,
  shippingCents: 699,
  taxRateBps: 750, // 7.50%
} as const;
