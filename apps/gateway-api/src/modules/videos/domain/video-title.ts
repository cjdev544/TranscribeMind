import { DomainError } from "../../../shared/kernel/domain-error.js";

export const MAX_TITLE_LENGTH = 200;

/** Trims a user-supplied title and collapses blank input to null (falls back to the filename/URL). */
export function normalizeTitle(title: string | undefined): string | null {
  if (title === undefined) return null;

  const trimmed = title.trim();
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new DomainError(`El título no puede superar los ${MAX_TITLE_LENGTH} caracteres`, "VALIDATION_ERROR", 400);
  }

  return trimmed.length > 0 ? trimmed : null;
}
