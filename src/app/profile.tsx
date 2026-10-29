import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/Filters';
import { Field } from '@/components/Field';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useT, type Dictionary } from '@/i18n';
import { formatDate } from '@/lib/format';
import {
  MAX_CITY_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  type KooProfile,
  type ProfileErrorCode,
  type ProfilePatch,
  type ProfileResult,
} from '@/lib/profile';
import { colors, radius, spacing, typography } from '@/theme';

/**
 * Editing the signed-in account's `public.koo_profiles` row.
 *
 * Everything that can go wrong here is a reason key, not an exception: the table
 * may not exist yet (the SQL has not been pasted), the policies may refuse the
 * write, or the device may be offline. The screen says which one it is, because
 * "could not save" without a reason is indistinguishable from a broken form.
 */
export default function ProfileScreen() {
  const t = useT();
  const { configured, configDetail, profile, profileReason, profileSettled, refreshProfile, saveProfile, status, user } =
    useAuth();

  const signedIn = status === 'signedIn' && Boolean(user);

  if (!configured) {
    return (
      <Screen>
        <ScreenHeader back title={t.profile.title} />
        <View style={styles.card}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={26} />
          <Text style={styles.unavailableTitle}>{t.auth.unavailableTitle}</Text>
          <Text style={styles.unavailableBody}>{t.auth.unavailableBody}</Text>
          {configDetail ? <Text style={styles.detail}>{configDetail}</Text> : null}
          <Button
            label={t.auth.notNow}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
            variant="secondary"
          />
        </View>
      </Screen>
    );
  }

  if (!signedIn) {
    return (
      <Screen>
        <ScreenHeader back right={<LanguageSwitcher compact />} title={t.profile.title} />
        <EmptyState
          action={
            <View style={styles.authActions}>
              <Button label={t.auth.signInCta} onPress={() => router.push('/login')} testID="profile-sign-in" />
              <Button
                label={t.auth.signUpCta}
                onPress={() => router.push('/register')}
                testID="profile-sign-up"
                variant="secondary"
              />
            </View>
          }
          body={t.profile.notSignedInBody}
          icon="person-circle-outline"
          title={t.profile.notSignedInTitle}
        />
      </Screen>
    );
  }

  // The row arrives after the session is restored, so the form is keyed on it and
  // only mounts with real values instead of empty inputs that flash and refill.
  if (!profileSettled) {
    return (
      <Screen>
        <ScreenHeader back subtitle={t.profile.subtitle} title={t.profile.title} />
        <View style={styles.card}>
          <Text style={styles.loading}>{t.profile.loading}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back right={<LanguageSwitcher compact />} subtitle={t.profile.subtitle} title={t.profile.title} />

      {profileReason ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{noticeFor(profileReason, t)}</Text>
          <Button label={t.profile.retry} onPress={() => void refreshProfile()} variant="secondary" />
        </View>
      ) : null}

      {/* Key changes when the saved row changes, so the inputs re-seed from the
          database after a successful write rather than keeping two sources of truth. */}
      <ProfileForm
        email={user?.email ?? ''}
        initial={profile}
        key={`${user?.id ?? 'anon'}|${profile?.updatedAt ?? 'new'}`}
        onSave={saveProfile}
        t={t}
      />
    </Screen>
  );
}

type FieldErrors = { displayName?: string; phone?: string; city?: string };

function ProfileForm({
  email,
  initial,
  onSave,
  t,
}: {
  email: string;
  initial: KooProfile | null;
  onSave: (patch: ProfilePatch) => Promise<ProfileResult<KooProfile>>;
  t: Dictionary;
}) {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [savedOn, setSavedOn] = useState<string | null>(null);
  const [saveReason, setSaveReason] = useState<ProfileErrorCode | null>(null);

  const unchanged =
    displayName.trim() === (initial?.displayName ?? '') &&
    phone.trim() === (initial?.phone ?? '') &&
    city.trim() === (initial?.city ?? '');

  const submit = async () => {
    const next: FieldErrors = {};
    const name = displayName.trim();
    if (!name) next.displayName = t.profile.validation.nameRequired;
    else if (name.length > MAX_DISPLAY_NAME_LENGTH) {
      next.displayName = t.profile.validation.tooLong(MAX_DISPLAY_NAME_LENGTH);
    }
    if (phone.trim().length > MAX_PHONE_LENGTH) next.phone = t.profile.validation.tooLong(MAX_PHONE_LENGTH);
    if (city.trim().length > MAX_CITY_LENGTH) next.city = t.profile.validation.tooLong(MAX_CITY_LENGTH);

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    setSaveReason(null);
    const result = await onSave({ displayName, phone, city });
    setBusy(false);
    if (result.ok) setSavedOn(result.data.updatedAt);
    else setSaveReason(result.reason);
  };

  return (
    <View style={styles.card}>
      <Field editable={false} hint={t.profile.emailNote} label={t.profile.emailLabel} value={email} />

      <Field
        autoCapitalize="words"
        error={errors.displayName}
        label={t.profile.nameLabel}
        maxLength={MAX_DISPLAY_NAME_LENGTH}
        onChangeText={(value) => {
          setDisplayName(value);
          setErrors((current) => ({ ...current, displayName: undefined }));
        }}
        placeholder={t.profile.namePlaceholder}
        returnKeyType="next"
        value={displayName}
      />

      <Field
        autoCapitalize="none"
        error={errors.phone}
        keyboardType="phone-pad"
        label={t.profile.phoneLabel}
        maxLength={MAX_PHONE_LENGTH}
        onChangeText={(value) => {
          setPhone(value);
          setErrors((current) => ({ ...current, phone: undefined }));
        }}
        placeholder={t.profile.phonePlaceholder}
        returnKeyType="next"
        value={phone}
      />

      <Field
        autoCapitalize="words"
        error={errors.city}
        label={t.profile.cityLabel}
        maxLength={MAX_CITY_LENGTH}
        onChangeText={(value) => {
          setCity(value);
          setErrors((current) => ({ ...current, city: undefined }));
        }}
        onSubmitEditing={() => void submit()}
        placeholder={t.profile.cityPlaceholder}
        returnKeyType="done"
        value={city}
      />

      {saveReason ? (
        <View style={styles.alert}>
          <Text style={styles.alertText}>{noticeFor(saveReason, t)}</Text>
        </View>
      ) : null}

      {savedOn ? (
        <View style={styles.savedRow}>
          <Ionicons color={colors.success} name="checkmark-circle" size={16} />
          <Text style={styles.savedText}>{t.profile.savedAt(formatDate(savedOn, t.dates))}</Text>
        </View>
      ) : null}

      <Button
        disabled={unchanged}
        label={t.profile.save}
        loading={busy}
        onPress={() => void submit()}
        style={styles.submit}
        testID="profile-save"
      />

      {!initial ? (
        <Text style={styles.detail}>
          {t.profile.noRowYet}
        </Text>
      ) : null}
    </View>
  );
}

/** One reason key, one sentence — shared by the failed read and the failed write. */
function noticeFor(reason: ProfileErrorCode, t: Dictionary): string {
  switch (reason) {
    case 'missingTables':
      return t.profile.missingTables;
    case 'offline':
      return t.profile.offline;
    case 'forbidden':
      return t.profile.forbidden;
    case 'unavailable':
      return t.auth.unavailableBody;
    case 'signedOut':
      return t.profile.notSignedInTitle;
    default:
      return t.profile.failed;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  alert: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  alertText: { ...typography.caption, color: colors.danger, fontSize: 13, lineHeight: 19 },
  authActions: { alignSelf: 'stretch', gap: spacing.sm },
  detail: { ...typography.tiny, lineHeight: 16 },
  loading: { ...typography.body, color: colors.muted },
  notice: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    borderRadius: radius.md,
    borderStyle: 'solid',
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  noticeText: { ...typography.caption, color: '#7C2D12', lineHeight: 19 },
  savedRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  savedText: { ...typography.caption, color: colors.success, fontWeight: '700' },
  submit: { marginTop: spacing.xs },
  unavailableBody: { ...typography.body, lineHeight: 20 },
  unavailableTitle: { ...typography.subtitle },
});
