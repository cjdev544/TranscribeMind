import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginPage } from "./login-page.js";

vi.mock("../../features/auth/components/LoginForm.js", () => ({ LoginForm: () => <div data-testid="login-form" /> }));
vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

describe("LoginPage", () => {
  it("renders the login form and a link to register", () => {
    render(<LoginPage />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Regístrate" })).toHaveAttribute("href", "/register");
  });
});
