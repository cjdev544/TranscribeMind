import { OAuth2Client } from "google-auth-library";
import { UnauthorizedError } from "../../../../shared/kernel/domain-error.js";
import type { GoogleProfile, GoogleTokenVerifierPort } from "../../domain/ports/google-token-verifier.port.js";

export class GoogleIdTokenVerifierAdapter implements GoogleTokenVerifierPort {
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    let payload;
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedError("Token de Google inválido");
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedError("Token de Google inválido");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
      avatarUrl: payload.picture ?? null,
    };
  }
}
