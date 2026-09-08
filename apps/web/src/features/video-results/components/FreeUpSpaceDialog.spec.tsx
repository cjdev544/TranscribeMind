import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FreeUpSpaceDialog } from "./FreeUpSpaceDialog.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("FreeUpSpaceDialog", () => {
  it("opens the confirmation dialog", async () => {
    render(<FreeUpSpaceDialog videoId="v1" />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Liberar espacio"));

    expect(await screen.findByText(/archivo de video original/)).toBeInTheDocument();
  });

  it("frees up the space on confirm", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });
    render(<FreeUpSpaceDialog videoId="v1" />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Liberar espacio"));
    await actor.click(await screen.findByRole("button", { name: "Liberar espacio" }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith("/api/videos/v1/free-space"));
  });
});
