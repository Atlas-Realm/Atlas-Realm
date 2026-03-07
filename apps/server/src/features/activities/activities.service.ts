import type { IActivitiesRepository, IActivitiesService } from "./activities.types";

export class ActivitiesService implements IActivitiesService {
  constructor(private readonly repo: IActivitiesRepository) {}

  async publish(input: {
    actorId: string;
    type: string;
    payload?: Record<string, unknown> | null;
    visibility?: "public" | "friends" | "private";
  }) {
    return this.repo.create({
      actorId: input.actorId,
      type: input.type,
      payload: input.payload ?? null,
      visibility: input.visibility ?? "friends",
    });
  }

  async getFeed(userId: string, limit = 50, offset = 0) {
    return this.repo.findFeedByUser(userId, limit, offset);
  }

  async getMine(userId: string, limit = 50, offset = 0) {
    return this.repo.findByActor(userId, limit, offset);
  }

  async getByUser(userId: string, limit = 50, offset = 0) {
    return this.repo.findByActor(userId, limit, offset);
  }
}
