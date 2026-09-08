import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UploadPage } from "./UploadPage.js";
import { apiClient } from "../../shared/lib/api-client.js";
import { createWrapper } from "../../test/queryClientWrapper.js";
import { useRealtimeStore } from "../../stores/use-realtime-store.js";
import { VideoStatusValues } from "../../shared/types/video.js";

vi.mock("../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

function uploadFile(container: HTMLElement, file: File) {
  const input = container.querySelector("input[type='file']") as HTMLInputElement;
  return userEvent.upload(input, file);
}

describe("UploadPage", () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear();
    navigateMock.mockClear();
    useRealtimeStore.setState({ byVideoId: {} });
  });

  it("uploads a dropped file and shows processing steps once it succeeds", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const { container } = render(<UploadPage />, { wrapper: createWrapper() });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });

    await uploadFile(container, file);

    expect(await screen.findByText("Ver detalles en el dashboard →")).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/videos/upload",
      expect.any(FormData),
      expect.objectContaining({ headers: { "Content-Type": "multipart/form-data" } })
    );
  });

  it("navigates to the dashboard result view when 'Ver detalles' is clicked", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const { container } = render(<UploadPage />, { wrapper: createWrapper() });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    await uploadFile(container, file);
    await screen.findByText("Ver detalles en el dashboard →");
    const actor = userEvent.setup();

    await actor.click(screen.getByText("Ver detalles en el dashboard →"));

    expect(navigateMock).toHaveBeenCalledWith("/dashboard?video=v1");
  });

  it("reflects live realtime-store status in the processing steps", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const { container } = render(<UploadPage />, { wrapper: createWrapper() });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    await uploadFile(container, file);
    await screen.findByText("Ver detalles en el dashboard →");

    useRealtimeStore.getState().setVideoState("v1", { status: VideoStatusValues.TRANSCRIBING, progress: 55 });

    expect(await screen.findByText("Transcribiendo (55%)")).toBeInTheDocument();
  });

  it("shows an error and lets the user retry with a different file", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("upload failed"));
    const { container } = render(<UploadPage />, { wrapper: createWrapper() });
    const file = new File(["x"], "clip.mp4", { type: "video/mp4" });
    await uploadFile(container, file);

    expect(await screen.findByText("No se pudo subir el video.")).toBeInTheDocument();
    const actor = userEvent.setup();
    await actor.click(screen.getByText("Intentar con otro archivo"));

    expect(screen.getByText("Arrastra tu video aquí")).toBeInTheDocument();
    expect(screen.queryByText("No se pudo subir el video.")).not.toBeInTheDocument();
  });

  it("uploads via URL from the Enlace tab with the entered title and language", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v2", status: "QUEUED" } });
    render(<UploadPage />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("Nombre del video (opcional)"), "My clip");
    await actor.click(screen.getByRole("tab", { name: "Enlace" }));
    await actor.type(screen.getByPlaceholderText(/youtube.com/), "https://example.com/v.mp4");
    await actor.click(screen.getByRole("button", { name: "Subir" }));

    await waitFor(() => expect(screen.getByText("Ver detalles en el dashboard →")).toBeInTheDocument());
    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/upload-url", {
      url: "https://example.com/v.mp4",
      summaryLanguage: expect.any(String),
      title: "My clip",
    });
  });
});
