import { UnauthorizedError } from "../../../shared/kernel/domain-error.js";
import type { UserRepositoryPort } from "../domain/ports/user-repository.port.js";
import type { AuthenticatedUser } from "../domain/user.entity.js";

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(userId: string): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }
    return { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl };
  }
}
