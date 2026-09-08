import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GoogleSignInButton } from "./GoogleSignInButton.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

const initializeMock = vi.fn();
const renderButtonMock = vi.fn();

describe("GoogleSignInButton", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as { google?: unknown }).google;
    initializeMock.mockClear();
    renderButtonMock.mockClear();
    vi.mocked(apiClient.post).mockClear();
  });

  it("renders nothing when no Google client id is configured", () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");
    const { container } = render(<GoogleSignInButton onSuccess={vi.fn()} />, { wrapper: createWrapper() });
    expect(container).toBeEmptyDOMElement();
  });

  it("initializes and renders the Google button once the client id is configured", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");
    window.google = { accounts: { id: { initialize: initializeMock, renderButton: renderButtonMock } } };

    render(<GoogleSignInButton onSuccess={vi.fn()} />, { wrapper: createWrapper() });

    await waitFor(() => expect(initializeMock).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: "test-client-id" })
    ));
    expect(renderButtonMock).toHaveBeenCalled();
  });

  it("logs in and calls onSuccess when Google returns a credential", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");
    window.google = { accounts: { id: { initialize: initializeMock, renderButton: renderButtonMock } } };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: "u1", email: "a@b.com", username: "a", avatarUrl: null } });
    const onSuccess = vi.fn();

    render(<GoogleSignInButton onSuccess={onSuccess} />, { wrapper: createWrapper() });
    await waitFor(() => expect(initializeMock).toHaveBeenCalled());

    const { callback } = initializeMock.mock.calls[0]![0] as { callback: (r: { credential: string }) => void };
    callback({ credential: "google-id-token" });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/google", { idToken: "google-id-token" });
  });

  it("shows an error message when the Google login mutation fails", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test-client-id");
    window.google = { accounts: { id: { initialize: initializeMock, renderButton: renderButtonMock } } };
    vi.mocked(apiClient.post).mockRejectedValue(new Error("google auth failed"));

    render(<GoogleSignInButton onSuccess={vi.fn()} />, { wrapper: createWrapper() });
    await waitFor(() => expect(initializeMock).toHaveBeenCalled());

    const { callback } = initializeMock.mock.calls[0]![0] as { callback: (r: { credential: string }) => void };
    callback({ credential: "google-id-token" });

    expect(await screen.findByText("No se pudo iniciar sesión con Google.")).toBeInTheDocument();
  });
});
