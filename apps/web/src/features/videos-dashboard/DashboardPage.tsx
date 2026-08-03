import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { VideoFilters } from "./components/VideoFilters.js";
import { VideosTable } from "./components/VideosTable.js";
import { useVideosQuery } from "./api/use-videos-query.js";
import type { VideoStatus } from "../../shared/types/video.js";
import { ResultsPage } from "../video-results/ResultsPage.js";

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("video");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VideoStatus | undefined>(undefined);
  const { data: videos = [], isLoading } = useVideosQuery({ search: search || undefined, status });

  if (videoId) {
    return <ResultsPage videoId={videoId} />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <VideoFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />
      <div className="rounded-lg border border-border">
        <VideosTable videos={videos} isLoading={isLoading} />
      </div>
    </div>
  );
}
