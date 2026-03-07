import { NotFoundError } from "@/lib/errors";
import type { IUsersRepository, IUsersService, PublicUserProfile, UserProfileUpdateInput } from "./users.types";

function toPublicProfile(user: {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date;
}): PublicUserProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

export class UsersService implements IUsersService {
  constructor(private readonly repo: IUsersRepository) {}

  async getMe(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) throw new NotFoundError("users.not_found");

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateMe(userId: string, input: UserProfileUpdateInput) {
    const user = await this.repo.updateProfile(userId, input);
    if (!user) throw new NotFoundError("users.not_found");

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      updatedAt: user.updatedAt,
    };
  }

  async search(query: string, limit = 20) {
    const users = await this.repo.searchByQuery(query, limit);
    return users.map((user) => toPublicProfile(user));
  }

  async getPublicProfile(username: string) {
    const user = await this.repo.findByUsername(username);
    if (!user) throw new NotFoundError("users.not_found");
    return toPublicProfile(user);
  }
}
