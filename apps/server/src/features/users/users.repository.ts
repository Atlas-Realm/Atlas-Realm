import { ilike, or, eq } from "drizzle-orm";
import type { db as DB } from "@/db";
import { users, type User } from "@/db/schema";
import type { IUsersRepository, UserProfileUpdateInput } from "./users.types";

export class UsersRepository implements IUsersRepository {
  constructor(private readonly db: typeof DB) {}

  async findById(id: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async updateProfile(userId: string, input: UserProfileUpdateInput): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set({
        displayName: input.displayName,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user;
  }

  async searchByQuery(query: string, limit: number): Promise<User[]> {
    const normalized = `%${query}%`;
    return this.db.query.users.findMany({
      where: or(ilike(users.username, normalized), ilike(users.displayName, normalized)),
      limit,
    });
  }
}
