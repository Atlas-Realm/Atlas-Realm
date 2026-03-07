import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import type { IActivityPublisher } from "@/features/activities/activities.types";
import type { INotificationPublisher } from "@/features/notifications/notifications.types";
import type { ISocialRepository, ISocialService } from "./social.types";

export class SocialService implements ISocialService {
  constructor(
    private readonly repo: ISocialRepository,
    private readonly notifications: INotificationPublisher,
    private readonly activities: IActivityPublisher,
  ) {}

  async getFriends(userId: string) {
    return this.repo.listFriends(userId);
  }

  async sendFriendRequest(userId: string, receiverId: string) {
    if (userId === receiverId) throw new BadRequestError("social.cannot_friend_self");

    const [senderExists, receiverExists, alreadyFriends, existingRequest] = await Promise.all([
      this.repo.userExists(userId),
      this.repo.userExists(receiverId),
      this.repo.areFriends(userId, receiverId),
      this.repo.findPendingRequestBetween(userId, receiverId),
    ]);

    if (!senderExists || !receiverExists) throw new NotFoundError("users.not_found");
    if (alreadyFriends) throw new ConflictError("social.already_friends");
    if (existingRequest) throw new ConflictError("social.request_already_exists");

    const request = await this.repo.createRequest(userId, receiverId);

    await this.notifications.notify({
      userId: receiverId,
      type: "friend_request",
      title: "New friend request",
      message: "You received a new friend request",
      data: { requestId: request.id, senderId: userId },
    });

    return { requestId: request.id };
  }

  async getPendingRequests(userId: string) {
    return this.repo.listPendingRequests(userId);
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.repo.findRequestById(requestId);
    if (!request) throw new NotFoundError("social.request_not_found");
    if (request.receiverId !== userId) throw new ForbiddenError("social.request_forbidden");
    if (request.status !== "pending") throw new ConflictError("social.request_not_pending");

    await this.repo.updateRequestStatus(requestId, "accepted", new Date());
    await this.repo.addFriendPair(request.senderId, request.receiverId);

    await Promise.all([
      this.notifications.notify({
        userId: request.senderId,
        type: "friend_accept",
        title: "Friend request accepted",
        message: "Your friend request was accepted",
        data: { userId: request.receiverId },
      }),
      this.activities.publish({
        actorId: request.receiverId,
        type: "social.friend.accepted",
        payload: { friendId: request.senderId },
      }),
    ]);

    return { accepted: true as const, friendId: request.senderId };
  }

  async rejectRequest(userId: string, requestId: string) {
    const request = await this.repo.findRequestById(requestId);
    if (!request) throw new NotFoundError("social.request_not_found");
    if (request.receiverId !== userId) throw new ForbiddenError("social.request_forbidden");
    if (request.status !== "pending") throw new ConflictError("social.request_not_pending");

    await this.repo.updateRequestStatus(requestId, "rejected", new Date());
    return { rejected: true as const };
  }

  async removeFriend(userId: string, friendId: string) {
    if (!(await this.repo.areFriends(userId, friendId))) {
      throw new NotFoundError("social.friend_not_found");
    }

    await this.repo.removeFriendPair(userId, friendId);
    await this.activities.publish({
      actorId: userId,
      type: "social.friend.removed",
      payload: { friendId },
      visibility: "private",
    });

    return { removed: true as const };
  }
}
