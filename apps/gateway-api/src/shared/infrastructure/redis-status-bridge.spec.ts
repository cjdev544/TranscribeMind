import { describe, expect, it, vi } from "vitest";
import type { Redis } from "ioredis";
import type { Server as SocketIoServer } from "socket.io";
import { subscribeToVideoEvents } from "./redis-status-bridge.js";

function mockSubscriber() {
  const handlers = new Map<string, (channel: string, message: string) => void>();
  return {
    subscribe: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((event: string, handler: (channel: string, message: string) => void) => {
      handlers.set(event, handler);
    }),
    trigger: (channel: string, message: string) => handlers.get("message")?.(channel, message),
  };
}

function mockIo() {
  const emit = vi.fn();
  const to = vi.fn().mockReturnValue({ emit });
  return { to, emit };
}

const validEvent = {
  videoId: "11111111-1111-1111-1111-111111111111",
  userId: "22222222-2222-2222-2222-222222222222",
  status: "QUEUED",
  progress: 10,
};

describe("subscribeToVideoEvents", () => {
  it("subscribes to the video-events channel", () => {
    const subscriber = mockSubscriber();
    subscribeToVideoEvents(subscriber as unknown as Redis, mockIo() as unknown as SocketIoServer, { error: vi.fn(), warn: vi.fn() } as never);

    expect(subscriber.subscribe).toHaveBeenCalledWith("video-events");
  });

  it("emits a well-formed event to the user's room", () => {
    const subscriber = mockSubscriber();
    const io = mockIo();
    subscribeToVideoEvents(subscriber as unknown as Redis, io as unknown as SocketIoServer, { error: vi.fn(), warn: vi.fn() } as never);

    subscriber.trigger("video-events", JSON.stringify(validEvent));

    expect(io.to).toHaveBeenCalledWith(`user:${validEvent.userId}`);
    expect(io.emit).toHaveBeenCalledWith("video_status", {
      id: validEvent.videoId,
      status: validEvent.status,
      progress: validEvent.progress,
      error: undefined,
    });
  });

  it("discards a malformed message without emitting", () => {
    const subscriber = mockSubscriber();
    const io = mockIo();
    const logger = { error: vi.fn(), warn: vi.fn() };
    subscribeToVideoEvents(subscriber as unknown as Redis, io as unknown as SocketIoServer, logger as never);

    subscriber.trigger("video-events", JSON.stringify({ videoId: "not-a-uuid" }));

    expect(io.emit).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("logs when the initial subscribe call fails", async () => {
    const subscriber = { subscribe: vi.fn().mockRejectedValue(new Error("redis down")), on: vi.fn() };
    const logger = { error: vi.fn(), warn: vi.fn() };
    subscribeToVideoEvents(subscriber as unknown as Redis, mockIo() as unknown as SocketIoServer, logger as never);

    await new Promise((resolve) => setImmediate(resolve));

    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err: expect.any(Error) }), "Failed to subscribe to video-events channel");
  });
});
