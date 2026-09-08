import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRouter } from "./router.js";

vi.mock("./pages/login-page.js", () => ({ LoginPage: () => <div>login page</div> }));
vi.mock("./pages/register-page.js", () => ({ RegisterPage: () => <div>register page</div> }));
vi.mock("./protected-route.js", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./app-shell.js", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("../features/videos-dashboard/DashboardPage.js", () => ({
  DashboardPage: () => <div>dashboard page</div>,
}));
vi.mock("../features/video-upload/UploadPage.js", () => ({ UploadPage: () => <div>upload page</div> }));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter />
    </MemoryRouter>
  );
}

describe("AppRouter", () => {
  it("renders the login page at /login", () => {
    renderAt("/login");
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the register page at /register", () => {
    renderAt("/register");
    expect(screen.getByText("register page")).toBeInTheDocument();
  });

  it("renders the dashboard behind the protected route and shell at /dashboard", () => {
    renderAt("/dashboard");
    expect(screen.getByText("dashboard page")).toBeInTheDocument();
  });

  it("renders the upload page behind the protected route and shell at /upload", () => {
    renderAt("/upload");
    expect(screen.getByText("upload page")).toBeInTheDocument();
  });

  it("redirects unknown routes to the dashboard", () => {
    renderAt("/some/unknown/path");
    expect(screen.getByText("dashboard page")).toBeInTheDocument();
  });
});
