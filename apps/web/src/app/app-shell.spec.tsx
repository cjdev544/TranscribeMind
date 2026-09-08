import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AppShell } from "./app-shell.js";
import { apiClient } from "../shared/lib/api-client.js";
import { createWrapper } from "../test/queryClientWrapper.js";

vi.mock("../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn() } }));

function renderShell(initialPath: string) {
  const Wrapper = createWrapper();
  vi.mocked(apiClient.get).mockResolvedValue({ data: null });
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppShell>
          <div>page content</div>
        </AppShell>
      </MemoryRouter>
    </Wrapper>
  );
}

describe("AppShell", () => {
  it("renders the page content", () => {
    renderShell("/dashboard");
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders navigation links to dashboard and upload", () => {
    renderShell("/dashboard");
    expect(screen.getAllByRole("link", { name: /Dashboard/ })[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.getAllByRole("link", { name: /Subir video/ })[0]).toHaveAttribute("href", "/upload");
  });

  it("marks the current route's nav link as active", () => {
    renderShell("/upload");
    const uploadLinks = screen.getAllByRole("link", { name: /Subir video/ });
    expect(uploadLinks[0]).toHaveClass("bg-accent");
  });

  it("opens the mobile nav sheet when the menu button is clicked", async () => {
    renderShell("/dashboard");
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Abrir menú"));

    expect(await screen.findByText("Cerrar menú")).toBeInTheDocument();
  });
});
