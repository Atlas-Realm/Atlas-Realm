import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import type { db as DB } from "@/db";
import { chatMessages, users, type ChatMessage } from "@/db/schema";
import type { IChatRepository } from "./chat.types";

export class ChatRepository implements IChatRepository {
  constructor(private readonly db: typeof DB) {}

  async userExists(userId: string): Promise<boolean> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    return Boolean(user);
  }

  async listMessagesForUser(userId: string): Promise<ChatMessage[]> {
    return this.db.query.chatMessages.findMany({
      where: or(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, userId)),
      orderBy: [desc(chatMessages.createdAt)],
      limit: 500,
    });
  }

  async getConversation(userId: string, otherUserId: string, limit: number, offset: number): Promise<ChatMessage[]> {
    return this.db.query.chatMessages.findMany({
      where: or(
        and(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, otherUserId)),
        and(eq(chatMessages.senderId, otherUserId), eq(chatMessages.receiverId, userId)),
      ),
      orderBy: [asc(chatMessages.createdAt)],
      limit,
      offset,
    });
  }

  async createMessage(senderId: string, receiverId: string, content: string): Promise<ChatMessage> {
    const [message] = await this.db
      .insert(chatMessages)
      .values({ senderId, receiverId, content })
      .returning();

    return message;
  }

  async markRead(receiverId: string, senderId: string): Promise<number> {
    const updated = await this.db
      .update(chatMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(chatMessages.receiverId, receiverId),
          eq(chatMessages.senderId, senderId),
          isNull(chatMessages.readAt),
        ),
      )
      .returning({ id: chatMessages.id });

    return updated.length;
  }

  async getUsersByIds(userIds: string[]) {
    if (userIds.length === 0) return [];
    return this.db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, userIds));
  }
}
