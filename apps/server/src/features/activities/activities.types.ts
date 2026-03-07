import type { Activity, NewActivity } from "@/db/schema";

export type ActivityVisibility = Activity["visibility"];

export interface IActivitiesRepository {
  create(data: NewActivity): Promise<Activity>;
  findByActor(actorId: string, limit: number, offset: number): Promise<Activity[]>;
  findFeedByUser(userId: string, limit: number, offset: number): Promise<Activity[]>;
}

export interface IActivityPublisher {
  publish(input: {
    actorId: string;
    type: string;
    payload?: Record<string, unknown> | null;
    visibility?: ActivityVisibility;
  }): Promise<Activity>;
}

export interface IActivitiesService extends IActivityPublisher {
  getFeed(userId: string, limit?: number, offset?: number): Promise<Activity[]>;
  getMine(userId: string, limit?: number, offset?: number): Promise<Activity[]>;
  getByUser(userId: string, limit?: number, offset?: number): Promise<Activity[]>;
}
