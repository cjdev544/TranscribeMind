import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

const user = { id: "u1", email: "a@b.com", username: "auser", avatarUrl: null };

describe("LoginForm", () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear();
    navigateMock.mockClear();
  });

  it("submits the entered credentials and navigates to the dashboard on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: user });
    render(<LoginForm />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("tu@email.com"), "a@b.com");
    await actor.type(screen.getByPlaceholderText("Contraseña"), "password1");
    await actor.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard"));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login", { email: "a@b.com", password: "password1" });
  });

  it("shows an error message when login fails", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("invalid credentials"));
    render(<LoginForm />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("tu@email.com"), "a@b.com");
    await actor.type(screen.getByPlaceholderText("Contraseña"), "wrongpass");
    await actor.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Credenciales inválidas. Inténtalo de nuevo.")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
