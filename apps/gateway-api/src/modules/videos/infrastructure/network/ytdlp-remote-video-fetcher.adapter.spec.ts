import { describe, expect, it } from "vitest";
import { isYoutubeUrl } from "./ytdlp-remote-video-fetcher.adapter.js";

describe("isYoutubeUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc123",
    "https://youtube.com/watch?v=abc123",
    "https://m.youtube.com/watch?v=abc123",
    "https://music.youtube.com/watch?v=abc123",
    "https://youtu.be/abc123",
    "https://www.youtube-nocookie.com/embed/abc123",
  ])("recognizes %s as a YouTube URL", (url) => {
    expect(isYoutubeUrl(url)).toBe(true);
  });

  it("rejects a non-YouTube URL", () => {
    expect(isYoutubeUrl("https://example.com/video.mp4")).toBe(false);
  });

  it("rejects a lookalike domain", () => {
    expect(isYoutubeUrl("https://youtube.com.evil.example.com/watch?v=abc")).toBe(false);
  });

  it("returns false for a malformed URL instead of throwing", () => {
    expect(isYoutubeUrl("not a url")).toBe(false);
  });
});
