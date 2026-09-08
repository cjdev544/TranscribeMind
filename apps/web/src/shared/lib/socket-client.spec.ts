import { afterEach, describe, expect, it, vi } from "vitest";

const ioMock = vi.fn().mockReturnValue({ connected: false });
vi.mock("socket.io-client", () => ({ io: ioMock }));

describe("getSocket", () => {
  afterEach(() => {
    vi.resetModules();
    ioMock.mockClear();
  });

  it("creates the socket once, reusing it on subsequent calls", async () => {
    const { getSocket } = await import("./socket-client.js");

    const first = getSocket();
    const second = getSocket();

    expect(first).toBe(second);
    expect(ioMock).toHaveBeenCalledTimes(1);
  });

  it("connects with credentials and autoConnect enabled", async () => {
    const { getSocket } = await import("./socket-client.js");

    getSocket();

    expect(ioMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ withCredentials: true, autoConnect: true }));
  });
});
