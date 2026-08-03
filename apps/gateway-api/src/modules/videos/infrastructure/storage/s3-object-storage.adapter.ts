import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import type { DownloadedObject, ObjectStoragePort } from "../../domain/ports/object-storage.port.js";

export interface S3ObjectStorageConfig {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export class S3ObjectStorageAdapter implements ObjectStoragePort {
  private readonly client: S3Client;

  constructor(private readonly config: S3ObjectStorageConfig) {
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // The SDK's default (WHEN_SUPPORTED) validates the response body against
      // a checksum computed for the *whole* object — which a ranged GetObject
      // (used for video scrubbing) can never match, since it only returns part
      // of the bytes. That mismatch throws on the response stream with no
      // handler attached anywhere in the call chain, which is an unhandled
      // 'error' event Node treats as fatal — it took the whole process down,
      // not just the one request, the first time a client seeked the player.
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  async upload(input: { key: string; body: Buffer; contentType: string }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }

  async download(input: { key: string; range?: string }): Promise<DownloadedObject> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: input.key, Range: input.range }),
    );

    return {
      body: response.Body as Readable,
      contentType: response.ContentType ?? "application/octet-stream",
      contentLength: response.ContentLength ?? 0,
      statusCode: response.ContentRange ? 206 : 200,
      contentRange: response.ContentRange,
    };
  }
}
