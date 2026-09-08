import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./ChatPanel.js";
import { apiClient } from "../../../shared/lib/api-client.js";
import { createWrapper } from "../../../test/queryClientWrapper.js";

vi.mock("../../../shared/lib/api-client.js", () => ({ apiClient: { post: vi.fn() } }));

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockClear();
  });

  it("shows an empty-state hint before any question is asked", () => {
    render(<ChatPanel videoId="v1" />, { wrapper: createWrapper() });
    expect(screen.getByText("Pregunta lo que quieras sobre el contenido de este video.")).toBeInTheDocument();
  });

  it("sends the question, shows the user bubble, and appends the assistant's answer", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { answer: "It's about cats." } });
    render(<ChatPanel videoId="v1" />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("Escribe tu pregunta..."), "What is this about?{Enter}");

    expect(screen.getByText("What is this about?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Escribe tu pregunta...")).toHaveValue("");
    expect(await screen.findByText("It's about cats.")).toBeInTheDocument();
    expect(apiClient.post).toHaveBeenCalledWith("/api/videos/v1/ask", {
      question: "What is this about?",
      history: [],
    });
  });

  it("does not submit a blank question", async () => {
    render(<ChatPanel videoId="v1" />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("Escribe tu pregunta..."), "   {Enter}");

    expect(apiClient.post).not.toHaveBeenCalled();
    expect(screen.getByText("Pregunta lo que quieras sobre el contenido de este video.")).toBeInTheDocument();
  });

  it("shows an error message when the question fails", async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error("boom"));
    render(<ChatPanel videoId="v1" />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("Escribe tu pregunta..."), "hola?{Enter}");

    expect(await screen.findByText("No se pudo obtener una respuesta. Intenta de nuevo.")).toBeInTheDocument();
  });

  it("sends prior messages as history on the second question", async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { answer: "First answer." } });
    render(<ChatPanel videoId="v1" />, { wrapper: createWrapper() });
    const actor = userEvent.setup();

    await actor.type(screen.getByPlaceholderText("Escribe tu pregunta..."), "First question?{Enter}");
    await screen.findByText("First answer.");

    vi.mocked(apiClient.post).mockResolvedValue({ data: { answer: "Second answer." } });
    await actor.type(screen.getByPlaceholderText("Escribe tu pregunta..."), "Second question?{Enter}");

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenLastCalledWith("/api/videos/v1/ask", {
        question: "Second question?",
        history: [
          { role: "user", content: "First question?" },
          { role: "assistant", content: "First answer." },
        ],
      })
    );
  });
});
