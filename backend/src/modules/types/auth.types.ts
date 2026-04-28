export type OAuthProvider = "github" | "google" | "linkedin";

export type OAuthProfile = {
  id: string;
  email?: string | null;
  name?: string;
  username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
};


export type AuthCallbackParams = {
  provider: OAuthProvider;
  code: string;
  state: string;
};

export type Session = {
  accessToken: string;
  userId: string;
};
