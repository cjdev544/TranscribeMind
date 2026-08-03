import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./query-client.js";
import { AppRouter } from "./router.js";
import { useVideoSocket } from "../sockets/use-video-socket.js";

function RealtimeBridge() {
  useVideoSocket();
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RealtimeBridge />
        <AppRouter />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
