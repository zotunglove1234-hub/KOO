import { getSellerEmail, getProduct } from '@/data/catalog';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Buyer <-> seller messaging, backed by the two tables in
 * `supabase/koo-chat-schema.sql`.
 *
 * Rules this module lives by:
 * - Nothing here may throw at import time or crash a screen. Supabase can be
 *   unconfigured, offline, or missing the tables (the SQL is run by the user),
 *   so every function returns a result object with a reason key that screens
 *   translate, instead of a raw error string.
 * - Row level security decides what the caller can see; queries are written for
 *   a signed-in user and never pass a service key.
 * - Conversation rows are read then inserted, never upserted, because the schema
 *   grants no UPDATE rights (see the note in the SQL file).
 */

export type ChatConversation = {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string | null;
  sellerEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  /** True when the signed-in user wrote it — drives bubble alignment. */
  fromMe: boolean;
};

export type ConversationSummary = ChatConversation & {
  /** Catalog name of the product the thread is about; falls back to the id. */
  productName: string;
  sellerName: string;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  lastMessageFromSeller: boolean;
  messageCount: number;
  /** Which side of the thread the signed-in user is on. */
  role: 'buyer' | 'seller';
};

export type ChatErrorCode = 'unavailable' | 'missingTables' | 'offline' | 'forbidden' | 'signedOut' | 'unknown';

export type ChatResult<T> = { ok: true; data: T } | { ok: false; reason: ChatErrorCode };

type ConversationRow = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string | null;
  seller_email: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/** Longest message the database accepts; the composer enforces it client-side. */
export const MAX_MESSAGE_LENGTH = 2000;

function chatReason(error: { code?: string; message?: string } | null): ChatErrorCode {
  const code = (error?.code ?? '').toLowerCase();
  const message = (error?.message ?? '').toLowerCase();
  const is = (...needles: string[]) => needles.some((needle) => code.includes(needle) || message.includes(needle));

  if (is('42p01', 'schema cache', 'could not find the table', 'relation')) return 'missingTables';
  if (is('jwt expired', 'pgrst301', 'invalid token')) return 'signedOut';
  if (is('42501', 'row-level security', 'permission denied')) return 'forbidden';
  if (is('fetch failed', 'network', 'timeout', 'unable to contact', 'failed to fetch')) return 'offline';
  return 'unknown';
}

function toReason(err: unknown): ChatErrorCode {
  if (err instanceof Error) return chatReason({ message: err.message });
  return 'unknown';
}

function mapConversation(row: ConversationRow): ChatConversation {
  return {
    id: row.id,
    productId: row.product_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    sellerEmail: row.seller_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Which side of a thread wrote a message.
 *
 * `seller_id` is filled by the schema trigger the moment the seller sends their
 * first message, so once any message exists the column is authoritative. Until
 * then the only other participant a message can come from is the buyer, so
 * "not the buyer" means "the seller".
 */
function senderIsSeller(row: ConversationRow, senderId: string): boolean {
  if (row.seller_id) return senderId === row.seller_id;
  return senderId !== row.buyer_id;
}

/**
 * Every thread the user is part of, newest activity first, each with a preview of
 * its latest message.
 */
export async function listConversations(user: { id: string; email: string }): Promise<ChatResult<ConversationSummary[]>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'unavailable' };
  const email = user.email.toLowerCase();

  try {
    const clauses = [`buyer_id.eq.${user.id}`, `seller_id.eq.${user.id}`];
    if (email) clauses.push(`seller_email.eq.${email}`);

    const { data, error } = await getSupabase()
      .from('koo_conversations')
      .select('*')
      .or(clauses.join(','))
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) return { ok: false, reason: chatReason(error) };
    const rows = (data ?? []) as ConversationRow[];
    if (rows.length === 0) return { ok: true, data: [] };

    // One extra query covers previews for the whole list; threads are short in a
    // demo, so 500 recent messages is enough and avoids an N+1 fetch per row.
    const ids = rows.map((row) => row.id);
    const { data: messageData } = await getSupabase()
      .from('koo_messages')
      .select('*')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })
      .limit(500);

    const latest = new Map<string, MessageRow>();
    const counts = new Map<string, number>();
    for (const message of (messageData ?? []) as MessageRow[]) {
      counts.set(message.conversation_id, (counts.get(message.conversation_id) ?? 0) + 1);
      if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
    }

    return {
      ok: true,
      data: rows.map((row) => {
        const newest = latest.get(row.id);
        const product = getProduct(row.product_id);
        return {
          ...mapConversation(row),
          productName: product?.name ?? row.product_id,
          sellerName: product?.seller ?? row.seller_email,
          lastMessageBody: newest?.body ?? null,
          lastMessageAt: newest?.created_at ?? row.updated_at,
          lastMessageFromSeller: newest ? senderIsSeller(row, newest.sender_id) : false,
          messageCount: counts.get(row.id) ?? 0,
          role: row.buyer_id === user.id ? ('buyer' as const) : ('seller' as const),
        };
      }),
    };
  } catch (err) {
    return { ok: false, reason: toReason(err) };
  }
}

/**
 * Find the thread for (buyer, product, seller) or create it. Called every time a
 * buyer taps "Chat with seller", so re-opening is idempotent.
 */
export async function openConversation(options: {
  userId: string;
  productId: string;
  sellerName: string;
}): Promise<ChatResult<ChatConversation>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'unavailable' };
  const sellerEmail = getSellerEmail(options.sellerName).toLowerCase();
  const supabase = getSupabase();

  try {
    const { data: existing, error: readError } = await supabase
      .from('koo_conversations')
      .select('*')
      .eq('product_id', options.productId)
      .eq('buyer_id', options.userId)
      .eq('seller_email', sellerEmail)
      .maybeSingle();

    if (readError) return { ok: false, reason: chatReason(readError) };
    if (existing) return { ok: true, data: mapConversation(existing as ConversationRow) };

    const { data: created, error: insertError } = await supabase
      .from('koo_conversations')
      .insert({
        product_id: options.productId,
        buyer_id: options.userId,
        seller_email: sellerEmail,
      })
      .select('*')
      .single();

    if (insertError) {
      // 23505 = the unique thread index: another tap won the race, so read it back.
      if (insertError.code === '23505') {
        const { data: winner } = await supabase
          .from('koo_conversations')
          .select('*')
          .eq('product_id', options.productId)
          .eq('buyer_id', options.userId)
          .eq('seller_email', sellerEmail)
          .maybeSingle();
        if (winner) return { ok: true, data: mapConversation(winner as ConversationRow) };
      }
      return { ok: false, reason: chatReason(insertError) };
    }

    return { ok: true, data: mapConversation(created as ConversationRow) };
  } catch (err) {
    return { ok: false, reason: toReason(err) };
  }
}

/** One thread, oldest message first, already flagged left/right for the UI. */
export async function listMessages(
  conversationId: string,
  user: { id: string; email: string }
): Promise<ChatResult<{ conversation: ChatConversation; messages: ChatMessage[] }>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'unavailable' };
  const supabase = getSupabase();

  try {
    const { data: conversationData, error: conversationError } = await supabase
      .from('koo_conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) return { ok: false, reason: chatReason(conversationError) };
    if (!conversationData) return { ok: false, reason: 'forbidden' };

    const conversation = mapConversation(conversationData as ConversationRow);

    const { data: messageData, error: messageError } = await supabase
      .from('koo_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(300);

    if (messageError) return { ok: false, reason: chatReason(messageError) };

    return {
      ok: true,
      data: {
        conversation,
        messages: ((messageData ?? []) as MessageRow[]).map((row) => ({
          id: row.id,
          conversationId: row.conversation_id,
          senderId: row.sender_id,
          body: row.body,
          createdAt: row.created_at,
          fromMe: row.sender_id === user.id,
        })),
      },
    };
  } catch (err) {
    return { ok: false, reason: toReason(err) };
  }
}

export async function sendMessage(options: {
  conversationId: string;
  userId: string;
  body: string;
}): Promise<ChatResult<ChatMessage>> {
  if (!isSupabaseConfigured()) return { ok: false, reason: 'unavailable' };
  const body = options.body.trim();
  if (!body) return { ok: false, reason: 'unknown' };

  try {
    const { data, error } = await getSupabase()
      .from('koo_messages')
      .insert({ conversation_id: options.conversationId, sender_id: options.userId, body })
      .select('*')
      .single();

    if (error) return { ok: false, reason: chatReason(error) };

    const row = data as MessageRow;
    return {
      ok: true,
      data: {
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        body: row.body,
        createdAt: row.created_at,
        fromMe: true,
      },
    };
  } catch (err) {
    return { ok: false, reason: toReason(err) };
  }
}

/** A Realtime row: the snake_case shape of `public.koo_messages`. */
type WireMessage = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };

/**
 * Live delivery for an open thread. Realtime replays rows through the subscriber's
 * own RLS policies, so a client can only be pushed messages it could already read.
 *
 * Returns a cleanup function even when the channel cannot be built: screens call it
 * unconditionally on unmount.
 */
export function subscribeToMessages(conversationId: string, onMessage: (row: WireMessage) => void): () => void {
  if (!isSupabaseConfigured()) return () => undefined;
  const supabase = getSupabase();
  const channel = supabase.channel(`koo-messages-${conversationId}`);

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'koo_messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload: { new: unknown }) => onMessage(payload.new as WireMessage)
  );

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Where to send a user after they sign in because they tapped a chat entry.
 * In-memory on purpose: it only has to survive a screen push inside one app run,
 * and AsyncStorage would resurrect a stale target on the next launch.
 */
let pendingChatTarget: { pathname: '/chat/[id]'; params: { id: string } } | null = null;

export function rememberChatTarget(conversationId: string): void {
  pendingChatTarget = { params: { id: conversationId }, pathname: '/chat/[id]' };
}

export function takeChatTarget(): { pathname: '/chat/[id]'; params: { id: string } } | null {
  const target = pendingChatTarget;
  pendingChatTarget = null;
  return target;
}
