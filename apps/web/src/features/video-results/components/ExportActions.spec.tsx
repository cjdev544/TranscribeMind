import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportActions } from "./ExportActions.js";
import { VideoStatusValues } from "../../../shared/types/video.js";
import type { Video } from "../../../shared/types/video.js";

const jsPdfInstance = {
  splitTextToSize: vi.fn((text: string) => [text]),
  text: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn(),
  internal: { pageSize: { getHeight: () => 280 } },
};
const jsPdfCtor = vi.fn(() => jsPdfInstance);
vi.mock("jspdf", () => ({ default: jsPdfCtor }));

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: "v1",
    userId: "u1",
    title: "My video",
    originalFilename: "clip.mp4",
    s3Key: "s3/clip.mp4",
    status: VideoStatusValues.COMPLETED,
    progress: 100,
    durationSeconds: 60,
    transcript: "hello world",
    transcriptSegments: null,
    analysis: {
      executiveSummary: "Summary.",
      keyPoints: ["Point one"],
      keywords: ["a", "b"],
      chapters: [],
    } as never,
    error: null,
    completedAt: null,
    fileDeletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ExportActions", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    jsPdfCtor.mockClear();
    jsPdfInstance.save.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the report text to the clipboard and shows confirmation, then reverts", async () => {
    render(<ExportActions video={makeVideo()} />);
    const actor = userEvent.setup();
    // userEvent.setup() installs its own clipboard stub, so ours must be
    // set after — setting it in beforeEach gets clobbered.
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    await actor.click(screen.getByRole("button", { name: /Copiar/ }));

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    const copiedText = vi.mocked(navigator.clipboard.writeText).mock.calls[0]![0] as string;
    expect(copiedText).toContain("My video");
    expect(copiedText).toContain("Summary.");
    expect(copiedText).toContain("hello world");
    expect(screen.getByRole("button", { name: "¡Copiado!" })).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("button", { name: "Copiar" })).toBeInTheDocument(), {
      timeout: 3000,
    });
  });

  it("downloads a .txt file named after the video", async () => {
    render(<ExportActions video={makeVideo()} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button", { name: /\.txt/ }));

    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("generates and saves a PDF named after the video", async () => {
    render(<ExportActions video={makeVideo()} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button", { name: /\.pdf/ }));

    await waitFor(() => expect(jsPdfInstance.save).toHaveBeenCalledWith("My video.pdf"));
  });
});
