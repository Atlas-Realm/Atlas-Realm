import { request } from "../../../shared/api/http-client";
import type { FriendListItem, PendingFriendRequest } from "../../../shared/types";

export const socialApi = {
  listFriends() {
    return request<FriendListItem[]>("/api/social/friends");
  },

  listPendingRequests() {
    return request<PendingFriendRequest[]>("/api/social/friends/requests/pending");
  },
};
