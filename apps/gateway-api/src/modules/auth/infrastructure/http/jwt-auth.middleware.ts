import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../../../../shared/kernel/domain-error.js";
import type { TokenIssuerPort } from "../../domain/ports/token-issuer.port.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function createJwtAuthMiddleware(tokenIssuer: TokenIssuerPort) {
  return function jwtAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const token = req.cookies?.token as string | undefined;
    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const user = tokenIssuer.verify(token);
    req.userId = user.id;
    next();
  };
}
