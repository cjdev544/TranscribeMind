import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

const user = { id: "u1", email: "a@b.com", username: "auser", avatarUrl: null };

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear();
    navigateMock.mockClear();
  });

  it("submits the entered fields and navigates to the dashboard on success", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: user });
    render(<RegisterForm />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("tu@email.com"), "a@b.com");
    await actor.type(screen.getByPlaceholderText("Nombre de usuario"), "auser");
    await actor.type(screen.getByPlaceholderText("Contraseña"), "password1");
    await actor.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard"));
    expect(apiClient.post).toHaveBeenCalledWith("/api/auth/register", {
      email: "a@b.com",
      username: "auser",
      password: "password1",
    });
  });

  it("shows an error message when registration fails", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("conflict"));
    render(<RegisterForm />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("tu@email.com"), "a@b.com");
    await actor.type(screen.getByPlaceholderText("Nombre de usuario"), "auser");
    await actor.type(screen.getByPlaceholderText("Contraseña"), "password1");
    await actor.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByText("No se pudo crear la cuenta. ¿El email o nombre de usuario ya existen?")
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
