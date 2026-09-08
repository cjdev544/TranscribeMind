import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPage } from "./DashboardPage.js";
import { apiClient } from "../../shared/lib/api-client.js";
import { createWrapper } from "../../test/queryClientWrapper.js";

vi.mock("../../shared/lib/api-client.js", () => ({ apiClient: { get: vi.fn() } }));

let searchParamsValue = new URLSearchParams();
vi.mock("react-router-dom", () => ({ useSearchParams: () => [searchParamsValue, vi.fn()] }));

vi.mock("../video-results/ResultsPage.js", () => ({
  ResultsPage: ({ videoId }: { videoId: string }) => <div data-testid="results-page">{videoId}</div>,
}));
vi.mock("./components/VideoFilters.js", () => ({ VideoFilters: () => <div data-testid="video-filters" /> }));
vi.mock("./components/VideosTable.js", () => ({
  VideosTable: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="videos-table">{isLoading ? "loading" : "loaded"}</div>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    searchParamsValue = new URLSearchParams();
    vi.mocked(apiClient.get).mockClear();
  });

  it("shows the dashboard table and filters when there is no selected video", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("video-filters")).toBeInTheDocument();
    expect(screen.getByTestId("videos-table")).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith("/api/videos", { params: {} });
  });

  it("shows ResultsPage instead when a video is selected via search params", () => {
    searchParamsValue = new URLSearchParams({ video: "v1" });
    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByTestId("results-page")).toHaveTextContent("v1");
    expect(screen.queryByTestId("videos-table")).not.toBeInTheDocument();
  });
});
