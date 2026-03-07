import type { NewUser, User } from "@/db/schema";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findByUsername(username: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  create(data: NewUser): Promise<User>;
}

export interface IAuthService {
  register(email: string, username: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }>;
  login(email: string, password: string): Promise<{ user: AuthUser; tokens: AuthTokens }>;
  refresh(refreshToken: string): Promise<{ tokens: AuthTokens }>;
  logout(userId: string, refreshToken: string): Promise<void>;
  me(userId: string): Promise<AuthUser>;
  getOAuthUrl(provider: "google" | "discord"): Promise<{ provider: "google" | "discord"; url: string | null }>;
}
