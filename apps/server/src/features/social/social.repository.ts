import { and, eq, or } from "drizzle-orm";
import type { db as DB } from "@/db";
import { friendRequests, friends, users, type FriendRequest } from "@/db/schema";
import type { FriendProfile, ISocialRepository, PendingFriendRequest } from "./social.types";

export class SocialRepository implements ISocialRepository {
  constructor(private readonly db: typeof DB) {}

  async userExists(userId: string): Promise<boolean> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    return Boolean(user);
  }

  async listFriends(userId: string): Promise<FriendProfile[]> {
    const result = await this.db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        createdAt: friends.createdAt,
      })
      .from(friends)
      .innerJoin(users, eq(friends.friendId, users.id))
      .where(eq(friends.userId, userId));

    return result;
  }

  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    const relation = await this.db.query.friends.findFirst({
      where: and(eq(friends.userId, userId), eq(friends.friendId, otherUserId)),
    });
    return Boolean(relation);
  }

  async findPendingRequestBetween(userId: string, otherUserId: string): Promise<FriendRequest | undefined> {
    return this.db.query.friendRequests.findFirst({
      where: and(
        or(
          and(eq(friendRequests.senderId, userId), eq(friendRequests.receiverId, otherUserId)),
          and(eq(friendRequests.senderId, otherUserId), eq(friendRequests.receiverId, userId)),
        ),
        eq(friendRequests.status, "pending"),
      ),
    });
  }

  async createRequest(senderId: string, receiverId: string): Promise<FriendRequest> {
    const [request] = await this.db
      .insert(friendRequests)
      .values({ senderId, receiverId, status: "pending" })
      .onConflictDoUpdate({
        target: [friendRequests.senderId, friendRequests.receiverId],
        set: { status: "pending", respondedAt: null, createdAt: new Date() },
      })
      .returning();

    return request;
  }

  async listPendingRequests(userId: string): Promise<PendingFriendRequest[]> {
    const result = await this.db
      .select({
        id: friendRequests.id,
        senderId: friendRequests.senderId,
        receiverId: friendRequests.receiverId,
        status: friendRequests.status,
        createdAt: friendRequests.createdAt,
        senderUsername: users.username,
        senderDisplayName: users.displayName,
        senderAvatarUrl: users.avatarUrl,
        senderCreatedAt: users.createdAt,
      })
      .from(friendRequests)
      .innerJoin(users, eq(friendRequests.senderId, users.id))
      .where(and(eq(friendRequests.receiverId, userId), eq(friendRequests.status, "pending")));

    return result.map((item) => ({
      id: item.id,
      senderId: item.senderId,
      receiverId: item.receiverId,
      status: item.status,
      createdAt: item.createdAt,
      sender: {
        id: item.senderId,
        username: item.senderUsername,
        displayName: item.senderDisplayName,
        avatarUrl: item.senderAvatarUrl,
        createdAt: item.senderCreatedAt,
      },
    }));
  }

  async findRequestById(requestId: string): Promise<FriendRequest | undefined> {
    return this.db.query.friendRequests.findFirst({ where: eq(friendRequests.id, requestId) });
  }

  async updateRequestStatus(
    requestId: string,
    status: "accepted" | "rejected",
    respondedAt: Date,
  ): Promise<FriendRequest | undefined> {
    const [request] = await this.db
      .update(friendRequests)
      .set({ status, respondedAt })
      .where(eq(friendRequests.id, requestId))
      .returning();

    return request;
  }

  async addFriendPair(userId: string, friendId: string): Promise<void> {
    await this.db
      .insert(friends)
      .values([
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ])
      .onConflictDoNothing();
  }

  async removeFriendPair(userId: string, friendId: string): Promise<void> {
    await this.db
      .delete(friends)
      .where(
        or(
          and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userId)),
        ),
      );
  }
}
