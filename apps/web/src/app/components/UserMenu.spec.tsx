import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu.js";
import { apiClient } from "../../shared/lib/api-client.js";
import { createQueryClient, createWrapper } from "../../test/queryClientWrapper.js";

vi.mock("../../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

const alice = { id: "u1", email: "a@b.com", username: "alice", avatarUrl: null };

describe("UserMenu", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockClear();
    vi.mocked(apiClient.post).mockClear();
    navigateMock.mockClear();
    // useMe refetches in the background on mount (staleTime 0); match whatever
    // was seeded into the cache so that refetch doesn't flip the query to an
    // error state mid-test.
    vi.mocked(apiClient.get).mockResolvedValue({ data: null });
  });

  it("renders nothing while there is no logged-in user", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["auth", "me"], null);
    const { container } = render(<UserMenu />, { wrapper: createWrapper(queryClient) });

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the username and an avatar initial when there is no avatar image", () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: alice });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["auth", "me"], alice);
    render(<UserMenu />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows the avatar image when the user has one", () => {
    const withAvatar = { ...alice, avatarUrl: "https://example.com/a.png" };
    vi.mocked(apiClient.get).mockResolvedValue({ data: withAvatar });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["auth", "me"], withAvatar);
    render(<UserMenu />, { wrapper: createWrapper(queryClient) });

    expect(screen.getByRole("img", { name: "alice" })).toHaveAttribute("src", "https://example.com/a.png");
  });

  it("logs out and navigates to the login page", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: alice });
    vi.mocked(apiClient.post).mockResolvedValue({ data: undefined });
    const queryClient = createQueryClient();
    queryClient.setQueryData(["auth", "me"], alice);
    render(<UserMenu />, { wrapper: createWrapper(queryClient) });
    const actor = userEvent.setup();

    await actor.click(screen.getByTitle("Cerrar sesión"));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/login"));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/logout");
  });
});
