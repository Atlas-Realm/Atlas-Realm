import type { ChatMessage } from "@/db/schema";

export type ConversationSummary = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
    readAt: Date | null;
  };
  unreadCount: number;
};

export interface IChatRepository {
  userExists(userId: string): Promise<boolean>;
  listMessagesForUser(userId: string): Promise<ChatMessage[]>;
  getConversation(userId: string, otherUserId: string, limit: number, offset: number): Promise<ChatMessage[]>;
  createMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage>;
  markRead(receiverId: string, senderId: string): Promise<number>;
  getUsersByIds(userIds: string[]): Promise<Array<{ id: string; username: string; displayName: string | null; avatarUrl: string | null }>>;
}

export interface IChatService {
  getConversations(userId: string): Promise<ConversationSummary[]>;
  getConversation(userId: string, otherUserId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  sendMessage(userId: string, receiverId: string, content: string): Promise<ChatMessage>;
  markRead(userId: string, senderId: string): Promise<{ updated: number }>;
}
