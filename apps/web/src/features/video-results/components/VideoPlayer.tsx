import { forwardRef } from "react";
import { apiClient } from "../../../shared/lib/api-client.js";

export const VideoPlayer = forwardRef<HTMLVideoElement, { videoId: string }>(function VideoPlayer(
  { videoId },
  ref,
) {
  const src = `${apiClient.defaults.baseURL}/api/videos/${videoId}/video`;

  return (
    // Auth is a cookie on a different port (cross-origin from the SPA), so
    // crossOrigin="use-credentials" is required or the browser won't attach
    // it and every request 401s. gateway-api's CORS response already sends
    // a specific origin + Access-Control-Allow-Credentials, which this needs.
    // max-h caps the player so it can never push the transcript/chapters
    // grid below it down to zero height on shorter viewports.
    <video
      ref={ref}
      src={src}
      controls
      preload="metadata"
      crossOrigin="use-credentials"
      className="max-h-[40vh] w-full rounded-lg bg-black object-contain"
    />
  );
});
