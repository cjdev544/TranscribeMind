import { describe, expect, it } from "vitest";
import { useRealtimeStore } from "./use-realtime-store.js";

describe("useRealtimeStore", () => {
  it("starts with no tracked video state", () => {
    expect(useRealtimeStore.getState().byVideoId).toEqual({});
  });

  it("sets the state for a given video id", () => {
    useRealtimeStore.getState().setVideoState("v1", { status: "TRANSCRIBING" as never, progress: 30 });

    expect(useRealtimeStore.getState().byVideoId.v1).toEqual({ status: "TRANSCRIBING", progress: 30 });
  });

  it("keeps other videos' state untouched when updating one", () => {
    useRealtimeStore.getState().setVideoState("v1", { status: "QUEUED" as never, progress: 0 });
    useRealtimeStore.getState().setVideoState("v2", { status: "COMPLETED" as never, progress: 100 });

    expect(useRealtimeStore.getState().byVideoId.v1?.status).toBe("QUEUED");
    expect(useRealtimeStore.getState().byVideoId.v2?.status).toBe("COMPLETED");
  });

  it("overwrites a video's previous state entirely", () => {
    useRealtimeStore.getState().setVideoState("v1", { status: "QUEUED" as never, progress: 0, error: "old" });
    useRealtimeStore.getState().setVideoState("v1", { status: "FAILED" as never, progress: 0 });

    expect(useRealtimeStore.getState().byVideoId.v1).toEqual({ status: "FAILED", progress: 0 });
  });
});
