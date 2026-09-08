import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@transcribemind/database", () => ({ prisma: prismaMock }));

const { PrismaUserRepository } = await import("./prisma-user.repository.js");

const userRecord = {
  id: "u1",
  email: "a@b.com",
  username: "auser",
  passwordHash: "hashed",
  googleId: null,
  avatarUrl: null,
  createdAt: new Date("2026-01-01"),
};

describe("PrismaUserRepository", () => {
  it("findByEmail queries by email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRecord);
    const repository = new PrismaUserRepository();

    const user = await repository.findByEmail("a@b.com");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: "a@b.com" } });
    expect(user?.username).toBe("auser");
  });

  it("findById returns null when no record is found", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const repository = new PrismaUserRepository();

    expect(await repository.findById("missing")).toBeNull();
  });

  it("findByUsername queries by username", async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRecord);
    const repository = new PrismaUserRepository();

    await repository.findByUsername("auser");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { username: "auser" } });
  });

  it("findByGoogleId queries by googleId", async () => {
    prismaMock.user.findUnique.mockResolvedValue(userRecord);
    const repository = new PrismaUserRepository();

    await repository.findByGoogleId("g1");

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { googleId: "g1" } });
  });

  it("create passes through the given fields", async () => {
    prismaMock.user.create.mockResolvedValue(userRecord);
    const repository = new PrismaUserRepository();

    await repository.create({ email: "a@b.com", username: "auser", passwordHash: "hashed" });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { email: "a@b.com", username: "auser", passwordHash: "hashed", googleId: undefined, avatarUrl: undefined },
    });
  });

  it("linkGoogleAccount updates googleId and avatarUrl", async () => {
    prismaMock.user.update.mockResolvedValue(userRecord);
    const repository = new PrismaUserRepository();

    await repository.linkGoogleAccount("u1", { googleId: "g1", avatarUrl: "https://a.png" });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { googleId: "g1", avatarUrl: "https://a.png" },
    });
  });

  it("linkGoogleAccount falls back to undefined avatarUrl when null", async () => {
    prismaMock.user.update.mockResolvedValue(userRecord);
    const repository = new PrismaUserRepository();

    await repository.linkGoogleAccount("u1", { googleId: "g1", avatarUrl: null });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { googleId: "g1", avatarUrl: undefined },
    });
  });
});
