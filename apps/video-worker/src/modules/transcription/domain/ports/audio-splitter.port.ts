export interface AudioChunkFile {
  readonly filePath: string;
  readonly offsetSeconds: number;
}

export interface AudioSplitterPort {
  /** Splits an audio file into chunks whose duration keeps each one under maxBytesPerChunk. */
  split(input: {
    audioFilePath: string;
    durationSeconds: number;
    sizeBytes: number;
    maxBytesPerChunk: number;
  }): Promise<AudioChunkFile[]>;
}
