import { describe, expect, it, vi } from "vitest";
import { GetCurrentUserUseCase } from "./get-current-user.use-case.js";
import { mockUserRepository } from "../../../test/mockAuthPorts.js";
import type { User } from "../domain/user.entity.js";

const user: User = {
  id: "u1",
  email: "a@b.com",
  username: "auser",
  passwordHash: "hashed",
  googleId: null,
  avatarUrl: null,
  createdAt: new Date(),
};

describe("GetCurrentUserUseCase", () => {
  it("returns the authenticated user shape, omitting the password hash", async () => {
    const userRepository = mockUserRepository({ findById: vi.fn().mockResolvedValue(user) });
    const useCase = new GetCurrentUserUseCase(userRepository);

    const result = await useCase.execute("u1");

    expect(result).toEqual({ id: "u1", email: "a@b.com", username: "auser", avatarUrl: null });
  });

  it("throws UNAUTHORIZED when the user no longer exists", async () => {
    const useCase = new GetCurrentUserUseCase(mockUserRepository());

    await expect(useCase.execute("missing")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
