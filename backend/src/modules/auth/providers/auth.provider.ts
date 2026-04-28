import { OAuthProvider } from "../../types/auth.types";
import { exchangeGithubCode, getGithubAuthUrl } from "./github";
import { exchangeGoogleCode, getGoogleAuthUrl } from "./google";
import { exchangeLinkedinCode, getLinkedinAuthUrl } from "./linkedin";

export const providers = {
  github: {
    getAuthUrl: getGithubAuthUrl,
    exchangeCode: exchangeGithubCode,
  },
  google: {
    getAuthUrl: getGoogleAuthUrl,
    exchangeCode: exchangeGoogleCode,
  },
  linkedin: {
    getAuthUrl: getLinkedinAuthUrl,
    exchangeCode: exchangeLinkedinCode,
  },
} satisfies Record<
  OAuthProvider,
  {
    getAuthUrl: (state: string) => Promise<string>;
    exchangeCode: (params: any) => Promise<any>;
  }
>;
