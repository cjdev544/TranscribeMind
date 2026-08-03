import type { Server as HttpServer } from "node:http";
import { Server as SocketIoServer } from "socket.io";
import { parse as parseCookieHeader } from "cookie";
import type { TokenIssuerPort } from "../../modules/auth/domain/ports/token-issuer.port.js";

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function createWebSocketServer(
  httpServer: HttpServer,
  tokenIssuer: TokenIssuerPort,
  corsOrigin: string,
): SocketIoServer {
  const io = new SocketIoServer(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.use((socket, next) => {
    // The JWT lives in an httpOnly cookie (same trust boundary as the REST
    // routes), so the browser can't read it to send it as a handshake auth
    // payload — it rides along automatically in the upgrade request's
    // Cookie header instead, as long as the client connects with
    // `withCredentials: true`.
    const cookieHeader = socket.handshake.headers.cookie;
    const token = cookieHeader ? parseCookieHeader(cookieHeader).token : undefined;

    if (!token) {
      next(new Error("Authentication required"));
      return;
    }

    try {
      const user = tokenIssuer.verify(token);
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.userId as string));
  });

  return io;
}

export { userRoom };
