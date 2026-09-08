import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useVideoSocket } from "./use-video-socket.js";
import { WS_EVENT_VIDEO_STATUS, VideoStatusValues } from "../shared/types/video.js";
import { useRealtimeStore } from "../stores/use-realtime-store.js";
import { createQueryClient, createWrapper } from "../test/queryClientWrapper.js";

const { mockSocket, notifyVideoStatusMock, navigateMock } = vi.hoisted(() => {
  const handlers = new Map<string, (payload: unknown) => void>();
  return {
    mockSocket: {
      handlers,
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        handlers.set(event, handler);
      }),
      off: vi.fn((event: string) => {
        handlers.delete(event);
      }),
    },
    notifyVideoStatusMock: vi.fn(),
    navigateMock: vi.fn(),
  };
});

vi.mock("../shared/lib/socket-client.js", () => ({ getSocket: () => mockSocket }));
vi.mock("../shared/lib/notifications.js", () => ({ notifyVideoStatus: notifyVideoStatusMock }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigateMock }));

function emitStatus(payload: unknown) {
  const handler = mockSocket.handlers.get(WS_EVENT_VIDEO_STATUS);
  if (!handler) throw new Error("no handler registered");
  act(() => handler(payload));
}

describe("useVideoSocket", () => {
  beforeEach(() => {
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.handlers.clear();
    notifyVideoStatusMock.mockClear();
    navigateMock.mockClear();
    useRealtimeStore.setState({ byVideoId: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("subscribes on mount and unsubscribes on unmount", () => {
    const { unmount } = renderHook(() => useVideoSocket(), { wrapper: createWrapper() });

    expect(mockSocket.on).toHaveBeenCalledWith(WS_EVENT_VIDEO_STATUS, expect.any(Function));

    unmount();

    expect(mockSocket.off).toHaveBeenCalledWith(WS_EVENT_VIDEO_STATUS, expect.any(Function));
  });

  it("writes the incoming status into the realtime store", () => {
    renderHook(() => useVideoSocket(), { wrapper: createWrapper() });

    emitStatus({ id: "v1", status: VideoStatusValues.TRANSCRIBING, progress: 42 });

    expect(useRealtimeStore.getState().byVideoId.v1).toEqual({
      status: VideoStatusValues.TRANSCRIBING,
      progress: 42,
      error: undefined,
    });
  });

  it("patches an existing ['video', id] cache entry in place", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["video", "v1"], { id: "v1", status: VideoStatusValues.QUEUED, progress: 0 });
    renderHook(() => useVideoSocket(), { wrapper: createWrapper(queryClient) });

    emitStatus({ id: "v1", status: VideoStatusValues.TRANSCRIBING, progress: 60 });

    expect(queryClient.getQueryData(["video", "v1"])).toEqual({
      id: "v1",
      status: VideoStatusValues.TRANSCRIBING,
      progress: 60,
      error: null,
    });
  });

  it("leaves the cache untouched when there is no existing entry for that video", () => {
    const queryClient = createQueryClient();
    renderHook(() => useVideoSocket(), { wrapper: createWrapper(queryClient) });

    emitStatus({ id: "v1", status: VideoStatusValues.TRANSCRIBING, progress: 60 });

    expect(queryClient.getQueryData(["video", "v1"])).toBeUndefined();
  });

  it("invalidates the videos list on every status update", () => {
    const queryClient = createQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderHook(() => useVideoSocket(), { wrapper: createWrapper(queryClient) });

    emitStatus({ id: "v1", status: VideoStatusValues.TRANSCRIBING, progress: 60 });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["videos"] });
  });

  it("notifies on completion using the cached title, and navigates on click", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["videos"], [{ id: "v1", title: "Mi video" }]);
    renderHook(() => useVideoSocket(), { wrapper: createWrapper(queryClient) });

    emitStatus({ id: "v1", status: VideoStatusValues.COMPLETED, progress: 100 });

    expect(notifyVideoStatusMock).toHaveBeenCalledWith(
      "Video listo",
      '"Mi video" ya terminó de procesarse.',
      expect.any(Function)
    );

    const onClick = notifyVideoStatusMock.mock.calls[0]![2] as () => void;
    onClick();
    expect(navigateMock).toHaveBeenCalledWith("/dashboard?video=v1");
  });

  it("falls back to a generic title when the video is not in the cached list", () => {
    const queryClient = createQueryClient();
    renderHook(() => useVideoSocket(), { wrapper: createWrapper(queryClient) });

    emitStatus({ id: "v1", status: VideoStatusValues.FAILED, progress: 60, error: "boom" });

    expect(notifyVideoStatusMock).toHaveBeenCalledWith(
      "El procesamiento falló",
      '"Tu video" falló al procesarse.',
      expect.any(Function)
    );
  });

  it("does not notify for non-terminal status updates", () => {
    const queryClient = createQueryClient();
    renderHook(() => useVideoSocket(), { wrapper: createWrapper(queryClient) });

    emitStatus({ id: "v1", status: VideoStatusValues.TRANSCRIBING, progress: 60 });

    expect(notifyVideoStatusMock).not.toHaveBeenCalled();
  });
});
