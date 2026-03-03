import type { User, NewUser } from "@/db/schema";

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findByUsername(username: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  create(data: NewUser): Promise<User>;
}

export interface IAuthService {
  register(
    email: string,
    username: string,
    password: string,
  ): Promise<{
    user: { id: string; email: string; username: string };
    tokens: { accessToken: string; refreshToken: string };
  }>;
  login(
    email: string,
    password: string,
  ): Promise<{
    user: { id: string; email: string; username: string };
    tokens: { accessToken: string; refreshToken: string };
  }>;
  refresh(refreshToken: string): Promise<{
    tokens: { accessToken: string; refreshToken: string };
  }>;
  logout(userId: string, refreshJti: string): Promise<void>;
}
