import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../../../../shared/kernel/domain-error.js";
import type { TokenIssuerPort } from "../../domain/ports/token-issuer.port.js";
import type { AuthenticatedUser } from "../../domain/user.entity.js";

export class JsonWebTokenIssuer implements TokenIssuerPort {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  issue(user: AuthenticatedUser): string {
    return jwt.sign(
      { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
      this.secret,
      {
        // expiresIn is validated upstream by the env schema as a string like "7d";
        // jsonwebtoken's types narrow it to a template-literal union it can't infer here.
        expiresIn: this.expiresIn as jwt.SignOptions["expiresIn"],
      },
    );
  }

  verify(token: string): AuthenticatedUser {
    try {
      const payload = jwt.verify(token, this.secret) as AuthenticatedUser;
      return { id: payload.id, email: payload.email, username: payload.username, avatarUrl: payload.avatarUrl };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}
