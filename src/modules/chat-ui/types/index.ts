export type Participant = {
  id: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  externalId?: string;
  metadata?: Record<string, unknown>;
  user?: {
    id: string;
    username: string;
    phone?: string;
    email?: string;
    roles: string[];
  };
};

export type ConversationDirection = 'inbound' | 'outbound';

export type ConversationListItem = {
  id: string;
  questionnaireId: string;
  channelId: string;
  currentQuestionId?: string;
  status: string;
  state: string;
  startedAt?: string;
  endedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  questionnaire?: { id: string; name: string } | null;
  channel?: { id: string; name: string } | null;
  currentQuestion?: { id: string; text: string } | null;
  /** Alias for backward compat — same as id */
  conversationId?: string;
};

export type ConversationInboxItem = ConversationListItem;

export type ConversationInboxResponse = {
  items: ConversationListItem[];
  meta: { total: number; page: number; limit: number };
};

export type ExchangeMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  direction: ConversationDirection;
  text: string;
  questionId?: string;
  attribute?: string;
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  optimistic?: boolean;
  /** Message belongs to a conversation that has not been created yet. */
  orphan?: boolean;
  /** Set on conversation.message.created to link the pending thread to the real id. */
  pendingConversationId?: string;
};

export type ExchangeMessagesResponse = {
  items: ExchangeMessage[];
  nextCursor?: string;
};

export type ChatMode = 'admin' | 'user';

export type InboxMode = 'admin' | 'all' | 'individual' | 'group';

export type InboxStatus = 'ACTIVE' | 'COMPLETED' | 'STOPPED' | 'CANCELLED';

export type ParticipantRole = 'USER' | 'PATIENT' | 'DOCTOR' | 'NURSE' | 'BOT' | 'AGENT';

export type ConversationProjection = {
  _id: string;
  conversationId: string;
  participant: Participant;
  channelId: string;
  role: ParticipantRole;
  type: string;
  isPrimary: boolean;
  active: boolean;
  lastMessageAt: string;
};
