import type { Redis } from "ioredis";
import type { Server as SocketIoServer } from "socket.io";
import { VIDEO_EVENTS_CHANNEL, WS_EVENT_VIDEO_STATUS, videoStatusEventSchema } from "@transcribemind/contracts";
import type { Logger } from "@transcribemind/logger";
import { userRoom } from "./websocket-server.js";

/**
 * Bridges Redis Pub/Sub (published by video-worker / ai-summary-service)
 * to Socket.io rooms. Workers never talk to Socket.io directly, which keeps
 * them stateless and horizontally scalable independent of gateway replicas.
 */
export function subscribeToVideoEvents(
  subscriber: Redis,
  io: SocketIoServer,
  logger: Logger,
): void {
  subscriber.subscribe(VIDEO_EVENTS_CHANNEL).catch((error) => {
    logger.error({ err: error }, "Failed to subscribe to video-events channel");
  });

  subscriber.on("message", (_channel, message) => {
    const parsed = videoStatusEventSchema.safeParse(JSON.parse(message));
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, "Discarding malformed video-events message");
      return;
    }

    const event = parsed.data;
    io.to(userRoom(event.userId)).emit(WS_EVENT_VIDEO_STATUS, {
      id: event.videoId,
      status: event.status,
      progress: event.progress,
      error: event.error,
    });
  });
}
