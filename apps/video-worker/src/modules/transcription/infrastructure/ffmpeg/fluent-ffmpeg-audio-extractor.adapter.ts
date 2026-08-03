import { stat } from "node:fs/promises";
import ffmpeg from "fluent-ffmpeg";
import type { AudioExtractionProgressListener, AudioExtractorPort } from "../../domain/ports/audio-extractor.port.js";

function probeDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.format.duration ?? 0);
    });
  });
}

// "HH:MM:SS.ss" as reported by ffmpeg's progress events.
function parseTimemarkSeconds(timemark: string): number {
  const [hours = "0", minutes = "0", seconds = "0"] = timemark.split(":");
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

export class FluentFfmpegAudioExtractor implements AudioExtractorPort {
  async extract(
    videoFilePath: string,
    onProgress?: AudioExtractionProgressListener,
  ): Promise<{ audioFilePath: string; sizeBytes: number; durationSeconds: number }> {
    const audioFilePath = `${videoFilePath}.mp3`;

    // fluent-ffmpeg's own progress.percent is unreliable for audio-only
    // extraction (it needs frame-count based estimation that doesn't apply
    // here), so the source duration is probed upfront and progress is
    // derived from the processed timemark against it instead.
    const sourceDurationSeconds = await probeDurationSeconds(videoFilePath).catch(() => 0);
    let lastReportedPercent = -1;

    const durationSeconds = await new Promise<number>((resolve, reject) => {
      const command = ffmpeg(videoFilePath)
        .noVideo()
        .audioCodec("libmp3lame")
        .audioChannels(1)
        .audioBitrate("64k")
        .on("end", () => {
          ffmpeg.ffprobe(audioFilePath, (err, data) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(data.format.duration ?? 0);
          });
        })
        .on("error", reject);

      if (onProgress && sourceDurationSeconds > 0) {
        command.on("progress", (progress) => {
          if (!progress.timemark) return;
          const percent = Math.min(99, Math.round((parseTimemarkSeconds(progress.timemark) / sourceDurationSeconds) * 100));
          if (percent !== lastReportedPercent) {
            lastReportedPercent = percent;
            onProgress(percent);
          }
        });
      }

      command.save(audioFilePath);
    });

    const { size } = await stat(audioFilePath);

    return { audioFilePath, sizeBytes: size, durationSeconds };
  }
}
