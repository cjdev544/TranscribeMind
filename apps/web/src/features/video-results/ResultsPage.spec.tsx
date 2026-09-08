import { forwardRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsPage } from "./ResultsPage.js";
import { apiClient } from "../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../test/queryClientWrapper.js";
import { VideoStatusValues } from "../../shared/types/video.js";
import type { Video } from "../../shared/types/video.js";

vi.mock("../../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

vi.mock("./components/ExportActions.js", () => ({ ExportActions: () => <div data-testid="export-actions" /> }));
vi.mock("./components/FreeUpSpaceDialog.js", () => ({
  FreeUpSpaceDialog: () => <div data-testid="free-up-space-dialog" />,
}));
vi.mock("./components/DeleteVideoDialog.js", () => ({
  DeleteVideoDialog: ({ onDeleted }: { onDeleted: () => void }) => (
    <button type="button" onClick={onDeleted} data-testid="delete-video-dialog">
      delete
    </button>
  ),
}));
vi.mock("./components/EditableTitle.js", () => ({ EditableTitle: () => <div data-testid="editable-title" /> }));
vi.mock("./components/ErrorState.js", () => ({
  ErrorState: ({ message, onRetry }: { message: string | null; onRetry: () => void }) => (
    <div data-testid="error-state">
      {message}
      <button type="button" onClick={onRetry}>
        retry
      </button>
    </div>
  ),
}));
vi.mock("./components/TranscriptPanel.js", () => ({
  TranscriptPanel: () => <div data-testid="transcript-panel" />,
}));
vi.mock("./components/InsightsTabs.js", () => ({ InsightsTabs: () => <div data-testid="insights-tabs" /> }));
vi.mock("./components/VideoPlayer.js", () => ({
  VideoPlayer: forwardRef((_props, ref) => <div data-testid="video-player" ref={ref as never} />),
}));
vi.mock("../video-upload/components/ProcessingStepsCard.js", () => ({
  ProcessingStepsCard: () => <div data-testid="processing-steps" />,
}));

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
    transcript: "hello",
    transcriptSegments: null,
    analysis: { executiveSummary: "s", keyPoints: [], keywords: [], chapters: [] } as never,
    error: null,
    completedAt: "2026-01-01T00:00:00.000Z",
    fileDeletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderWithVideo(video: Video | undefined) {
  const queryClient = createQueryClient();
  if (video) queryClient.setQueryData(["video", video.id], video);
  vi.mocked(apiClient.get).mockResolvedValue({ data: video });
  return render(<ResultsPage videoId="v1" />, { wrapper: createWrapper(queryClient) });
}

describe("ResultsPage", () => {
  it("shows a loading message before the video loads", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(<ResultsPage videoId="v1" />, { wrapper: createWrapper() });

    expect(screen.getByText("Cargando video...")).toBeInTheDocument();
  });

  it("shows the processing steps while the video is still processing", async () => {
    renderWithVideo(makeVideo({ status: VideoStatusValues.TRANSCRIBING, analysis: null, transcript: null }));

    expect(await screen.findByTestId("processing-steps")).toBeInTheDocument();
    expect(screen.queryByTestId("export-actions")).not.toBeInTheDocument();
  });

  it("shows the error state with a working retry button when the video failed", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });
    renderWithVideo(
      makeVideo({ status: VideoStatusValues.FAILED, analysis: null, transcript: null, error: "Whisper timed out" })
    );

    expect(await screen.findByText("Whisper timed out")).toBeInTheDocument();
    const actor = userEvent.setup();
    await actor.click(screen.getByRole("button", { name: "retry" }));

    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/v1/retry");
  });

  it("shows export actions, free-up-space, transcript, and insights for a completed video with a file", async () => {
    renderWithVideo(makeVideo());

    expect(await screen.findByTestId("export-actions")).toBeInTheDocument();
    expect(screen.getByTestId("free-up-space-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("transcript-panel")).toBeInTheDocument();
    expect(screen.getByTestId("insights-tabs")).toBeInTheDocument();
    expect(screen.getByText("Video original")).toBeInTheDocument();
  });

  it("hides free-up-space and the player, and shows a notice, once the file was deleted", async () => {
    renderWithVideo(makeVideo({ fileDeletedAt: "2026-02-01T00:00:00.000Z" }));

    expect(await screen.findByTestId("export-actions")).toBeInTheDocument();
    expect(screen.queryByTestId("free-up-space-dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Video original")).not.toBeInTheDocument();
    expect(
      screen.getByText(/El video original se eliminó para ahorrar espacio/)
    ).toBeInTheDocument();
  });

  it("navigates to the dashboard when the back button is clicked", async () => {
    renderWithVideo(makeVideo());
    await screen.findByTestId("export-actions");
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button", { name: /Volver/ }));

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("navigates to the dashboard after the video is deleted", async () => {
    renderWithVideo(makeVideo());
    await screen.findByTestId("export-actions");
    const actor = userEvent.setup();

    await actor.click(screen.getByTestId("delete-video-dialog"));

    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });
});
