import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { sellerEmails } from '@/data/catalog';
import { useT } from '@/i18n';
import { takeChatTarget } from '@/lib/chat';
import type { AuthErrorReason } from '@/lib/supabase';
import { colors, radius, spacing, typography } from '@/theme';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

type FieldErrors = { email?: string; password?: string };

type Props = {
  mode: 'signIn' | 'signUp';
};

/**
 * One form for both /login and /register.
 *
 * The two flows differ only in which Supabase call they make and which way the
 * link at the bottom points, so they share everything else — including the
 * error mapping, which is the part most likely to drift between copies.
 *
 * Supabase errors arrive as `AuthErrorReason` keys and are looked up in the
 * active dictionary, so a Myanmar user never sees an English API message.
 */
export function AuthForm({ mode }: Props) {
  const t = useT();
  const { configured, configDetail, signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverReason, setServerReason] = useState<AuthErrorReason | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignIn = mode === 'signIn';
  const sampleSellerEmail = Object.values(sellerEmails)[0] ?? '';

  const finish = () => {
    const target = takeChatTarget();
    if (target) {
      router.replace(target);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};
    const trimmed = email.trim();
    if (!trimmed) errors.email = t.auth.validation.emailRequired;
    else if (!EMAIL_PATTERN.test(trimmed)) errors.email = t.auth.validation.emailInvalid;

    if (!password) errors.password = t.auth.validation.passwordRequired;
    else if (!isSignIn && password.length < MIN_PASSWORD_LENGTH) {
      errors.password = t.auth.validation.passwordShort(MIN_PASSWORD_LENGTH);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    setServerReason(null);
    setNotice(null);
    if (!validate()) return;

    setBusy(true);

    if (isSignIn) {
      const result = await signIn(email, password);
      setBusy(false);
      if (!result.ok) {
        setServerReason(result.reason);
        return;
      }
      finish();
      return;
    }

    const result = await signUp(email, password);
    setBusy(false);
    if (!result.ok) {
      setServerReason(result.reason);
      return;
    }
    if (result.needsConfirmation) {
      // "Confirm email" switched on: the account exists but there is no session
      // yet, so the form stays put and explains the next step.
      setNotice(t.auth.errors.emailNotConfirmed);
      return;
    }
    finish();
  };

  if (!configured) {
    return (
      <Screen>
        <ScreenHeader back title={t.auth.loginTitle} />
        <View style={styles.card}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={26} />
          <Text style={styles.unavailableTitle}>{t.auth.unavailableTitle}</Text>
          <Text style={styles.unavailableBody}>{t.auth.unavailableBody}</Text>
          {configDetail ? <Text style={styles.detail}>{configDetail}</Text> : null}
          <Button label={t.auth.notNow} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} variant="secondary" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        back
        right={<LanguageSwitcher compact />}
        subtitle={isSignIn ? t.auth.loginSubtitle : t.auth.registerSubtitle}
        title={isSignIn ? t.auth.loginTitle : t.auth.registerTitle}
      />

      <View style={styles.card}>
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          label={t.auth.emailLabel}
          returnKeyType="next"
          onChangeText={(value) => {
            setEmail(value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
          placeholder={t.auth.emailPlaceholder}
          placeholderTextColor={colors.faint}
          value={email}
          error={fieldErrors.email}
        />

        <Field
          label={t.auth.passwordLabel}
          onChangeText={(value) => {
            setPassword(value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
          onSubmitEditing={() => void submit()}
          placeholder={t.auth.passwordPlaceholder}
          placeholderTextColor={colors.faint}
          returnKeyType="go"
          secureTextEntry
          value={password}
          error={fieldErrors.password}
          maxLength={72}
        />

        {serverReason ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{t.auth.errors[serverReason]}</Text>
          </View>
        ) : null}

        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <Button
          label={isSignIn ? t.auth.signInCta : t.auth.signUpCta}
          loading={busy}
          onPress={() => void submit()}
          style={styles.submit}
          testID={isSignIn ? 'sign-in-submit' : 'sign-up-submit'}
        />

        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => (isSignIn ? router.push('/register') : router.replace('/login'))}
          style={({ pressed }) => [styles.switchRow, pressed && styles.pressed]}>
          <Text style={styles.switchQuestion}>{isSignIn ? t.auth.needAccount : t.auth.haveAccount}</Text>
          <Text style={styles.switchLink}>{isSignIn ? t.auth.signUpCta : t.auth.signInCta}</Text>
        </Pressable>
      </View>

      {!isSignIn ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>{t.auth.sellerHint(sampleSellerEmail)}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  alert: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  alertText: { ...typography.caption, color: colors.danger, fontSize: 13, lineHeight: 19 },
  notice: {
    backgroundColor: '#EFF6FF',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  noticeText: { ...typography.caption, color: colors.inkSoft, fontSize: 13, lineHeight: 19 },
  submit: { marginTop: spacing.xs },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.xs },
  pressed: { opacity: 0.7 },
  switchQuestion: { ...typography.caption },
  switchLink: { ...typography.bodyStrong, color: colors.brandDark },
  hint: {
    marginTop: spacing.lg,
    backgroundColor: '#FFF7ED',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  hintText: { fontSize: 12.5, lineHeight: 18, color: '#7C2D12' },
  unavailableTitle: { ...typography.subtitle },
  unavailableBody: { ...typography.body, lineHeight: 20 },
  detail: { ...typography.tiny, lineHeight: 16 },
});
