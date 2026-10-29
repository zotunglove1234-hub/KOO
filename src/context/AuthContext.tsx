import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchProfile, saveProfile as persistProfile, type KooProfile, type ProfileErrorCode, type ProfilePatch, type ProfileResult } from '@/lib/profile';
import {
  getCurrentUser,
  isSupabaseConfigured,
  onSupabaseAuthStateChange,
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  supabaseConfigError,
  type KooUser,
  type SignInResult,
  type SignUpResult,
} from '@/lib/supabase';

/**
 * Auth state for the whole app.
 *
 * Supabase is the single source of truth: the session is persisted in
 * AsyncStorage by `src/lib/supabase.ts`, so the provider only has to restore it
 * once at boot and then follow `onAuthStateChange`. Nothing here keeps a second
 * copy of the user in AsyncStorage — two stores of the same fact always drift.
 *
 * `status` starts as `checking` rather than `signedOut` so screens do not flash a
 * sign-in prompt at a user who is already signed in while storage is still
 * loading.
 */
export type AuthStatus = 'checking' | 'signedOut' | 'signedIn';

type AuthContextValue = {
  status: AuthStatus;
  user: KooUser | null;
  /** False when the env values are missing/placeholders, so login is impossible. */
  configured: boolean;
  /** Secret-free, technical explanation of why `configured` is false. */
  configDetail: string | null;
  /**
   * The signed-in user's `koo_profiles` row, or null while signed out, before it
   * has been read, and whenever the read failed. Screens must not present a
   * fallback as if it were saved data — check `profileReason` instead.
   */
  profile: KooProfile | null;
  /** Why the profile is unavailable; null when it loaded (or there is nothing to load). */
  profileReason: ProfileErrorCode | null;
  /** True once the profile read has settled, so the Account screen can stop showing a spinner. */
  profileSettled: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveProfile: (patch: ProfilePatch) => Promise<ProfileResult<KooProfile>>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Env values are inlined at build time, so this never changes during a run.
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<KooUser | null>(null);
  // With no Supabase to talk to there is nothing to restore: start already resolved.
  const [checking, setChecking] = useState(!configured);
  const [profile, setProfile] = useState<KooProfile | null>(null);
  const [profileReason, setProfileReason] = useState<ProfileErrorCode | null>(null);
  const [profileSettled, setProfileSettled] = useState(!configured);

  /**
   * `koo_profiles` follows the session: it is read whenever the signed-in user
   * changes, and a failure is remembered as a reason key instead of throwing.
   *
   * Every state update runs inside the `.then()`, including the signed-out case,
   * because `fetchProfile` cannot be called without a user; that also keeps the
   * effect from setting state synchronously.
   */
  useEffect(() => {
    let cancelled = false;

    const request: Promise<ProfileResult<KooProfile | null>> = user
      ? fetchProfile(user)
      : Promise.resolve({ ok: true, data: null });

    request.then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setProfile(result.data);
        setProfileReason(null);
      } else {
        setProfile(null);
        setProfileReason(result.reason);
      }
      setProfileSettled(true);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    // A stored, expired session makes `getSession()` refresh over the network, and
    // a dead connection can leave that promise pending for a long time. Without
    // this the app would sit on `checking` forever; with it the UI resolves to
    // signed-out and the real session still lands when storage or the network
    // finally answers, because both paths call setUser/setChecking.
    const settleTimer = setTimeout(() => {
      if (!cancelled) setChecking(false);
    }, 8000);

    getCurrentUser()
      .then((restored) => {
        if (!cancelled) setUser(restored);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    // Covers sign-in, sign-out and token refresh; the listener also fires
    // immediately with the stored session, which is harmless (same value).
    const unsubscribe = onSupabaseAuthStateChange((session) => {
      if (cancelled) return;
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null);
      setChecking(false);
    });

    return () => {
      cancelled = true;
      clearTimeout(settleTimer);
      unsubscribe();
    };
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    const result = await signInWithEmail(email, password);
    // The auth listener normally updates state first; setting it here too keeps
    // the screen correct even on a build where the event is missed.
    if (result.ok) void getCurrentUser().then(setUser).catch(() => undefined);
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    const result = await signUpWithEmail(email, password);
    if (result.ok && !result.needsConfirmation) void getCurrentUser().then(setUser).catch(() => undefined);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await signOutCurrentUser();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileReason(null);
      setProfileSettled(true);
      return;
    }
    const result = await fetchProfile(user);
    if (result.ok) {
      setProfile(result.data);
      setProfileReason(null);
    } else {
      setProfile(null);
      setProfileReason(result.reason);
    }
    setProfileSettled(true);
  }, [user]);

  const saveProfile = useCallback(
    async (patch: ProfilePatch): Promise<ProfileResult<KooProfile>> => {
      const result = await persistProfile(user, patch);
      // Only a saved row is shown as saved; a refused write leaves the last
      // known profile alone and the screen reports the reason.
      if (result.ok) {
        setProfile(result.data);
        setProfileReason(null);
        setProfileSettled(true);
      }
      return result;
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status: checking ? 'checking' : user ? 'signedIn' : 'signedOut',
      user,
      configured,
      configDetail: configured ? null : supabaseConfigError(),
      profile,
      profileReason,
      profileSettled,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      saveProfile,
    }),
    [checking, user, configured, profile, profileReason, profileSettled, signIn, signUp, signOut, refreshProfile, saveProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
