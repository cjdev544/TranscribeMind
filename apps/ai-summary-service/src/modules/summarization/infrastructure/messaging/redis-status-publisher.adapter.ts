import type { Redis } from "ioredis";
import { VIDEO_EVENTS_CHANNEL, type VideoStatusEvent } from "@transcribemind/contracts";
import type { StatusPublisherPort } from "../../domain/ports/status-publisher.port.js";

export class RedisStatusPublisherAdapter implements StatusPublisherPort {
  constructor(private readonly publisher: Redis) {}

  async publish(event: VideoStatusEvent): Promise<void> {
    await this.publisher.publish(VIDEO_EVENTS_CHANNEL, JSON.stringify(event));
  }
}
