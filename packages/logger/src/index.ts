import pino, { type Logger } from "pino";

export function createLogger(serviceName: string): Logger {
  const isProduction = process.env.NODE_ENV === "production";

  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL ?? "info",
    transport: isProduction
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
  });
}

export type { Logger };
