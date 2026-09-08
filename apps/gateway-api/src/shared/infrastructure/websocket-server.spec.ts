import { describe, expect, it, vi } from "vitest";
import type { TokenIssuerPort } from "../../modules/auth/domain/ports/token-issuer.port.js";

const { socketIoServerMock } = vi.hoisted(() => {
  class SocketIoServerMock {
    handlers = new Map<string, (...args: unknown[]) => void>();
    use = vi.fn((handler: (...args: unknown[]) => void) => {
      this.handlers.set("middleware", handler);
    });
    on = vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      this.handlers.set(event, handler);
    });
  }
  return { socketIoServerMock: SocketIoServerMock };
});

vi.mock("socket.io", () => ({ Server: socketIoServerMock }));

const { createWebSocketServer, userRoom } = await import("./websocket-server.js");

function mockTokenIssuer(overrides: Partial<TokenIssuerPort> = {}): TokenIssuerPort {
  return { issue: vi.fn(), verify: vi.fn(), ...overrides };
}

describe("userRoom", () => {
  it("namespaces a user id into a room name", () => {
    expect(userRoom("u1")).toBe("user:u1");
  });
});

describe("createWebSocketServer", () => {
  it("rejects a handshake with no cookie header", () => {
    const io = createWebSocketServer({} as never, mockTokenIssuer(), "*") as unknown as InstanceType<typeof socketIoServerMock>;
    const middleware = io.handlers.get("middleware")!;
    const next = vi.fn();

    middleware({ handshake: { headers: {} }, data: {} }, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Authentication required" }));
  });

  it("rejects a handshake with an invalid token", () => {
    const tokenIssuer = mockTokenIssuer({
      verify: vi.fn().mockImplementation(() => {
        throw new Error("bad token");
      }),
    });
    const io = createWebSocketServer({} as never, tokenIssuer, "*") as unknown as InstanceType<typeof socketIoServerMock>;
    const middleware = io.handlers.get("middleware")!;
    const next = vi.fn();

    middleware({ handshake: { headers: { cookie: "token=bad" } }, data: {} }, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Invalid or expired token" }));
  });

  it("attaches userId to the socket and calls next on a valid token", () => {
    const tokenIssuer = mockTokenIssuer({ verify: vi.fn().mockReturnValue({ id: "u1", email: "a@b.com", username: "a", avatarUrl: null }) });
    const io = createWebSocketServer({} as never, tokenIssuer, "*") as unknown as InstanceType<typeof socketIoServerMock>;
    const middleware = io.handlers.get("middleware")!;
    const socket = { handshake: { headers: { cookie: "token=good" } }, data: {} as Record<string, unknown> };
    const next = vi.fn();

    middleware(socket, next);

    expect(socket.data.userId).toBe("u1");
    expect(next).toHaveBeenCalledWith();
  });

  it("joins the user's room on connection", () => {
    const io = createWebSocketServer({} as never, mockTokenIssuer(), "*") as unknown as InstanceType<typeof socketIoServerMock>;
    const onConnection = io.handlers.get("connection")!;
    const join = vi.fn();

    onConnection({ data: { userId: "u1" }, join });

    expect(join).toHaveBeenCalledWith("user:u1");
  });
});
