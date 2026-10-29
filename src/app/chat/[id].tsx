import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/Filters';
import { Screen, ScreenHeader } from '@/components/Screen';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/i18n';
import type { DateCopy } from '@/i18n';
import { getProduct } from '@/data/catalog';
import {
  listMessages,
  rememberChatTarget,
  sendMessage,
  subscribeToMessages,
  MAX_MESSAGE_LENGTH,
  type ChatMessage,
} from '@/lib/chat';
import { dayKey, formatClock, formatDate } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';

/** Rows as they arrive from Realtime: snake_case Postgres columns. */
type WireMessage = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };

export default function ChatThreadScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sellerName, setSellerName] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id || !user) return;
    let cancelled = false;
    listMessages(id, user).then((result) => {
      if (cancelled) return;
      setRefreshing(false);
      if (!result.ok) {
        setFailed(true);
        setLoading(false);
        return;
      }
      const product = getProduct(result.data.conversation.productId);
      setSellerName(product?.seller ?? result.data.conversation.sellerEmail);
      setProductName(product?.name ?? result.data.conversation.productId);
      setMessages(result.data.messages);
      setFailed(false);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, user, reloadKey]);

  const refresh = () => {
    setRefreshing(true);
    setReloadKey((key) => key + 1);
  };

  /**
   * Live delivery for this thread. Realtime replays rows through the subscriber's
   * RLS policies, so only messages this account can read arrive, and ids are
   * deduped because the sender also appends its own message optimistically.
   */
  useEffect(() => {
    if (!id || !user) return;
    return subscribeToMessages(id, (row: WireMessage) => {
      setMessages((current) =>
        current.some((message) => message.id === row.id)
          ? current
          : [
              ...current,
              {
                id: row.id,
                conversationId: row.conversation_id,
                senderId: row.sender_id,
                body: row.body,
                createdAt: row.created_at,
                fromMe: row.sender_id === user.id,
              },
            ]
      );
    });
  }, [id, user]);

  const sorted = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
    [messages]
  );

  // Oldest-first data handed to an `inverted` list puts the newest message at the
  // bottom of the screen with no scroll management, and the index above each
  // message in that reversed array is the chronologically previous one.
  const reversed = useMemo(() => [...sorted].reverse(), [sorted]);

  const dayStarts = useMemo(() => {
    const seen = new Set<string>();
    const starts = new Set<string>();
    for (const message of sorted) {
      const day = dayKey(message.createdAt);
      if (!seen.has(day)) {
        seen.add(day);
        starts.add(message.id);
      }
    }
    return starts;
  }, [sorted]);

  const send = async () => {
    const body = draft.trim();
    if (!id || !user || !body || sending) return;
    setSending(true);
    setSendFailed(false);
    const result = await sendMessage({ conversationId: id, userId: user.id, body });
    setSending(false);
    if (!result.ok) {
      // A token that expired mid-thread: remember where we were so the login
      // screen can bring the user straight back after they sign in again.
      if (result.reason === 'signedOut') {
        rememberChatTarget(id);
        router.push('/login');
        return;
      }
      setSendFailed(true);
      return;
    }
    setDraft('');
    setMessages((current) => (current.some((m) => m.id === result.data.id) ? current : [...current, result.data]));
  };

  if (status !== 'checking' && !user) {
    return (
      <Screen scroll={false}>
        <ScreenHeader back title={productName ?? t.chat.title} />
        <EmptyState
          action={
            <Button
              label={t.auth.signInCta}
              onPress={() => {
                if (id) rememberChatTarget(id);
                router.push('/login');
              }}
            />
          }
          body={t.chat.signInBody}
          icon="chatbubbles-outline"
          title={t.chat.signInTitle}
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <ScreenHeader back title={t.chat.title} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>{t.chat.loading}</Text>
        </View>
      </Screen>
    );
  }

  if (failed) {
    return (
      <Screen scroll={false}>
        <ScreenHeader back title={t.chat.title} />
        <EmptyState
          action={<Button label={t.chat.refresh} onPress={refresh} variant="secondary" />}
          body={t.chat.failedToLoad}
          icon="alert-circle-outline"
          title={t.chat.title}
        />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
      <Screen
        scroll={false}
        footer={
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel={t.chat.inputPlaceholder}
              maxLength={MAX_MESSAGE_LENGTH}
              multiline
              onChangeText={(value) => {
                setDraft(value);
                setSendFailed(false);
              }}
              placeholder={t.chat.inputPlaceholder}
              placeholderTextColor={colors.faint}
              style={styles.input}
              value={draft}
            />
            <Pressable
              accessibilityLabel={t.chat.sendA11y}
              accessibilityRole="button"
              android_ripple={{ color: 'rgba(255,255,255,0.24)' }}
              disabled={!draft.trim() || sending}
              hitSlop={4}
              onPress={() => void send()}
              style={({ pressed }) => [
                styles.sendButton,
                (!draft.trim() || sending) && styles.sendDisabled,
                pressed && styles.pressed,
              ]}>
              {sending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons color={colors.white} name="arrow-up" size={22} />
              )}
            </Pressable>
          </View>
        }
      >
        <ScreenHeader
          back
          right={
            <Pressable accessibilityLabel={t.chat.refresh} hitSlop={10} onPress={refresh}>
              <Ionicons color={colors.muted} name="refresh" size={22} />
            </Pressable>
          }
          subtitle={sellerName ?? undefined}
          title={productName ?? t.chat.title}
        />

        {sendFailed ? <Text style={styles.sendError}>{t.chat.failedToSend}</Text> : null}

        <FlatList
          contentContainerStyle={styles.listContent}
          data={reversed}
          inverted
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.firstMessage}>{t.chat.noMessagesYet}</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />
          }
          renderItem={({ item }) => (
            <MessageBubble
              dates={t.dates}
              day={dayKey(item.createdAt)}
              showDay={dayStarts.has(item.id)}
              message={item}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  showDay,
  day,
  dates,
}: {
  message: ChatMessage;
  showDay: boolean;
  day: string;
  dates: DateCopy;
}) {
  const t = useT();
  return (
    <View style={styles.bubbleRow}>
      {showDay ? <Text style={styles.dayDivider}>{formatDate(day, dates)}</Text> : null}
      <View style={[styles.bubbleColumn, message.fromMe ? styles.alignEnd : styles.alignStart]}>
        <Text style={styles.bubbleSide}>{message.fromMe ? t.chat.you : t.chat.seller}</Text>
        <View style={[styles.bubble, message.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, message.fromMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>{message.body}</Text>
        </View>
        <Text style={styles.bubbleTime}>{formatClock(message.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  loadingText: { ...typography.caption },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, flexGrow: 1 },
  firstMessage: { ...typography.caption, textAlign: 'center', marginTop: spacing.xxl },
  sendError: { ...typography.caption, color: colors.danger, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  bubbleRow: { marginBottom: spacing.md },
  bubbleColumn: { maxWidth: '86%', gap: 3 },
  alignEnd: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  alignStart: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubbleSide: { ...typography.tiny, paddingHorizontal: 2 },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMe: { backgroundColor: colors.brand },
  bubbleThem: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: colors.white },
  bubbleTextThem: { color: colors.ink },
  bubbleTime: { ...typography.tiny, paddingHorizontal: 2 },
  dayDivider: { ...typography.tiny, textAlign: 'center', marginBottom: spacing.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.ink,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
});
