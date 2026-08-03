import { createServer } from "node:http";
import { Redis } from "ioredis";
import { createLogger } from "@transcribemind/logger";
import { env } from "./shared/infrastructure/env.js";
import { buildContainer } from "./shared/infrastructure/di-container.js";
import { createExpressApp } from "./shared/infrastructure/express-app.js";
import { createWebSocketServer } from "./shared/infrastructure/websocket-server.js";
import { subscribeToVideoEvents } from "./shared/infrastructure/redis-status-bridge.js";
import { scheduleVideoCleanup } from "./shared/infrastructure/video-cleanup-scheduler.js";

const logger = createLogger("gateway-api");

async function main(): Promise<void> {
  const redisConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const redisSubscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  const container = buildContainer(redisConnection, logger);
  const app = createExpressApp(container, logger, env.CORS_ORIGIN);
  const httpServer = createServer(app);

  const io = createWebSocketServer(httpServer, container.tokenIssuer, env.CORS_ORIGIN);
  subscribeToVideoEvents(redisSubscriber, io, logger);
  scheduleVideoCleanup(container.cleanupExpiredVideoFilesUseCase, logger);

  httpServer.listen(env.PORT, () => {
    logger.info(`gateway-api listening on port ${env.PORT}`);
  });
}

main().catch((error) => {
  logger.error({ err: error }, "Failed to start gateway-api");
  process.exit(1);
});
