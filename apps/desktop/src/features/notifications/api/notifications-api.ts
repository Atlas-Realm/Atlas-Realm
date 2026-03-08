import { request } from "../../../shared/api/http-client";
import type { NotificationItem } from "../../../shared/types";

export const notificationsApi = {
  list(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return request<NotificationItem[]>(`/api/notifications?${params.toString()}`);
  },

  markRead(id: string) {
    return request<NotificationItem>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
  },

  markAllRead() {
    return request<{ updated: number }>("/api/notifications/read-all", {
      method: "PATCH",
    });
  },
};
