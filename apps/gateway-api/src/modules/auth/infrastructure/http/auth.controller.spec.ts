import { describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller.js";
import type { RegisterUserUseCase } from "../../application/register-user.use-case.js";
import type { LoginUserUseCase } from "../../application/login-user.use-case.js";
import type { LoginWithGoogleUseCase } from "../../application/login-with-google.use-case.js";
import type { GetCurrentUserUseCase } from "../../application/get-current-user.use-case.js";
import { mockRequest, mockResponse } from "../../../../test/mockHttp.js";

function useCaseMock<T>(result: T) {
  return { execute: vi.fn().mockResolvedValue(result) };
}

const authResult = { token: "tok", userId: "u1", email: "a@b.com", username: "auser", avatarUrl: null };

describe("AuthController", () => {
  it("register sets the auth cookie and returns the user without the token", async () => {
    const registerUserUseCase = useCaseMock(authResult);
    const controller = new AuthController(
      registerUserUseCase as unknown as RegisterUserUseCase,
      useCaseMock(null) as unknown as LoginUserUseCase,
      useCaseMock(null) as unknown as LoginWithGoogleUseCase,
      useCaseMock(null) as unknown as GetCurrentUserUseCase,
    );
    const req = mockRequest({ body: { email: "a@b.com", username: "auser", password: "password1" } });
    const res = mockResponse();

    await controller.register(req, res);

    expect(registerUserUseCase.execute).toHaveBeenCalledWith({ email: "a@b.com", username: "auser", password: "password1" });
    expect(res.cookie).toHaveBeenCalledWith("token", "tok", expect.objectContaining({ httpOnly: true }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: "u1", email: "a@b.com", username: "auser", avatarUrl: null });
  });

  it("login sets the auth cookie and returns 200", async () => {
    const loginUserUseCase = useCaseMock(authResult);
    const controller = new AuthController(
      useCaseMock(null) as unknown as RegisterUserUseCase,
      loginUserUseCase as unknown as LoginUserUseCase,
      useCaseMock(null) as unknown as LoginWithGoogleUseCase,
      useCaseMock(null) as unknown as GetCurrentUserUseCase,
    );
    const req = mockRequest({ body: { email: "a@b.com", password: "password1" } });
    const res = mockResponse();

    await controller.login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("google sets the auth cookie and returns 200", async () => {
    const loginWithGoogleUseCase = useCaseMock(authResult);
    const controller = new AuthController(
      useCaseMock(null) as unknown as RegisterUserUseCase,
      useCaseMock(null) as unknown as LoginUserUseCase,
      loginWithGoogleUseCase as unknown as LoginWithGoogleUseCase,
      useCaseMock(null) as unknown as GetCurrentUserUseCase,
    );
    const req = mockRequest({ body: { idToken: "id-token" } });
    const res = mockResponse();

    await controller.google(req, res);

    expect(loginWithGoogleUseCase.execute).toHaveBeenCalledWith({ idToken: "id-token" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("logout clears the cookie and returns 204", async () => {
    const controller = new AuthController(
      useCaseMock(null) as unknown as RegisterUserUseCase,
      useCaseMock(null) as unknown as LoginUserUseCase,
      useCaseMock(null) as unknown as LoginWithGoogleUseCase,
      useCaseMock(null) as unknown as GetCurrentUserUseCase,
    );
    const res = mockResponse();

    await controller.logout(mockRequest(), res);

    expect(res.clearCookie).toHaveBeenCalledWith("token", expect.objectContaining({ httpOnly: true }));
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("me returns the current user using req.userId", async () => {
    const getCurrentUserUseCase = useCaseMock({ id: "u1", email: "a@b.com", username: "auser", avatarUrl: null });
    const controller = new AuthController(
      useCaseMock(null) as unknown as RegisterUserUseCase,
      useCaseMock(null) as unknown as LoginUserUseCase,
      useCaseMock(null) as unknown as LoginWithGoogleUseCase,
      getCurrentUserUseCase as unknown as GetCurrentUserUseCase,
    );
    const req = mockRequest({ userId: "u1" });
    const res = mockResponse();

    await controller.me(req, res);

    expect(getCurrentUserUseCase.execute).toHaveBeenCalledWith("u1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
