import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import type { VideoDownloaderPort } from "../../domain/ports/video-downloader.port.js";

export interface S3VideoDownloaderConfig {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export class S3VideoDownloaderAdapter implements VideoDownloaderPort {
  private readonly client: S3Client;

  constructor(private readonly config: S3VideoDownloaderConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async download(s3Key: string): Promise<{ filePath: string }> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: s3Key }),
    );

    const workDir = join(tmpdir(), "transcribemind");
    await mkdir(workDir, { recursive: true });
    const filePath = join(workDir, `${Date.now()}-${s3Key.replace(/\//g, "_")}`);

    await pipeline(response.Body as Readable, createWriteStream(filePath));

    return { filePath };
  }
}
