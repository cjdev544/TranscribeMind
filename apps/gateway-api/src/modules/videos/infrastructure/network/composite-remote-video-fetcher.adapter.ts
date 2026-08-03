import type { Logger } from "@transcribemind/logger";
import type {
  FetchedRemoteVideo,
  RemoteVideoFetchProgressListener,
  RemoteVideoFetcherPort,
} from "../../domain/ports/remote-video-fetcher.port.js";
import { isYoutubeUrl, YtDlpRemoteVideoFetcherAdapter } from "./ytdlp-remote-video-fetcher.adapter.js";
import { FetchRemoteVideoAdapter } from "./fetch-remote-video.adapter.js";

export class CompositeRemoteVideoFetcherAdapter implements RemoteVideoFetcherPort {
  private readonly ytDlpFetcher: YtDlpRemoteVideoFetcherAdapter;
  private readonly directFetcher = new FetchRemoteVideoAdapter();

  constructor(logger: Logger) {
    this.ytDlpFetcher = new YtDlpRemoteVideoFetcherAdapter(logger);
  }

  fetch(url: string, onProgress?: RemoteVideoFetchProgressListener): Promise<FetchedRemoteVideo> {
    return isYoutubeUrl(url) ? this.ytDlpFetcher.fetch(url, onProgress) : this.directFetcher.fetch(url, onProgress);
  }
}
