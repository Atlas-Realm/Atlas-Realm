import type { User } from "@/db/schema";

export type UserProfileUpdateInput = {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
};

export type PublicUserProfile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export interface IUsersRepository {
  findById(id: string): Promise<User | undefined>;
  findByUsername(username: string): Promise<User | undefined>;
  updateProfile(userId: string, input: UserProfileUpdateInput): Promise<User | undefined>;
  searchByQuery(query: string, limit: number): Promise<User[]>;
}

export interface IUsersService {
  getMe(userId: string): Promise<{
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  updateMe(userId: string, input: UserProfileUpdateInput): Promise<{
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    updatedAt: Date;
  }>;
  search(query: string, limit?: number): Promise<PublicUserProfile[]>;
  getPublicProfile(username: string): Promise<PublicUserProfile>;
}
