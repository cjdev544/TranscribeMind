import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "../shared/lib/socket-client.js";
import { notifyVideoStatus } from "../shared/lib/notifications.js";
import { WS_EVENT_VIDEO_STATUS, VideoStatusValues, type VideoStatus } from "../shared/types/video.js";
import { useRealtimeStore } from "../stores/use-realtime-store.js";
import type { Video } from "../shared/types/video.js";

/** Matches the payload shape gateway-api's redis-status-bridge emits over Socket.io. */
interface VideoStatusPayload {
  id: string;
  status: VideoStatus;
  progress: number;
  error?: string;
}

/**
 * Mounted once at the app root. Bridges the single shared Socket.io
 * connection to both the Zustand realtime store (for components that only
 * need live status, e.g. the upload stepper) and the TanStack Query cache
 * (so the dashboard table and results page reflect the change without
 * polling).
 */
export function useVideoSocket(): void {
  const queryClient = useQueryClient();
  const setVideoState = useRealtimeStore((state) => state.setVideoState);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = getSocket();

    function handleStatus(payload: VideoStatusPayload) {
      setVideoState(payload.id, {
        status: payload.status,
        progress: payload.progress,
        error: payload.error,
      });

      queryClient.setQueryData<Video | undefined>(["video", payload.id], (existing) =>
        existing
          ? { ...existing, status: payload.status, progress: payload.progress, error: payload.error ?? null }
          : existing,
      );
      queryClient.invalidateQueries({ queryKey: ["videos"] });

      if (payload.status === VideoStatusValues.COMPLETED || payload.status === VideoStatusValues.FAILED) {
        // Best-effort title lookup — the dashboard list query is usually
        // warm since the user had to be on this app to have started the
        // upload in the first place; falls back to a generic label if not.
        const cachedVideos = queryClient.getQueryData<Video[]>(["videos"]);
        const title = cachedVideos?.find((video) => video.id === payload.id)?.title ?? "Tu video";

        notifyVideoStatus(
          payload.status === VideoStatusValues.COMPLETED ? "Video listo" : "El procesamiento falló",
          payload.status === VideoStatusValues.COMPLETED
            ? `"${title}" ya terminó de procesarse.`
            : `"${title}" falló al procesarse.`,
          () => navigate(`/dashboard?video=${payload.id}`),
        );
      }
    }

    socket.on(WS_EVENT_VIDEO_STATUS, handleStatus);
    return () => {
      socket.off(WS_EVENT_VIDEO_STATUS, handleStatus);
    };
  }, [queryClient, setVideoState, navigate]);
}
