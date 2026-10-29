import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { detectDeviceLang, detectDeviceLocale, langFromLocale, type Lang } from './deviceLanguage';
import { en, type Dictionary } from './dictionaries/en';
import { my as myDictionary } from './dictionaries/my';

/**
 * Own storage key on purpose: the cart (`koo.cart.v1`), order history
 * (`koo.orders.v1`) and the Supabase session (`koo-auth`) each live under their
 * own key, so switching language never clears authentication or local data.
 */
const LANGUAGE_KEY = 'koo.language.v1';

const dictionaries: Record<Lang, Dictionary> = { en, my: myDictionary };

export type LanguageContextValue = {
  /** The language actually being rendered. */
  lang: Lang;
  t: Dictionary;
  /** Device locale as reported by React Native, e.g. `en-US` / `my-MM`. */
  deviceLocale: string | null;
  deviceLang: Lang;
  /** False once the user picks a language by hand — then we never override it. */
  isDeviceDefault: boolean;
  /** Persist a manual choice and re-render immediately (no restart). */
  setLang: (lang: Lang) => void;
  /** Forget the manual choice and follow the device again. */
  followDevice: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start from the device so the very first frame is already the right language;
  // a stored manual choice then lands as soon as storage answers.
  const deviceLocale = useMemo(() => detectDeviceLocale(), []);
  const deviceLang = useMemo(() => langFromLocale(deviceLocale), [deviceLocale]);
  const [lang, setLangState] = useState<Lang>(deviceLang);
  const [isDeviceDefault, setIsDeviceDefault] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (cancelled || !stored) return;
        if (stored === 'en' || stored === 'my') {
          setLangState(stored);
          setIsDeviceDefault(false);
        }
      } catch {
        // Unreadable storage is not a reason to lose the language the user sees.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    setIsDeviceDefault(false);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => {
      /* the choice still applies for this session if storage is unavailable */
    });
  }, []);

  const followDevice = useCallback(() => {
    const next = detectDeviceLang();
    setLangState(next);
    setIsDeviceDefault(true);
    AsyncStorage.removeItem(LANGUAGE_KEY).catch(() => {
      /* same as above: state is already correct for this session */
    });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      t: dictionaries[lang],
      deviceLocale,
      deviceLang,
      isDeviceDefault,
      setLang,
      followDevice,
    }),
    [lang, deviceLocale, deviceLang, isDeviceDefault, setLang, followDevice]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n must be used inside <LanguageProvider>');
  return context;
}

/** Convenience hook for screens that only need the active dictionary. */
export function useT(): Dictionary {
  return useI18n().t;
}
