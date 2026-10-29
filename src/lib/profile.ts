import { getSupabase, isSupabaseConfigured, type KooUser } from '@/lib/supabase';

/**
 * The readable part of an account: display name, phone and city, stored in
 * `public.koo_profiles` by `supabase/koo-profile-schema.sql`.
 *
 * Why this exists at all: Supabase's own `auth.users` row is not readable with a
 * publishable key, so a signed-in user would otherwise know nothing about
 * themselves except their email address. This table is keyed by the same uuid,
 * is created automatically by a trigger when someone registers, and its
 * row-level security lets a user read and change only their own row.
 *
 * Same contract as `src/lib/chat.ts`: nothing here throws at import time, and an
 * unconfigured build, an offline device, a missing table or a refused policy all
 * come back as a reason key that screens translate — never as raw server text.
 */

export type KooProfile = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
};

/** What the /profile form edits; `undefined` means "leave that column alone". */
export type ProfilePatch = {
  displayName?: string | null;
  phone?: string | null;
  city?: string | null;
};

export type ProfileErrorCode =
  | 'unavailable'
  | 'missingTables'
  | 'offline'
  | 'forbidden'
  | 'signedOut'
  | 'unknown';

export type ProfileResult<T> = { ok: true; data: T } | { ok: false; reason: ProfileErrorCode };

/** Column checks in the schema use the same limits, so a long value is refused. */
export const MAX_DISPLAY_NAME_LENGTH = 60;
export const MAX_PHONE_LENGTH = 32;
export const MAX_CITY_LENGTH = 60;

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
};

function profileReason(error: { code?: string; message?: string } | null): ProfileErrorCode {
  const code = (error?.code ?? '').toLowerCase();
  const message = (error?.message ?? '').toLowerCase();
  const is = (...needles: string[]) => needles.some((needle) => code.includes(needle) || message.includes(needle));

  if (is('42p01', 'pgrst205', 'schema cache', 'could not find the table', 'relation')) return 'missingTables';
  if (is('jwt expired', 'pgrst301', 'invalid token')) return 'signedOut';
  if (is('42501', 'row-level security', 'permission denied')) return 'forbidden';
  if (is('fetch failed', 'network', 'timeout', 'unable to contact', 'failed to fetch')) return 'offline';
  return 'unknown';
}

function toReason(err: unknown): ProfileErrorCode {
  if (err instanceof Error) return profileReason({ message: err.message });
  return 'unknown';
}

function mapProfile(row: ProfileRow): KooProfile {
  return {
    id: row.id,
    email: row.email ?? '',
    displayName: row.display_name?.trim() ? row.display_name.trim() : null,
    phone: row.phone?.trim() ? row.phone.trim() : null,
    city: row.city?.trim() ? row.city.trim() : null,
    // Postgres sends `timestamptz` as a full ISO stamp; every screen here shows a
    // calendar day, and `formatDate` only parses `YYYY-MM-DD`, so cut it here
    // rather than repeat the slice at each call site.
    createdAt: row.created_at.slice(0, 10),
    updatedAt: row.updated_at.slice(0, 10),
  };
}

/**
 * "soundlab.studio" reads as "Soundlab Studio", so a brand-new account has
 * something human in the header before it ever opens the profile form.
 */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local.replace(/[._+-]+/g, ' ').trim() || email;
}

/** Title-cases the email-derived guess; a saved display name is used verbatim. */
export function displayNameFor(profile: KooProfile | null, user: KooUser | null): string {
  const saved = profile?.displayName?.trim();
  if (saved) return saved;
  const email = profile?.email || user?.email || '';
  const guess = nameFromEmail(email);
  return guess.charAt(0).toUpperCase() + guess.slice(1);
}

/**
 * The signed-in user's row, or `null` when it does not exist yet (a pre-trigger
 * account). `ok: false` means the profile genuinely could not be read, which the
 * Account screen shows as a quiet note rather than a blocked storefront.
 */
export async function fetchProfile(user: KooUser | null): Promise<ProfileResult<KooProfile | null>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'unavailable' };
  if (!user) return { ok: false, reason: 'signedOut' };

  try {
    const { data, error } = await getSupabase()
      .from('koo_profiles')
      .select('id, email, display_name, phone, city, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) return { ok: false, reason: profileReason(error) };
    return { ok: true, data: data ? mapProfile(data as ProfileRow) : null };
  } catch (err) {
    return { ok: false, reason: toReason(err) };
  }
}

/**
 * Write the editable columns for this user.
 *
 * An upsert rather than an update, because the row may not exist yet — the
 * auto-create trigger only fires for accounts made after the SQL was pasted, and
 * the back-fill in that file runs once. Blank input is stored as NULL so "not
 * provided" and "provided then cleared" do not both end up as empty strings.
 */
export async function saveProfile(user: KooUser | null, patch: ProfilePatch): Promise<ProfileResult<KooProfile>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'unavailable' };
  if (!user) return { ok: false, reason: 'signedOut' };

  const clean = (value: string | null | undefined, max: number) => {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return null;
    return trimmed.slice(0, max);
  };

  const row: Record<string, unknown> = { id: user.id, email: user.email };
  if (patch.displayName !== undefined) row.display_name = clean(patch.displayName, MAX_DISPLAY_NAME_LENGTH);
  if (patch.phone !== undefined) row.phone = clean(patch.phone, MAX_PHONE_LENGTH);
  if (patch.city !== undefined) row.city = clean(patch.city, MAX_CITY_LENGTH);

  try {
    const { data, error } = await getSupabase()
      .from('koo_profiles')
      .upsert(row, { onConflict: 'id' })
      .select('id, email, display_name, phone, city, created_at, updated_at')
      .single();

    if (error) return { ok: false, reason: profileReason(error) };
    if (!data) return { ok: false, reason: 'unknown' };
    return { ok: true, data: mapProfile(data as ProfileRow) };
  } catch (err) {
    return { ok: false, reason: toReason(err) };
  }
}
