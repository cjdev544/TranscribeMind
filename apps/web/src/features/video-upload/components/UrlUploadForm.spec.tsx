import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SummaryLanguage } from "@transcribemind/contracts";
import { UrlUploadForm } from "./UrlUploadForm.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("UrlUploadForm", () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear();
  });

  it("submits the url and calls onUploaded with the new video id", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "v1", status: "QUEUED" } });
    const onUploaded = vi.fn();
    render(<UrlUploadForm title="My video" summaryLanguage={SummaryLanguage.ES} onUploaded={onUploaded} />, {
      wrapper: createWrapper(),
    });
    const actor = userEvent.setup();

    await actor.type(
      screen.getByPlaceholderText(/youtube.com/),
      "https://youtube.com/watch?v=abc"
    );
    await actor.click(screen.getByRole("button", { name: "Subir" }));

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith("v1"));
    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/upload-url", {
      url: "https://youtube.com/watch?v=abc",
      summaryLanguage: SummaryLanguage.ES,
      title: "My video",
    });
  });

  it("does not submit a blank url", async () => {
    render(<UrlUploadForm title="" summaryLanguage={SummaryLanguage.ES} onUploaded={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const actor = userEvent.setup();

    await actor.click(screen.getByRole("button", { name: "Subir" }));

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("shows an error message when the download fails", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("failed"));
    render(<UrlUploadForm title="" summaryLanguage={SummaryLanguage.ES} onUploaded={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText(/youtube.com/), "https://example.com/v.mp4");
    await actor.click(screen.getByRole("button", { name: "Subir" }));

    expect(await screen.findByText("No se pudo descargar el video desde esa URL.")).toBeInTheDocument();
  });
});
