export type AudioExtractionProgressListener = (percent: number) => void;

export interface AudioExtractorPort {
  /** Extracts a compressed mono audio track (mp3) optimized for speech transcription. */
  extract(
    videoFilePath: string,
    onProgress?: AudioExtractionProgressListener,
  ): Promise<{ audioFilePath: string; sizeBytes: number; durationSeconds: number }>;
}
