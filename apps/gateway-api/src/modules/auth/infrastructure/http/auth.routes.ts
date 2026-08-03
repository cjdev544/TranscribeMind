import { Router } from "express";
import type { AuthController } from "./auth.controller.js";
import { asyncHandler } from "../../../../shared/infrastructure/async-handler.js";
import { createJwtAuthMiddleware } from "./jwt-auth.middleware.js";
import type { TokenIssuerPort } from "../../domain/ports/token-issuer.port.js";

export function buildAuthRouter(controller: AuthController, tokenIssuer: TokenIssuerPort): Router {
  const router = Router();
  const requireAuth = createJwtAuthMiddleware(tokenIssuer);

  router.post("/register", asyncHandler(controller.register));
  router.post("/login", asyncHandler(controller.login));
  router.post("/google", asyncHandler(controller.google));
  router.post("/logout", asyncHandler(controller.logout));
  router.get("/me", requireAuth, asyncHandler(controller.me));

  return router;
}
