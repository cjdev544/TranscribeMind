import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableTitle } from "./EditableTitle.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";
import { VideoStatusValues } from "../../../shared/types/video.js";
import type { Video } from "../../../shared/types/video.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { patch: vi.fn() } }));

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
    transcript: null,
    transcriptSegments: null,
    analysis: null,
    error: null,
    completedAt: null,
    fileDeletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("EditableTitle", () => {
  beforeEach(() => {
    vi.mocked(apiClient.patch).mockClear();
  });

  it("shows the title, or the filename when there is none", () => {
    render(<EditableTitle video={makeVideo({ title: null })} />, { wrapper: createWrapper() });
    expect(screen.getByText("clip.mp4")).toBeInTheDocument();
  });

  it("enters edit mode with the current title pre-filled on click", async () => {
    render(<EditableTitle video={makeVideo()} />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Editar título"));

    expect(screen.getByDisplayValue("My video")).toBeInTheDocument();
  });

  it("commits the new title on Enter", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: makeVideo({ title: "New title" }) });
    render(<EditableTitle video={makeVideo()} />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Editar título"));
    const input = screen.getByDisplayValue("My video");
    await actor.clear(input);
    await actor.type(input, "New title{Enter}");

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith("/api/videos/v1/title", { title: "New title" })
    );
  });

  it("commits the new title on blur", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: makeVideo({ title: "Blurred title" }) });
    render(
      <div>
        <EditableTitle video={makeVideo()} />
        <button type="button">elsewhere</button>
      </div>,
      { wrapper: createWrapper() }
    );
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Editar título"));
    const input = screen.getByDisplayValue("My video");
    await actor.clear(input);
    await actor.type(input, "Blurred title");
    await actor.click(screen.getByRole("button", { name: "elsewhere" }));

    await waitFor(() =>
      expect(apiClient.patch).toHaveBeenCalledWith("/api/videos/v1/title", { title: "Blurred title" })
    );
  });

  it("cancels the edit on Escape without committing", async () => {
    render(<EditableTitle video={makeVideo()} />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Editar título"));
    const input = screen.getByDisplayValue("My video");
    await actor.type(input, " changed{Escape}");

    expect(screen.getByText("My video")).toBeInTheDocument();
    expect(apiClient.patch).not.toHaveBeenCalled();
  });

  it("does not submit when the value is unchanged", async () => {
    render(<EditableTitle video={makeVideo()} />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Editar título"));
    await actor.type(screen.getByDisplayValue("My video"), "{Enter}");

    expect(apiClient.patch).not.toHaveBeenCalled();
  });
});
