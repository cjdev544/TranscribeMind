import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { VideoPlayer } from "./VideoPlayer.js";

vi.mock("../../../shared/lib/api-client.js", () => ({
  apiClient: { defaults: { baseURL: "http://localhost:3000" } },
}));

describe("VideoPlayer", () => {
  it("points the video src at the gateway-api stream endpoint", () => {
    const { container } = render(<VideoPlayer videoId="v1" />);
    const video = container.querySelector("video");

    expect(video).toHaveAttribute("src", "http://localhost:3000/api/videos/v1/video");
  });

  it("sends credentials cross-origin so the auth cookie is attached", () => {
    const { container } = render(<VideoPlayer videoId="v1" />);
    expect(container.querySelector("video")).toHaveAttribute("crossorigin", "use-credentials");
  });

  it("forwards the ref to the underlying video element", () => {
    const ref = createRef<HTMLVideoElement>();
    render(<VideoPlayer videoId="v1" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLVideoElement);
  });
});
