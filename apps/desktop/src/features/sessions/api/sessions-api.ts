import { request } from "../../../shared/api/http-client";
import type { SessionModel, SessionStats } from "../../../shared/types";

export const sessionsApi = {
  active() {
    return request<SessionModel | null>("/api/sessions/active");
  },

  history(limit = 30, offset = 0) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return request<SessionModel[]>(`/api/sessions/history?${params.toString()}`);
  },

  stats(gameId: string) {
    return request<SessionStats>(`/api/sessions/stats/${gameId}`);
  },
};
