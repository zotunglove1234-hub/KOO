import { I18nManager } from 'react-native';

/**
 * Device locale detection without adding a native dependency.
 *
 * `expo-localization` would be the usual choice but it ships native code, so the
 * app could only read the device language after a new APK build. React Native
 * already exposes the device locale through `I18nManager`, which keeps this a
 * pure-JS check with two guarded fallbacks.
 */
export type Lang = 'en' | 'my';

export const LANGS: readonly Lang[] = ['en', 'my'];

/** ISO 639-1 (`my`) plus the legacy 639-2/B form (`bur`) some devices report. */
const MYANMAR_TAGS = new Set(['my', 'bur', 'my-mm']);

function normalizeTag(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const tag = String(raw).trim().toLowerCase().replace(/_/g, '-');
  return tag.length > 0 ? tag : null;
}

/** `my`, `my-MM` and `bur` are matched on the primary subtag. */
export function langFromLocale(raw: string | null | undefined): Lang {
  const tag = normalizeTag(raw);
  if (!tag) return 'en';
  const primary = tag.split('-')[0];
  return MYANMAR_TAGS.has(primary) || MYANMAR_TAGS.has(tag) ? 'my' : 'en';
}

function fromI18nManager(): string | null {
  try {
    // The constant is absent on platforms without the native i18n module.
    return I18nManager.getConstants()?.localeIdentifier ?? null;
  } catch {
    return null;
  }
}

function fromIntl(): string | null {
  try {
    if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') return null;
    return Intl.DateTimeFormat().resolvedOptions().locale ?? null;
  } catch {
    return null;
  }
}

/**
 * Best available device locale string, or null when neither source answers.
 * Exported so Settings can show which language the app is following.
 */
export function detectDeviceLocale(): string | null {
  return fromI18nManager() ?? fromIntl();
}

export function detectDeviceLang(): Lang {
  return langFromLocale(detectDeviceLocale());
}
