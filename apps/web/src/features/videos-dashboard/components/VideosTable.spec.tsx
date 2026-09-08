import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideosTable } from "./VideosTable.js";
import { VideoStatusValues } from "../../../shared/types/video.js";
import type { Video } from "../../../shared/types/video.js";

vi.mock("../../video-results/components/DeleteVideoDialog.js", () => ({
  DeleteVideoDialog: ({ videoTitle }: { videoTitle: string }) => (
    <div data-testid="delete-dialog">Delete: {videoTitle}</div>
  ),
}));

const setSearchParamsMock = vi.fn();
vi.mock("react-router-dom", () => ({ useSearchParams: () => [new URLSearchParams(), setSearchParamsMock] }));

function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    id: "v1",
    userId: "u1",
    title: "My video",
    originalFilename: "clip.mp4",
    s3Key: "s3/clip.mp4",
    status: VideoStatusValues.COMPLETED,
    progress: 100,
    durationSeconds: 125,
    transcript: null,
    transcriptSegments: null,
    analysis: null,
    error: null,
    completedAt: "2026-01-01T00:00:00.000Z",
    fileDeletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("VideosTable", () => {
  beforeEach(() => {
    setSearchParamsMock.mockClear();
  });

  it("shows a loading message while loading", () => {
    render(<VideosTable videos={[]} isLoading={true} />);
    expect(screen.getByText("Cargando videos...")).toBeInTheDocument();
  });

  it("shows an empty state when there are no videos", () => {
    render(<VideosTable videos={[]} isLoading={false} />);
    expect(screen.getByText("Todavía no has subido ningún video.")).toBeInTheDocument();
  });

  it("renders a row per video with title, duration, and formatted date", () => {
    const video = makeVideo();
    render(<VideosTable videos={[video]} isLoading={false} />);

    expect(screen.getByText("My video")).toBeInTheDocument();
    expect(screen.getByText("2:05")).toBeInTheDocument();
    expect(screen.getByText("Completado")).toBeInTheDocument();
  });

  it("falls back to the original filename when there is no title", () => {
    const video = makeVideo({ title: null });
    render(<VideosTable videos={[video]} isLoading={false} />);

    expect(screen.getByText("clip.mp4")).toBeInTheDocument();
  });

  it("shows a dash when duration is unknown", () => {
    const video = makeVideo({ durationSeconds: null });
    render(<VideosTable videos={[video]} isLoading={false} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("navigates to the video via search params when a row is clicked", async () => {
    const video = makeVideo();
    render(<VideosTable videos={[video]} isLoading={false} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByText("My video"));

    expect(setSearchParamsMock).toHaveBeenCalledWith({ video: "v1" });
  });

  it("does not navigate when the delete cell is clicked", async () => {
    const video = makeVideo();
    render(<VideosTable videos={[video]} isLoading={false} />);
    const actor = userEvent.setup();

    await actor.click(screen.getByTestId("delete-dialog"));

    expect(setSearchParamsMock).not.toHaveBeenCalled();
  });
});
