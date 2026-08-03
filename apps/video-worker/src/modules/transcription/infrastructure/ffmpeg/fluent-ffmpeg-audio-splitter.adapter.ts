import ffmpeg from "fluent-ffmpeg";
import type { AudioChunkFile, AudioSplitterPort } from "../../domain/ports/audio-splitter.port.js";

export class FluentFfmpegAudioSplitter implements AudioSplitterPort {
  async split(input: {
    audioFilePath: string;
    durationSeconds: number;
    sizeBytes: number;
    maxBytesPerChunk: number;
  }): Promise<AudioChunkFile[]> {
    const bytesPerSecond = input.sizeBytes / input.durationSeconds;
    const chunkDurationSeconds = Math.max(
      1,
      Math.floor(input.maxBytesPerChunk / bytesPerSecond),
    );
    const chunkCount = Math.ceil(input.durationSeconds / chunkDurationSeconds);

    const chunks: AudioChunkFile[] = [];

    for (let index = 0; index < chunkCount; index += 1) {
      const offsetSeconds = index * chunkDurationSeconds;
      const chunkFilePath = `${input.audioFilePath}.part${index}.mp3`;

      await new Promise<void>((resolve, reject) => {
        ffmpeg(input.audioFilePath)
          .setStartTime(offsetSeconds)
          .setDuration(chunkDurationSeconds)
          .audioCodec("libmp3lame")
          .on("end", () => resolve())
          .on("error", reject)
          .save(chunkFilePath);
      });

      chunks.push({ filePath: chunkFilePath, offsetSeconds });
    }

    return chunks;
  }
}
