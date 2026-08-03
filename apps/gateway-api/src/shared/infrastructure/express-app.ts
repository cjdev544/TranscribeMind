import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import type { Logger } from "@transcribemind/logger";
import { buildAuthRouter } from "../../modules/auth/infrastructure/http/auth.routes.js";
import { buildVideosRouter } from "../../modules/videos/infrastructure/http/videos.routes.js";
import { createErrorHandler } from "./error-handler.middleware.js";
import type { Container } from "./di-container.js";

export function createExpressApp(container: Container, logger: Logger, corsOrigin: string): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use("/api/auth", buildAuthRouter(container.authController, container.tokenIssuer));
  app.use("/api/videos", buildVideosRouter(container.videosController, container.tokenIssuer));

  app.use(createErrorHandler(logger));

  return app;
}
