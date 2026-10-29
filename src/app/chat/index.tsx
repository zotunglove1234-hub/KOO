import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/Filters';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useT, type Dictionary } from '@/i18n';
import { listConversations, type ChatErrorCode, type ConversationSummary } from '@/lib/chat';
import { formatClock } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'ready'; conversations: ConversationSummary[] }
  | { phase: 'error'; reason: ChatErrorCode };

/**
 * Which dictionary line explains a failure. Missing tables and an unconfigured
 * build both mean "messaging cannot work here", so they read the same; anything
 * network-shaped invites a retry.
 */
function errorBody(t: Dictionary, reason: ChatErrorCode): string {
  if (reason === 'unavailable' || reason === 'missingTables') return t.chat.unavailableBody;
  return t.chat.failedToLoad;
}

export default function ChatListScreen() {
  const t = useT();
  const { configured, status, user } = useAuth();
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listConversations(user).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { phase: 'ready', conversations: result.data } : { phase: 'error', reason: result.reason });
      setRefreshing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const refresh = () => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  };

  if (!configured) {
    return (
      <Screen scroll={false}>
        <ScreenHeader back title={t.chat.title} />
        <EmptyState
          action={<Button label={t.common.goBack} onPress={() => router.back()} variant="secondary" />}
          body={t.chat.unavailableBody}
          icon="cloud-offline-outline"
          title={t.chat.unavailableTitle}
        />
      </Screen>
    );
  }

  if (status !== 'signedIn' || !user) {
    return (
      <Screen scroll={false}>
        <ScreenHeader back title={t.chat.title} />
        <EmptyState
          action={<Button label={t.auth.signInCta} onPress={() => router.push('/login')} />}
          body={t.chat.signInBody}
          icon="chatbubbles-outline"
          title={t.chat.signInTitle}
        />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
      <ScreenHeader back subtitle={t.chat.threadCount(state.phase === 'ready' ? state.conversations.length : 0)} title={t.chat.title} />

      {state.phase === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>{t.chat.loading}</Text>
        </View>
      ) : null}

      {state.phase === 'error' ? (
        <EmptyState
          action={<Button label={t.chat.refresh} onPress={refresh} variant="secondary" />}
          body={errorBody(t, state.reason)}
          icon="alert-circle-outline"
          title={t.chat.failedToLoad}
        />
      ) : null}

      {state.phase === 'ready' && state.conversations.length === 0 ? (
        <EmptyState
          action={<Button label={t.cart.startShopping} onPress={() => router.replace('/search')} />}
          body={t.chat.emptyBody}
          icon="chatbubbles-outline"
          title={t.chat.emptyTitle}
        />
      ) : null}

      {state.phase === 'ready'
        ? state.conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              onPress={() => router.push({ params: { id: conversation.id }, pathname: '/chat/[id]' })}
            />
          ))
        : null}
    </Screen>
  );
}

function ConversationRow({ conversation, onPress }: { conversation: ConversationSummary; onPress: () => void }) {
  const t = useT();
  const viewerIsSeller = conversation.role === 'seller';

  // The buyer's inbox is indexed by who they talked to; a seller's inbox is
  // indexed by which product the question was about.
  const title = viewerIsSeller ? conversation.productName : conversation.sellerName;

  const mine = conversation.lastMessageFromSeller === viewerIsSeller;
  const preview = conversation.lastMessageBody
    ? `${mine ? t.chat.you : t.chat.seller}${t.common.bullet}${conversation.lastMessageBody}`
    : t.chat.noMessagesYet;

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(11,17,32,0.06)' }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.rowIcon}>
        <Ionicons color={colors.brand} name={viewerIsSeller ? 'chatbox-ellipses-outline' : 'storefront-outline'} size={20} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {title}
          </Text>
          {conversation.lastMessageAt ? <Text style={styles.rowTime}>{formatClock(conversation.lastMessageAt)}</Text> : null}
        </View>
        <Text numberOfLines={2} style={styles.rowPreview}>
          {preview}
        </Text>
        <Text numberOfLines={1} style={styles.rowMeta}>
          {viewerIsSeller ? conversation.productName : conversation.sellerName}
        </Text>
      </View>
      <Ionicons color={colors.faint} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  loadingText: { ...typography.caption },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pressed: { opacity: 0.85 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: '#FFF1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { ...typography.bodyStrong, flex: 1 },
  rowTime: { ...typography.tiny },
  rowPreview: { ...typography.caption, color: colors.inkSoft, lineHeight: 17 },
  rowMeta: { ...typography.tiny },
});
