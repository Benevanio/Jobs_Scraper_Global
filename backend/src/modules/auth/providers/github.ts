import { OAuthProfile } from "../../types/auth.types";

export async function getGithubAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.APP_URL}/auth/github/callback`,
    scope: "read:user user:email",
    state,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeGithubCode({
  code,
}: {
  code: string;
}): Promise<OAuthProfile> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.APP_URL}/auth/github/callback`,
    }),
  });

  const { access_token } = await tokenRes.json();

  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${access_token}` },
    }),
  ]);

  const user = await userRes.json();
  const emails: any[] = await emailsRes.json();

  const primaryEmail = emails.find((e) => e.primary && e.verified)?.email;

  return {
    id: String(user.id),
    email: primaryEmail ?? user.email,
    name: user.name ?? user.login,
    username: user.login,
    picture: user.avatar_url,
    access_token,
  };
}
