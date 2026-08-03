import type { NextFunction, Request, Response } from "express";
import { DomainError } from "../kernel/domain-error.js";
import type { Logger } from "@transcribemind/logger";

export function createErrorHandler(logger: Logger) {
  return function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (error instanceof DomainError) {
      res.status(error.httpStatus).json({ error: error.code, message: error.message });
      return;
    }

    logger.error({ err: error }, "Unhandled error in gateway-api");
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Something went wrong" });
  };
}
