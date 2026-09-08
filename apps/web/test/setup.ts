import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Unset by default so GoogleSignInButton doesn't try to load the real Google
// script (network call, non-deterministic) in specs that don't care about it.
// A spec exercising the Google sign-in flow can vi.stubEnv a fake id locally.
vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");

// jsdom doesn't implement scrollTo; components that auto-scroll a container
// (e.g. ChatPanel) would otherwise throw when the effect runs.
Element.prototype.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
});
