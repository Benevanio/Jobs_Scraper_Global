import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  discovery,
} from "openid-client";
import { OAuthProfile } from "../../types/auth.types.js";


let _config: Awaited<ReturnType<typeof discovery>> | null = null;

async function getConfig() {
  if (_config) return _config;

  _config = await discovery(
    new URL("https://accounts.google.com"),
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
  );

  return _config;
}

export async function getGoogleAuthUrl(state: string): Promise<string> {
  const config = await getConfig();

  const url = buildAuthorizationUrl(config, {
    redirect_uri: `${process.env.APP_URL}/auth/google/callback`,
    scope: "openid email profile",
    state,
  });

  return url.href;
}

export async function exchangeGoogleCode({
  code,
  state,
}: {
  code: string;
  state: string;
}): Promise<OAuthProfile> {
  const config = await getConfig();

  const tokens = await authorizationCodeGrant(
    config,
    new URL(
      `${process.env.APP_URL}/auth/google/callback?code=${code}&state=${state}`,
    ),
  );

  const claims = tokens.claims();

  if (!claims || typeof claims !== "object") {
    throw new Error("Invalid Google claims");
  }

  // helper
  const getString = (value: unknown): string | undefined =>
    typeof value === "string" ? value : undefined;

  const getNumber = (value: unknown): number | undefined =>
    typeof value === "number" ? value : undefined;

  return {
    id: getString(claims.sub) ?? "",

    email: getString(claims.email),
    name: getString(claims.name),

    given_name: getString(claims.given_name),
    family_name: getString(claims.family_name),

    picture: getString(claims.picture),

    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,

    expires_at: getNumber(claims.exp),
  };
}
