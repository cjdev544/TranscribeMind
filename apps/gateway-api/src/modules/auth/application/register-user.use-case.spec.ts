import { describe, expect, it, vi } from "vitest";
import { RegisterUserUseCase } from "./register-user.use-case.js";
import { mockUserRepository, mockPasswordHasher, mockTokenIssuer } from "../../../test/mockAuthPorts.js";
import type { User } from "../domain/user.entity.js";

const createdUser: User = {
  id: "u1",
  email: "a@b.com",
  username: "auser",
  passwordHash: "hashed",
  googleId: null,
  avatarUrl: null,
  createdAt: new Date(),
};

describe("RegisterUserUseCase", () => {
  it("creates the user, hashes the password, and issues a token", async () => {
    const userRepository = mockUserRepository({ create: vi.fn().mockResolvedValue(createdUser) });
    const passwordHasher = mockPasswordHasher();
    const tokenIssuer = mockTokenIssuer();
    const useCase = new RegisterUserUseCase(userRepository, passwordHasher, tokenIssuer);

    const result = await useCase.execute({ email: "a@b.com", username: "auser", password: "password1" });

    expect(passwordHasher.hash).toHaveBeenCalledWith("password1");
    expect(userRepository.create).toHaveBeenCalledWith({ email: "a@b.com", username: "auser", passwordHash: "hashed" });
    expect(tokenIssuer.issue).toHaveBeenCalledWith({ id: "u1", email: "a@b.com", username: "auser", avatarUrl: null });
    expect(result).toEqual({ token: "token123", userId: "u1", email: "a@b.com", username: "auser", avatarUrl: null });
  });

  it("rejects a duplicate email", async () => {
    const userRepository = mockUserRepository({ findByEmail: vi.fn().mockResolvedValue(createdUser) });
    const useCase = new RegisterUserUseCase(userRepository, mockPasswordHasher(), mockTokenIssuer());

    await expect(useCase.execute({ email: "a@b.com", username: "auser", password: "password1" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects a duplicate username", async () => {
    const userRepository = mockUserRepository({ findByUsername: vi.fn().mockResolvedValue(createdUser) });
    const useCase = new RegisterUserUseCase(userRepository, mockPasswordHasher(), mockTokenIssuer());

    await expect(useCase.execute({ email: "new@b.com", username: "auser", password: "password1" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
