import type { Redis } from "ioredis";
import type { Logger } from "@transcribemind/logger";
import { DomainError } from "../kernel/domain-error.js";
import { RegisterUserUseCase } from "../../modules/auth/application/register-user.use-case.js";
import { LoginUserUseCase } from "../../modules/auth/application/login-user.use-case.js";
import { LoginWithGoogleUseCase } from "../../modules/auth/application/login-with-google.use-case.js";
import { GetCurrentUserUseCase } from "../../modules/auth/application/get-current-user.use-case.js";
import { AuthController } from "../../modules/auth/infrastructure/http/auth.controller.js";
import { PrismaUserRepository } from "../../modules/auth/infrastructure/persistence/prisma-user.repository.js";
import { BcryptPasswordHasher } from "../../modules/auth/infrastructure/security/bcrypt-password-hasher.js";
import { JsonWebTokenIssuer } from "../../modules/auth/infrastructure/security/jsonwebtoken-token-issuer.js";
import { GoogleIdTokenVerifierAdapter } from "../../modules/auth/infrastructure/security/google-id-token-verifier.adapter.js";
import type { TokenIssuerPort } from "../../modules/auth/domain/ports/token-issuer.port.js";
import type { GoogleTokenVerifierPort } from "../../modules/auth/domain/ports/google-token-verifier.port.js";

import { UploadVideoUseCase } from "../../modules/videos/application/upload-video.use-case.js";
import { UploadVideoFromUrlUseCase } from "../../modules/videos/application/upload-video-from-url.use-case.js";
import { GetVideoUseCase } from "../../modules/videos/application/get-video.use-case.js";
import { ListVideosUseCase } from "../../modules/videos/application/list-videos.use-case.js";
import { RetryVideoUseCase } from "../../modules/videos/application/retry-video.use-case.js";
import { UpdateVideoTitleUseCase } from "../../modules/videos/application/update-video-title.use-case.js";
import { DeleteVideoUseCase } from "../../modules/videos/application/delete-video.use-case.js";
import { StreamVideoUseCase } from "../../modules/videos/application/stream-video.use-case.js";
import { AskAboutVideoUseCase } from "../../modules/videos/application/ask-about-video.use-case.js";
import { FreeUpVideoSpaceUseCase } from "../../modules/videos/application/free-up-video-space.use-case.js";
import { CleanupExpiredVideoFilesUseCase } from "../../modules/videos/application/cleanup-expired-video-files.use-case.js";
import { VideosController } from "../../modules/videos/infrastructure/http/videos.controller.js";
import { PrismaVideoRepository } from "../../modules/videos/infrastructure/persistence/prisma-video.repository.js";
import { S3ObjectStorageAdapter } from "../../modules/videos/infrastructure/storage/s3-object-storage.adapter.js";
import { BullMqJobQueueAdapter } from "../../modules/videos/infrastructure/queue/bullmq-job-queue.adapter.js";
import { CompositeRemoteVideoFetcherAdapter } from "../../modules/videos/infrastructure/network/composite-remote-video-fetcher.adapter.js";
import { RedisStatusPublisherAdapter } from "../../modules/videos/infrastructure/messaging/redis-status-publisher.adapter.js";
import { Gpt4oMiniChatAdapter } from "../../modules/videos/infrastructure/openai/gpt4o-mini-chat.adapter.js";

import { env } from "./env.js";

/** Manual composition root: wires ports to concrete adapters and builds use-cases/controllers. */
export interface Container {
  authController: AuthController;
  videosController: VideosController;
  tokenIssuer: TokenIssuerPort;
  cleanupExpiredVideoFilesUseCase: CleanupExpiredVideoFilesUseCase;
}

export function buildContainer(redisConnection: Redis, logger: Logger): Container {
  const userRepository = new PrismaUserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenIssuer = new JsonWebTokenIssuer(env.JWT_SECRET, env.JWT_EXPIRES_IN);

  const googleTokenVerifier: GoogleTokenVerifierPort = env.GOOGLE_CLIENT_ID
    ? new GoogleIdTokenVerifierAdapter(env.GOOGLE_CLIENT_ID)
    : {
        verify() {
          throw new DomainError("El login con Google no está configurado", "VALIDATION_ERROR", 501);
        },
      };

  const authController = new AuthController(
    new RegisterUserUseCase(userRepository, passwordHasher, tokenIssuer),
    new LoginUserUseCase(userRepository, passwordHasher, tokenIssuer),
    new LoginWithGoogleUseCase(userRepository, tokenIssuer, googleTokenVerifier),
    new GetCurrentUserUseCase(userRepository),
  );

  const videoRepository = new PrismaVideoRepository();
  const objectStorage = new S3ObjectStorageAdapter({
    bucket: env.S3_BUCKET,
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
  });
  const jobQueue = new BullMqJobQueueAdapter(redisConnection);
  const statusPublisher = new RedisStatusPublisherAdapter(redisConnection);
  const uploadVideoUseCase = new UploadVideoUseCase(videoRepository, objectStorage, jobQueue);

  const videosController = new VideosController(
    uploadVideoUseCase,
    new UploadVideoFromUrlUseCase(
      new CompositeRemoteVideoFetcherAdapter(logger),
      uploadVideoUseCase,
      videoRepository,
      statusPublisher,
      logger,
    ),
    new GetVideoUseCase(videoRepository),
    new ListVideosUseCase(videoRepository),
    new RetryVideoUseCase(videoRepository, jobQueue),
    new UpdateVideoTitleUseCase(videoRepository),
    new DeleteVideoUseCase(videoRepository, objectStorage),
    new StreamVideoUseCase(videoRepository, objectStorage),
    new AskAboutVideoUseCase(videoRepository, new Gpt4oMiniChatAdapter(env.OPENAI_API_KEY)),
    new FreeUpVideoSpaceUseCase(videoRepository, objectStorage),
  );

  const cleanupExpiredVideoFilesUseCase = new CleanupExpiredVideoFilesUseCase(
    videoRepository,
    objectStorage,
    logger,
    env.VIDEO_RETENTION_DAYS,
  );

  return { authController, videosController, tokenIssuer, cleanupExpiredVideoFilesUseCase };
}
