import { UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { UserRepositoryPort } from "../domain/ports/user-repository.port.js";
import type { PasswordHasherPort } from "../domain/ports/password-hasher.port.js";
import type { TokenIssuerPort } from "../domain/ports/token-issuer.port.js";

export interface LoginUserInput {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(
    input: LoginUserInput,
  ): Promise<{ token: string; userId: string; email: string; username: string; avatarUrl: string | null }> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this.tokenIssuer.issue({
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
    return { token, userId: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl };
  }
}
