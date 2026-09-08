import { vi } from "vitest";
import type { Request, Response } from "express";

export function mockResponse(): Response {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    send: vi.fn(),
    setHeader: vi.fn(),
    sendStatus: vi.fn(),
    destroy: vi.fn(),
    headersSent: false,
  } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  vi.mocked(res.cookie).mockReturnValue(res);
  vi.mocked(res.clearCookie).mockReturnValue(res);
  return res;
}

export function mockRequest(overrides: Partial<Request> = {}): Request {
  return { params: {}, body: {}, query: {}, cookies: {}, headers: {}, ...overrides } as Request;
}
