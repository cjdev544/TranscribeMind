import { vi } from "vitest";
import type { UserRepositoryPort } from "../modules/auth/domain/ports/user-repository.port.js";
import type { PasswordHasherPort } from "../modules/auth/domain/ports/password-hasher.port.js";
import type { TokenIssuerPort } from "../modules/auth/domain/ports/token-issuer.port.js";
import type { GoogleTokenVerifierPort } from "../modules/auth/domain/ports/google-token-verifier.port.js";

export function mockUserRepository(overrides: Partial<UserRepositoryPort> = {}): UserRepositoryPort {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    findByUsername: vi.fn().mockResolvedValue(null),
    findByGoogleId: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
    linkGoogleAccount: vi.fn(),
    ...overrides,
  };
}

export function mockPasswordHasher(overrides: Partial<PasswordHasherPort> = {}): PasswordHasherPort {
  return {
    hash: vi.fn().mockResolvedValue("hashed"),
    compare: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

export function mockTokenIssuer(overrides: Partial<TokenIssuerPort> = {}): TokenIssuerPort {
  return {
    issue: vi.fn().mockReturnValue("token123"),
    verify: vi.fn(),
    ...overrides,
  };
}

export function mockGoogleTokenVerifier(overrides: Partial<GoogleTokenVerifierPort> = {}): GoogleTokenVerifierPort {
  return {
    verify: vi.fn(),
    ...overrides,
  };
}
