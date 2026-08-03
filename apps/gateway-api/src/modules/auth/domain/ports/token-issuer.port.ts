import type { AuthenticatedUser } from "../user.entity.js";

export interface TokenIssuerPort {
  issue(user: AuthenticatedUser): string;
  verify(token: string): AuthenticatedUser;
}
