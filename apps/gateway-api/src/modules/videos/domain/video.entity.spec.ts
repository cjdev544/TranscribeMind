import { describe, expect, it } from "vitest";
import { VideoStatus } from "@transcribemind/contracts";
import { canTransitionTo } from "./video.entity.js";

describe("canTransitionTo", () => {
  it("allows the normal forward progression through the pipeline", () => {
    expect(canTransitionTo(VideoStatus.QUEUED, VideoStatus.PROCESSING_AUDIO)).toBe(true);
    expect(canTransitionTo(VideoStatus.PROCESSING_AUDIO, VideoStatus.TRANSCRIBING)).toBe(true);
    expect(canTransitionTo(VideoStatus.TRANSCRIBING, VideoStatus.ANALYZING_AI)).toBe(true);
    expect(canTransitionTo(VideoStatus.ANALYZING_AI, VideoStatus.COMPLETED)).toBe(true);
  });

  it("rejects a transition that skips a stage", () => {
    expect(canTransitionTo(VideoStatus.QUEUED, VideoStatus.TRANSCRIBING)).toBe(false);
    expect(canTransitionTo(VideoStatus.QUEUED, VideoStatus.COMPLETED)).toBe(false);
  });

  it("rejects a transition to an earlier or equal stage", () => {
    expect(canTransitionTo(VideoStatus.TRANSCRIBING, VideoStatus.PROCESSING_AUDIO)).toBe(false);
    expect(canTransitionTo(VideoStatus.COMPLETED, VideoStatus.COMPLETED)).toBe(false);
  });

  it("always allows transitioning to FAILED, from any status", () => {
    expect(canTransitionTo(VideoStatus.QUEUED, VideoStatus.FAILED)).toBe(true);
    expect(canTransitionTo(VideoStatus.ANALYZING_AI, VideoStatus.FAILED)).toBe(true);
    expect(canTransitionTo(VideoStatus.COMPLETED, VideoStatus.FAILED)).toBe(true);
  });

  it("rejects transitioning away from QUEUED backwards (no predecessors)", () => {
    expect(canTransitionTo(VideoStatus.COMPLETED, VideoStatus.QUEUED)).toBe(false);
  });
});
