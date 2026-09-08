import { describe, expect, it, vi } from "vitest";
import type { Redis } from "ioredis";
import { RedisStatusPublisherAdapter } from "./redis-status-publisher.adapter.js";

describe("RedisStatusPublisherAdapter", () => {
  it("publishes the event as JSON on the video-events channel", async () => {
    const publish = vi.fn();
    const adapter = new RedisStatusPublisherAdapter({ publish } as unknown as Redis);
    const event = { videoId: "v1", userId: "u1", status: "QUEUED" as const, progress: 10 };

    await adapter.publish(event);

    expect(publish).toHaveBeenCalledWith("video-events", JSON.stringify(event));
  });
});
