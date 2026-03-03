import { eq } from "drizzle-orm";
import type { db as DB } from "@/db";
import { users, type NewUser, type User } from "@/db/schema";
import type { IAuthRepository } from "./auth.types";

export class AuthRepository implements IAuthRepository {
  constructor(private readonly db: typeof DB) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.email, email) });
  }

  async findByUsername(username: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.username, username) });
  }

  async findById(id: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async create(data: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }
}
