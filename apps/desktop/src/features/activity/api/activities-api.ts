import { request } from "../../../shared/api/http-client";
import type { ActivityRecord } from "../../../shared/types";

export const activitiesApi = {
  feed(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return request<ActivityRecord[]>(`/api/activities/feed?${params.toString()}`);
  },

  me(limit = 20, offset = 0) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return request<ActivityRecord[]>(`/api/activities/me?${params.toString()}`);
  },
};
