export interface User {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly passwordHash: string | null;
  readonly googleId: string | null;
  readonly avatarUrl: string | null;
  readonly createdAt: Date;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly username: string;
  readonly avatarUrl: string | null;
}
