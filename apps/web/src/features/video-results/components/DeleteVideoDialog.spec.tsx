import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteVideoDialog } from "./DeleteVideoDialog.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { delete: vi.fn() } }));

describe("DeleteVideoDialog", () => {
  it("opens the confirmation dialog and shows the video title", async () => {
    render(<DeleteVideoDialog videoId="v1" videoTitle="Mi video" onDeleted={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Eliminar video"));

    expect(await screen.findByText(/Mi video/)).toBeInTheDocument();
  });

  it("deletes the video and calls onDeleted on confirm", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    const onDeleted = vi.fn();
    render(<DeleteVideoDialog videoId="v1" videoTitle="Mi video" onDeleted={onDeleted} />, {
      wrapper: createWrapper(),
    });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Eliminar video"));
    await actor.click(await screen.findByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(apiClient.delete).toHaveBeenCalledWith("/api/videos/v1");
  });

  it("does not open the dialog trigger click when it bubbles from a parent row", async () => {
    const rowClick = vi.fn();
    render(
      <div onClick={rowClick}>
        <DeleteVideoDialog videoId="v1" videoTitle="Mi video" onDeleted={vi.fn()} />
      </div>,
      { wrapper: createWrapper() }
    );
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Eliminar video"));

    expect(rowClick).not.toHaveBeenCalled();
  });
});
