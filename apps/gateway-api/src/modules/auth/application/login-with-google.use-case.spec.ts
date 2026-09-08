import { describe, expect, it, vi } from "vitest";
import { LoginWithGoogleUseCase } from "./login-with-google.use-case.js";
import { mockUserRepository, mockTokenIssuer, mockGoogleTokenVerifier } from "../../../test/mockAuthPorts.js";
import type { User } from "../domain/user.entity.js";

const profile = { googleId: "g1", email: "a@b.com", name: "A User", avatarUrl: "https://avatar.example.com/a.png" };

const existingUser: User = {
  id: "u1",
  email: "a@b.com",
  username: "auser",
  passwordHash: null,
  googleId: "g1",
  avatarUrl: null,
  createdAt: new Date(),
};

describe("LoginWithGoogleUseCase", () => {
  it("logs in directly when a user with this googleId already exists", async () => {
    const userRepository = mockUserRepository({ findByGoogleId: vi.fn().mockResolvedValue(existingUser) });
    const googleTokenVerifier = mockGoogleTokenVerifier({ verify: vi.fn().mockResolvedValue(profile) });
    const useCase = new LoginWithGoogleUseCase(userRepository, mockTokenIssuer(), googleTokenVerifier);

    const result = await useCase.execute({ idToken: "id-token" });

    expect(result.userId).toBe("u1");
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(userRepository.linkGoogleAccount).not.toHaveBeenCalled();
  });

  it("links the Google account to an existing user found by email", async () => {
    const linkedUser: User = { ...existingUser, avatarUrl: profile.avatarUrl };
    const userRepository = mockUserRepository({
      findByEmail: vi.fn().mockResolvedValue(existingUser),
      linkGoogleAccount: vi.fn().mockResolvedValue(linkedUser),
    });
    const googleTokenVerifier = mockGoogleTokenVerifier({ verify: vi.fn().mockResolvedValue(profile) });
    const useCase = new LoginWithGoogleUseCase(userRepository, mockTokenIssuer(), googleTokenVerifier);

    await useCase.execute({ idToken: "id-token" });

    expect(userRepository.linkGoogleAccount).toHaveBeenCalledWith("u1", { googleId: "g1", avatarUrl: profile.avatarUrl });
  });

  it("creates a new user with a username derived from the profile name", async () => {
    const userRepository = mockUserRepository({ create: vi.fn().mockResolvedValue(existingUser) });
    const googleTokenVerifier = mockGoogleTokenVerifier({ verify: vi.fn().mockResolvedValue(profile) });
    const useCase = new LoginWithGoogleUseCase(userRepository, mockTokenIssuer(), googleTokenVerifier);

    await useCase.execute({ idToken: "id-token" });

    expect(userRepository.create).toHaveBeenCalledWith({
      email: "a@b.com",
      username: "auser",
      googleId: "g1",
      avatarUrl: profile.avatarUrl,
    });
  });

  it("appends a number to the username when it is already taken", async () => {
    const userRepository = mockUserRepository({
      findByUsername: vi.fn().mockResolvedValueOnce(existingUser).mockResolvedValueOnce(null),
      create: vi.fn().mockResolvedValue(existingUser),
    });
    const googleTokenVerifier = mockGoogleTokenVerifier({ verify: vi.fn().mockResolvedValue(profile) });
    const useCase = new LoginWithGoogleUseCase(userRepository, mockTokenIssuer(), googleTokenVerifier);

    await useCase.execute({ idToken: "id-token" });

    expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({ username: "auser2" }));
  });

  it("falls back to the email's local part when the profile has no name", async () => {
    const userRepository = mockUserRepository({ create: vi.fn().mockResolvedValue(existingUser) });
    const googleTokenVerifier = mockGoogleTokenVerifier({
      verify: vi.fn().mockResolvedValue({ ...profile, name: null }),
    });
    const useCase = new LoginWithGoogleUseCase(userRepository, mockTokenIssuer(), googleTokenVerifier);

    await useCase.execute({ idToken: "id-token" });

    expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({ username: "a" }));
  });
});
