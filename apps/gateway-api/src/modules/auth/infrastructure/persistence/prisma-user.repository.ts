import { prisma } from "@transcribemind/database";
import type { UserRepositoryPort } from "../../domain/ports/user-repository.port.js";
import type { User } from "../../domain/user.entity.js";

export class PrismaUserRepository implements UserRepositoryPort {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  async create(input: {
    email: string;
    username: string;
    passwordHash?: string;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash: input.passwordHash,
        googleId: input.googleId,
        avatarUrl: input.avatarUrl,
      },
    });
  }

  async linkGoogleAccount(userId: string, input: { googleId: string; avatarUrl: string | null }): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { googleId: input.googleId, avatarUrl: input.avatarUrl ?? undefined },
    });
  }
}
