import { describe, expect, it, vi } from "vitest";
import { LoginUserUseCase } from "./login-user.use-case.js";
import { mockUserRepository, mockPasswordHasher, mockTokenIssuer } from "../../../test/mockAuthPorts.js";
import type { User } from "../domain/user.entity.js";

const existingUser: User = {
  id: "u1",
  email: "a@b.com",
  username: "auser",
  passwordHash: "hashed",
  googleId: null,
  avatarUrl: null,
  createdAt: new Date(),
};

describe("LoginUserUseCase", () => {
  it("issues a token when the credentials are valid", async () => {
    const userRepository = mockUserRepository({ findByEmail: vi.fn().mockResolvedValue(existingUser) });
    const passwordHasher = mockPasswordHasher({ compare: vi.fn().mockResolvedValue(true) });
    const tokenIssuer = mockTokenIssuer();
    const useCase = new LoginUserUseCase(userRepository, passwordHasher, tokenIssuer);

    const result = await useCase.execute({ email: "a@b.com", password: "password1" });

    expect(passwordHasher.compare).toHaveBeenCalledWith("password1", "hashed");
    expect(result.token).toBe("token123");
  });

  it("rejects an unknown email", async () => {
    const useCase = new LoginUserUseCase(mockUserRepository(), mockPasswordHasher(), mockTokenIssuer());

    await expect(useCase.execute({ email: "nobody@example.com", password: "password1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects a user with no password set (Google-only account)", async () => {
    const googleOnlyUser: User = { ...existingUser, passwordHash: null };
    const userRepository = mockUserRepository({ findByEmail: vi.fn().mockResolvedValue(googleOnlyUser) });
    const useCase = new LoginUserUseCase(userRepository, mockPasswordHasher(), mockTokenIssuer());

    await expect(useCase.execute({ email: "a@b.com", password: "password1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects an incorrect password", async () => {
    const userRepository = mockUserRepository({ findByEmail: vi.fn().mockResolvedValue(existingUser) });
    const passwordHasher = mockPasswordHasher({ compare: vi.fn().mockResolvedValue(false) });
    const useCase = new LoginUserUseCase(userRepository, passwordHasher, mockTokenIssuer());

    await expect(useCase.execute({ email: "a@b.com", password: "wrong" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
