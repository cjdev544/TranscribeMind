import type { Readable } from "node:stream";

export interface DownloadedObject {
  body: Readable;
  contentType: string;
  contentLength: number;
  /** 206 when `range` was honored (partial content), 200 for a full-object read. */
  statusCode: 200 | 206;
  contentRange?: string;
}

export interface ObjectStoragePort {
  upload(input: { key: string; body: Buffer; contentType: string }): Promise<void>;
  delete(key: string): Promise<void>;
  /** `range` is an HTTP Range header value (e.g. "bytes=0-1023"), forwarded as-is for video scrubbing support. */
  download(input: { key: string; range?: string }): Promise<DownloadedObject>;
}
