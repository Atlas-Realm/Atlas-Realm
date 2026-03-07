import { BadRequestError, NotFoundError } from "@/lib/errors";
import type { INotificationPublisher } from "@/features/notifications/notifications.types";
import type { ConversationSummary, IChatRepository, IChatService } from "./chat.types";

export class ChatService implements IChatService {
  constructor(
    private readonly repo: IChatRepository,
    private readonly notifications: INotificationPublisher,
  ) {}

  async getConversations(userId: string): Promise<ConversationSummary[]> {
    const messages = await this.repo.listMessagesForUser(userId);

    const byPartner = new Map<string, { lastMessageIndex: number; unreadCount: number }>();

    messages.forEach((message, index) => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const entry = byPartner.get(partnerId);
      const unread = message.receiverId === userId && !message.readAt ? 1 : 0;

      if (!entry) {
        byPartner.set(partnerId, { lastMessageIndex: index, unreadCount: unread });
        return;
      }

      entry.unreadCount += unread;
    });

    const partnerIds = [...byPartner.keys()];
    const partners = await this.repo.getUsersByIds(partnerIds);
    const partnerMap = new Map(partners.map((user) => [user.id, user]));

    const conversations: ConversationSummary[] = [];
    for (const [partnerId, info] of byPartner.entries()) {
      const partner = partnerMap.get(partnerId);
      if (!partner) continue;

      const message = messages[info.lastMessageIndex];
      conversations.push({
        user: partner,
        lastMessage: {
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          createdAt: message.createdAt,
          readAt: message.readAt,
        },
        unreadCount: info.unreadCount,
      });
    }

    conversations.sort(
      (a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
    );

    return conversations;
  }

  async getConversation(userId: string, otherUserId: string, limit = 100, offset = 0) {
    if (!(await this.repo.userExists(otherUserId))) throw new NotFoundError("users.not_found");
    return this.repo.getConversation(userId, otherUserId, limit, offset);
  }

  async sendMessage(userId: string, receiverId: string, content: string) {
    if (userId === receiverId) throw new BadRequestError("chat.self_message_forbidden");
    if (!(await this.repo.userExists(receiverId))) throw new NotFoundError("users.not_found");

    const message = await this.repo.createMessage(userId, receiverId, content);

    await this.notifications.notify({
      userId: receiverId,
      type: "chat_message",
      title: "New message",
      message: "You received a new chat message",
      data: { senderId: userId, messageId: message.id },
    });

    return message;
  }

  async markRead(userId: string, senderId: string) {
    if (!(await this.repo.userExists(senderId))) throw new NotFoundError("users.not_found");
    const updated = await this.repo.markRead(userId, senderId);
    return { updated };
  }
}
