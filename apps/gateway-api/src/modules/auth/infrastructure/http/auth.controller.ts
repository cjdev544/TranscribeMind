import type { Request, Response } from "express";
import type { RegisterUserUseCase } from "../../application/register-user.use-case.js";
import type { LoginUserUseCase } from "../../application/login-user.use-case.js";
import type { LoginWithGoogleUseCase } from "../../application/login-with-google.use-case.js";
import type { GetCurrentUserUseCase } from "../../application/get-current-user.use-case.js";
import { env } from "../../../../shared/infrastructure/env.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.COOKIE_SECURE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // Without an explicit path, browsers default it to the directory of the
  // request that set it (e.g. "/api/auth/") per RFC 6265 — the cookie would
  // then never be sent on /api/videos requests, or after a fresh reload that
  // re-resolves it from scratch. Pin it to the whole site.
  path: "/",
};

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly loginWithGoogleUseCase: LoginWithGoogleUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const { email, username, password } = req.body as { email: string; username: string; password: string };
    const { token, userId, ...user } = await this.registerUserUseCase.execute({ email, username, password });
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(201).json({ id: userId, ...user });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body as { email: string; password: string };
    const { token, userId, ...user } = await this.loginUserUseCase.execute({ email, password });
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(200).json({ id: userId, ...user });
  };

  google = async (req: Request, res: Response): Promise<void> => {
    const { idToken } = req.body as { idToken: string };
    const { token, userId, ...user } = await this.loginWithGoogleUseCase.execute({ idToken });
    res.cookie("token", token, COOKIE_OPTIONS);
    res.status(200).json({ id: userId, ...user });
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie("token", COOKIE_OPTIONS);
    res.status(204).send();
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.getCurrentUserUseCase.execute(req.userId!);
    res.status(200).json(user);
  };
}
