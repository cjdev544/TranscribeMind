import { Redis } from "ioredis";
import { createLogger } from "@transcribemind/logger";
import { env } from "./shared/env.js";
import { GenerateSummaryUseCase } from "./modules/summarization/application/generate-summary.use-case.js";
import { Gpt4oSummaryAdapter } from "./modules/summarization/infrastructure/openai/gpt4o-summary.adapter.js";
import { PrismaVideoRepository } from "./modules/summarization/infrastructure/persistence/prisma-video.repository.js";
import { RedisStatusPublisherAdapter } from "./modules/summarization/infrastructure/messaging/redis-status-publisher.adapter.js";
import { createSummaryWorker } from "./modules/summarization/infrastructure/queue/bullmq-summary-worker.js";

const logger = createLogger("ai-summary-service");

async function main(): Promise<void> {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const publisherConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  const videoRepository = new PrismaVideoRepository();
  const statusPublisher = new RedisStatusPublisherAdapter(publisherConnection);
  const summaryProvider = new Gpt4oSummaryAdapter(env.OPENAI_API_KEY);

  const generateSummaryUseCase = new GenerateSummaryUseCase(
    summaryProvider,
    videoRepository,
    statusPublisher,
  );

  createSummaryWorker(connection, generateSummaryUseCase, statusPublisher, videoRepository, logger);

  logger.info("ai-summary-service listening for jobs");
}

main().catch((error) => {
  logger.error({ err: error }, "Failed to start ai-summary-service");
  process.exit(1);
});
