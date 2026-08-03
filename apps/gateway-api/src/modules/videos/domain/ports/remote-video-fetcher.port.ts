export interface FetchedRemoteVideo {
  filename: string;
  contentType: string;
  buffer: Buffer;
}

export type RemoteVideoFetchProgressListener = (percent: number) => void;

export interface RemoteVideoFetcherPort {
  fetch(url: string, onProgress?: RemoteVideoFetchProgressListener): Promise<FetchedRemoteVideo>;
}
