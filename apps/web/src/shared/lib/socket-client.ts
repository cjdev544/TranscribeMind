import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/** Lazily creates a single shared socket connection, reused across the app. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL ?? "http://localhost:3000", {
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
}
