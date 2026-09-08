import { describe, expect, it } from "vitest";
import { isAppleDoubleFile, isRecognizedVideoContainer } from "./video-signature.js";

function bytes(...values: number[]): Buffer {
  return Buffer.from(values);
}

describe("isAppleDoubleFile", () => {
  it("recognizes the AppleDouble magic number", () => {
    expect(isAppleDoubleFile(bytes(0x00, 0x05, 0x16, 0x07, 0x00, 0x00))).toBe(true);
  });

  it("rejects a buffer that is too short", () => {
    expect(isAppleDoubleFile(bytes(0x00, 0x05, 0x16))).toBe(false);
  });

  it("rejects an unrelated buffer", () => {
    expect(isAppleDoubleFile(Buffer.from("hello world"))).toBe(false);
  });
});

describe("isRecognizedVideoContainer", () => {
  it("recognizes an ISO base media file (mp4/mov) by its ftyp box", () => {
    const buffer = Buffer.concat([bytes(0, 0, 0, 0x20), Buffer.from("ftypisom")]);

    expect(isRecognizedVideoContainer(buffer)).toBe(true);
  });

  it("recognizes a Matroska/WebM file by its magic number", () => {
    expect(isRecognizedVideoContainer(bytes(0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0))).toBe(true);
  });

  it("recognizes an AVI file by its RIFF/AVI headers", () => {
    const buffer = Buffer.concat([Buffer.from("RIFF"), bytes(0, 0, 0, 0), Buffer.from("AVI ")]);

    expect(isRecognizedVideoContainer(buffer)).toBe(true);
  });

  it("recognizes an FLV file by its signature", () => {
    expect(isRecognizedVideoContainer(Buffer.from("FLV\x01"))).toBe(true);
  });

  it("rejects a buffer that matches no known video container", () => {
    expect(isRecognizedVideoContainer(Buffer.from("not a video file at all"))).toBe(false);
  });

  it("rejects an empty buffer", () => {
    expect(isRecognizedVideoContainer(Buffer.alloc(0))).toBe(false);
  });
});
