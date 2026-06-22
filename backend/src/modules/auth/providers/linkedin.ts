import { discovery } from "openid-client";
import { OAuthProfile } from "../../types/auth.types";

let _config: Awaited<ReturnType<typeof discovery>> | null = null;

async function getConfig() {
  if (_config) return _config;
  _config = await discovery(
    new URL("https://www.linkedin.com/oauth"),
    process.env.LINKEDIN_CLIENT_ID!,
    process.env.LINKEDIN_CLIENT_SECRET!,
  );
  return _config;
}

export async function getLinkedinAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL}/auth/linkedin/callback`,
    scope: "openid profile email",
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedinCode({
  code,
}: {
  code: string;
  state?: string;
}): Promise<OAuthProfile> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${process.env.APP_URL}/auth/linkedin/callback`,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  });

  const tokenRes = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    },
  );

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok)
    throw new Error(tokenData.error_description || "Token exchange failed");

  // Busca dados do usuário via userinfo
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();

  return {
    id: user.sub ?? "",
    email: user.email,
    name: user.name,
    given_name: user.given_name,
    family_name: user.family_name,
    picture: user.picture,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: tokenData.expires_in
      ? Math.floor(Date.now() / 1000) + tokenData.expires_in
      : undefined,
  };
}
