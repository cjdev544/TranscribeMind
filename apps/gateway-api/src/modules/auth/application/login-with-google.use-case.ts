import type { UserRepositoryPort } from "../domain/ports/user-repository.port.js";
import type { TokenIssuerPort } from "../domain/ports/token-issuer.port.js";
import type { GoogleTokenVerifierPort } from "../domain/ports/google-token-verifier.port.js";
import type { User } from "../domain/user.entity.js";

export interface LoginWithGoogleInput {
  idToken: string;
}

export class LoginWithGoogleUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly tokenIssuer: TokenIssuerPort,
    private readonly googleTokenVerifier: GoogleTokenVerifierPort,
  ) {}

  async execute(
    input: LoginWithGoogleInput,
  ): Promise<{ token: string; userId: string; email: string; username: string; avatarUrl: string | null }> {
    const profile = await this.googleTokenVerifier.verify(input.idToken);

    const user = await this.resolveUser(profile);

    const token = this.tokenIssuer.issue({
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
    return { token, userId: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl };
  }

  private async resolveUser(profile: {
    googleId: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  }): Promise<User> {
    const byGoogleId = await this.userRepository.findByGoogleId(profile.googleId);
    if (byGoogleId) {
      return byGoogleId;
    }

    const byEmail = await this.userRepository.findByEmail(profile.email);
    if (byEmail) {
      return this.userRepository.linkGoogleAccount(byEmail.id, {
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl,
      });
    }

    const username = await this.generateUniqueUsername(profile.name ?? profile.email.split("@")[0] ?? "user");
    return this.userRepository.create({
      email: profile.email,
      username,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl ?? undefined,
    });
  }

  private async generateUniqueUsername(seed: string): Promise<string> {
    const base = seed.toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";

    let candidate = base;
    let attempt = 1;
    while (await this.userRepository.findByUsername(candidate)) {
      attempt += 1;
      candidate = `${base}${attempt}`;
    }

    return candidate;
  }
}
