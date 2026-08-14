export type Participant = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
};

export type ConversationDirection = 'inbound' | 'outbound';

export type ConversationInboxItem = {
  conversationId: string;
  channelId: string;
  status: string;
  state: string;
  participant: Participant;
  moderator?: Participant;
  lastMessage?: {
    id?: string;
    text: string;
    direction: ConversationDirection;
    createdAt: string;
    questionAttribute?: string;
  };
  unreadCount?: number;
  lastMessageAt?: string;
  currentQuestion?: {
    id?: string;
    attribute?: string;
    text?: string;
  };
  projection: {
    id: string;
    isPrimary: boolean;
    active: boolean;
    priority: number;
    externalThreadId?: string;
  };
};

export type ConversationInboxResponse = {
  items: ConversationInboxItem[];
  nextCursor?: string;
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
