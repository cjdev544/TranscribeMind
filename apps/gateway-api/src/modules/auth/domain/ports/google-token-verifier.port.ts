export interface GoogleProfile {
  readonly googleId: string;
  readonly email: string;
  readonly name: string | null;
  readonly avatarUrl: string | null;
}

export interface GoogleTokenVerifierPort {
  verify(idToken: string): Promise<GoogleProfile>;
}
