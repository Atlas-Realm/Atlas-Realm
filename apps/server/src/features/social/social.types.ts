import type { FriendRequest } from "@/db/schema";

export type FriendProfile = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export type PendingFriendRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequest["status"];
  createdAt: Date;
  sender: FriendProfile;
};

export interface ISocialRepository {
  userExists(userId: string): Promise<boolean>;
  listFriends(userId: string): Promise<FriendProfile[]>;
  areFriends(userId: string, otherUserId: string): Promise<boolean>;
  findPendingRequestBetween(userId: string, otherUserId: string): Promise<FriendRequest | undefined>;
  createRequest(senderId: string, receiverId: string): Promise<FriendRequest>;
  listPendingRequests(userId: string): Promise<PendingFriendRequest[]>;
  findRequestById(requestId: string): Promise<FriendRequest | undefined>;
  updateRequestStatus(
    requestId: string,
    status: "accepted" | "rejected",
    respondedAt: Date,
  ): Promise<FriendRequest | undefined>;
  addFriendPair(userId: string, friendId: string): Promise<void>;
  removeFriendPair(userId: string, friendId: string): Promise<void>;
}

export interface ISocialService {
  getFriends(userId: string): Promise<FriendProfile[]>;
  sendFriendRequest(userId: string, receiverId: string): Promise<{ requestId: string }>;
  getPendingRequests(userId: string): Promise<PendingFriendRequest[]>;
  acceptRequest(userId: string, requestId: string): Promise<{ accepted: true; friendId: string }>;
  rejectRequest(userId: string, requestId: string): Promise<{ rejected: true }>;
  removeFriend(userId: string, friendId: string): Promise<{ removed: true }>;
}
