import { request } from "../../../shared/api/http-client";
import type { UserProfile } from "../../../shared/types";

export const profileApi = {
  me() {
    return request<UserProfile>("/api/users/me");
  },

  updateMe(input: {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
  }) {
    return request<UserProfile>("/api/users/me", {
      method: "PATCH",
      data: input,
    });
  },
};
