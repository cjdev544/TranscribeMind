import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./protected-route.js";
import { apiClient } from "../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../test/queryClientWrapper.js";

vi.mock("../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn() } }));
vi.mock("react-router-dom", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

describe("ProtectedRoute", () => {
  it("shows a loading state while the current user is being fetched", () => {
    vi.mocked(apiClient.get).mockReturnValue(new Promise(() => {}));
    render(
      <ProtectedRoute>
        <div>secret content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Cargando...")).toBeInTheDocument();
  });

  it("redirects to /login when there is no logged-in user", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["auth", "me"], null);
    vi.mocked(apiClient.get).mockResolvedValue({ data: null });
    render(
      <ProtectedRoute>
        <div>secret content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper(queryClient) }
    );

    expect(await screen.findByTestId("navigate")).toHaveTextContent("/login");
  });

  it("redirects to /login when fetching the current user fails", async () => {
    const queryClient = createQueryClient();
    vi.mocked(apiClient.get).mockRejectedValue(new Error("unauthorized"));
    render(
      <ProtectedRoute>
        <div>secret content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper(queryClient) }
    );

    expect(await screen.findByTestId("navigate")).toHaveTextContent("/login");
  });

  it("renders the protected children once a user is loaded", async () => {
    const queryClient = createQueryClient();
    const user = { id: "u1", email: "a@b.com", username: "alice", avatarUrl: null };
    queryClient.setQueryData(["auth", "me"], user);
    vi.mocked(apiClient.get).mockResolvedValue({ data: user });
    render(
      <ProtectedRoute>
        <div>secret content</div>
      </ProtectedRoute>,
      { wrapper: createWrapper(queryClient) }
    );

    expect(await screen.findByText("secret content")).toBeInTheDocument();
  });
});
