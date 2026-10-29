import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase is wired in additively: every screen still renders from the local
 * catalog in `src/data/catalog.ts`, so nothing here may throw at import time.
 * A missing or placeholder env file has to degrade into a readable error, not a
 * white screen at app boot.
 *
 * Expo inlines `EXPO_PUBLIC_*` values into the JS bundle at build time, which
 * means the values baked into an APK are public. Only the publishable/anon key
 * belongs here — never the `service_role` secret.
 */

const PLACEHOLDER_URL = 'your-project-ref';

export type SupabaseConfig = { url: string; publishableKey: string };

/**
 * supabase-js must be given the project root — it appends `/rest/v1`, `/auth/v1`
 * and `/storage/v1` itself. The dashboard copies an endpoint like
 * `https://ref.supabase.co/rest/v1/`, so reduce any value to its origin.
 * `URL` is polyfilled by React Native itself (`Libraries/Core/setUpXHR.js`).
 */
function normalizeSupabaseUrl(raw: string): string {
  try {
    const origin = new URL(raw).origin;
    if (origin && origin !== 'null') return origin;
  } catch {
    /* fall through to trimming */
  }
  return raw.replace(/\/+$/, '');
}

/** Returns the parsed config, or null when env values are absent/unresolved. */
export function readSupabaseConfig(): SupabaseConfig | null {
  const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!rawUrl || !publishableKey) return null;
  if (rawUrl.startsWith(`https://${PLACEHOLDER_URL}`) || rawUrl === 'https://placeholder.supabase.co') return null;
  return { url: normalizeSupabaseUrl(rawUrl), publishableKey };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig() !== null;
}

/** Human-readable, secret-free explanation of why Supabase is unavailable. */
export function supabaseConfigError(): string | null {
  if (readSupabaseConfig()) return null;
  const missing = [
    !process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() && 'EXPO_PUBLIC_SUPABASE_URL',
    !process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() && 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  ].filter(Boolean) as string[];
  if (missing.length > 0) {
    return `Missing ${missing.join(', ')} — add them to the root .env file (see .env.example) and restart the bundler or rebuild the APK, because these values are inlined at build time.`;
  }
  return 'Supabase env values are still the placeholders from .env.example — replace them with your project URL and publishable key.';
}

let client: SupabaseClient | null = null;

/**
 * Single shared client for the whole app. Sessions are persisted in
 * AsyncStorage, so a signed-in user stays signed in across app restarts and
 * the access token refreshes itself in the background.
 *
 * Throws only when actually used without configuration, so importing this
 * module is always safe.
 */
export function getSupabase(): SupabaseClient {
  const config = readSupabaseConfig();
  if (!config) {
    throw new Error(supabaseConfigError() ?? 'Supabase is not configured.');
  }
  if (!client) {
    client = createClient(config.url, config.publishableKey, {
      auth: {
        // AsyncStorage is the React Native storage adapter: it survives app
        // restarts, unlike the default in-memory store.
        storage: AsyncStorage,
        storageKey: 'koo-auth',
        persistSession: true,
        autoRefreshToken: true,
        // RN has no browser URL fragments; Expo Router owns deep links, so auth
        // callbacks are handled explicitly instead of sniffed from a URL here.
        detectSessionInUrl: false,
        // PKCE is what Supabase recommends for mobile OAuth flows.
        flowType: 'pkce',
      },
    });
  }
  return client;
}

let authReady: Promise<void> | null = null;

/**
 * Loads any persisted session once per process. Calling this at startup lets
 * supabase-js schedule the token refresh timer for the restored session.
 */
export function initSupabaseAuth(): Promise<void> {
  if (!isSupabaseConfigured()) return Promise.resolve();
  if (!authReady) {
    authReady = getSupabase().auth
      .getSession()
      .then(() => undefined)
      .catch(() => {
        // A corrupt/unreadable persisted session must not block startup; let the
        // next attempt re-read storage instead of caching a rejected promise.
        authReady = null;
      });
  }
  return authReady;
}

/** Restore a persisted session and report whether one exists. */
export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabase().auth.getSession();
  if (error) return null;
  return data.session;
}

/** Subscribe to sign-in / sign-out / token refresh events. */
export function onSupabaseAuthStateChange(handler: (session: Session | null) => void): () => void {
  if (!isSupabaseConfigured()) return () => undefined;
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Email + password sign-in
 * ============================================================================
 * Supabase auth failures arrive as `{ code, message }` in English, straight from
 * the API. Screens never show those raw: they get back one of these keys and look
 * it up in the active dictionary, so a Myanmar user is not shown English jargon
 * and no server text leaks into the UI.
 */
export type AuthErrorReason =
  | 'notConfigured'
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'emailTaken'
  | 'weakPassword'
  | 'invalidEmail'
  | 'rateLimited'
  | 'offline'
  | 'unknown';

export type SignInResult = { ok: true } | { ok: false; reason: AuthErrorReason };

export type SignUpResult = { ok: true; needsConfirmation: boolean } | { ok: false; reason: AuthErrorReason };

/** The pieces of a session the UI needs; keeps `User` out of every screen. */
export type KooUser = { id: string; email: string };

/**
 * `code` is present on newer auth servers and absent on older ones, so both the
 * code and a substring of the message are checked. Network failures surface as a
 * `TypeError: Network request failed` with no code at all.
 */
function authErrorReason(error: { code?: string; message?: string } | null): AuthErrorReason {
  const code = (error?.code ?? '').toLowerCase();
  const message = (error?.message ?? '').toLowerCase();
  const is = (...needles: string[]) => needles.some((needle) => code.includes(needle) || message.includes(needle));

  if (is('invalid_login', 'invalid_credentials', 'invalid grant')) return 'invalidCredentials';
  if (is('email_not_confirmed', 'not confirmed')) return 'emailNotConfirmed';
  if (is('user_already_exists', 'already registered', 'email_taken')) return 'emailTaken';
  if (is('weak_password')) return 'weakPassword';
  // GoTrue calls this code `email_address_invalid` (confirmed against a live
  // project), which is not the substring `invalid_email` — missing it turned a
  // plain "that address is not valid" into the generic unknown error.
  if (is('invalid_email', 'email_address_invalid')) return 'invalidEmail';
  if (is('over_request_limit', 'rate_limit', 'too many requests', '429')) return 'rateLimited';
  if (is('network request failed', 'failed to fetch', 'network_error', 'timeout')) return 'offline';
  return 'unknown';
}

function toUser(id: string, email: string | undefined): KooUser {
  return { id, email: email ?? '' };
}

export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'notConfigured' };
  try {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, reason: authErrorReason(error) };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: authErrorReason(err instanceof Error ? { message: err.message } : null) };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'notConfigured' };
  try {
    const { data, error } = await getSupabase().auth.signUp({ email: email.trim(), password });
    if (error) return { ok: false, reason: authErrorReason(error) };
    // With "Confirm email" switched on, signUp returns a user but no session:
    // the account exists, it just cannot sign in until the link is clicked.
    return { ok: true, needsConfirmation: data.session === null };
  } catch (err) {
    return { ok: false, reason: authErrorReason(err instanceof Error ? { message: err.message } : null) };
  }
}

export async function signOutCurrentUser(): Promise<SignInResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'notConfigured' };
  try {
    const { error } = await getSupabase().auth.signOut();
    if (error) return { ok: false, reason: authErrorReason(error) };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: authErrorReason(err instanceof Error ? { message: err.message } : null) };
  }
}

/** Read the persisted/refreshed session as a `KooUser`, or null when signed out. */
export async function getCurrentUser(): Promise<KooUser | null> {
  const session = await getCurrentSession();
  if (!session?.user) return null;
  return toUser(session.user.id, session.user.email);
}

