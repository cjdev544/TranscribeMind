export interface VideoDownloaderPort {
  download(s3Key: string): Promise<{ filePath: string }>;
}
