import { Router } from "express";
import multer from "multer";
import type { VideosController } from "./videos.controller.js";
import { asyncHandler } from "../../../../shared/infrastructure/async-handler.js";
import type { TokenIssuerPort } from "../../../auth/domain/ports/token-issuer.port.js";
import { createJwtAuthMiddleware } from "../../../auth/infrastructure/http/jwt-auth.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB ceiling for source video uploads
});

export function buildVideosRouter(controller: VideosController, tokenIssuer: TokenIssuerPort): Router {
  const router = Router();
  const requireAuth = createJwtAuthMiddleware(tokenIssuer);

  router.post("/upload", requireAuth, upload.single("file"), asyncHandler(controller.upload));
  router.post("/upload-url", requireAuth, asyncHandler(controller.uploadFromUrl));
  router.get("/", requireAuth, asyncHandler(controller.list));
  router.get("/:id", requireAuth, asyncHandler(controller.getById));
  router.get("/:id/video", requireAuth, asyncHandler(controller.streamVideo));
  router.post("/:id/retry", requireAuth, asyncHandler(controller.retry));
  router.post("/:id/ask", requireAuth, asyncHandler(controller.ask));
  router.post("/:id/free-space", requireAuth, asyncHandler(controller.freeUpSpace));
  router.patch("/:id/title", requireAuth, asyncHandler(controller.updateTitle));
  router.delete("/:id", requireAuth, asyncHandler(controller.remove));

  return router;
}
