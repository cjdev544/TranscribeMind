import { ConflictError } from "../../../shared/kernel/domain-error.js";
import type { UserRepositoryPort } from "../domain/ports/user-repository.port.js";
import type { PasswordHasherPort } from "../domain/ports/password-hasher.port.js";
import type { TokenIssuerPort } from "../domain/ports/token-issuer.port.js";

export interface RegisterUserInput {
  email: string;
  username: string;
  password: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(
    input: RegisterUserInput,
  ): Promise<{ token: string; userId: string; email: string; username: string; avatarUrl: string | null }> {
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError("Email is already registered");
    }

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new ConflictError("Username is already taken");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      username: input.username,
      passwordHash,
    });
    const token = this.tokenIssuer.issue({
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });

    return { token, userId: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl };
  }
}
