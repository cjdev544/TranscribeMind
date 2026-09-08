import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegisterPage } from "./register-page.js";

vi.mock("../../features/auth/components/RegisterForm.js", () => ({
  RegisterForm: () => <div data-testid="register-form" />,
}));
vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

describe("RegisterPage", () => {
  it("renders the register form and a link to login", () => {
    render(<RegisterPage />);

    expect(screen.getByTestId("register-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicia sesión" })).toHaveAttribute("href", "/login");
  });
});
