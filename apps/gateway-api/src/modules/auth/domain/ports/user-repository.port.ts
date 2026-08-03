import type { User } from "../user.entity.js";

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(input: {
    email: string;
    username: string;
    passwordHash?: string;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<User>;
  linkGoogleAccount(userId: string, input: { googleId: string; avatarUrl: string | null }): Promise<User>;
}
