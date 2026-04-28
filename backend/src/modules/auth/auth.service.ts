import type {
  AuthCallbackParams,
  OAuthProfile,
  OAuthProvider,
  Session,
} from "../types/auth.types";
import { findOrCreateUser } from "../users/findOrCreateUser";
import { providers } from "./providers/auth.provider";

export class AuthService {
  async getAuthUrl(provider: OAuthProvider, state: string): Promise<string> {
    const providerImpl = providers[provider];

    if (!providerImpl) {
      throw new Error("Provider inválido");
    }

    return providerImpl.getAuthUrl(state);
  }

  async handleCallback({ provider, code, state }: AuthCallbackParams): Promise<{
    user: any; // vamos melhorar isso depois
    session: Session;
  }> {
    const profile = await this.getProfileFromProvider({
      provider,
      code,
      state,
    });

    const user = await findOrCreateUser({
      provider,
      profile,
    });

    const session = await this.createSession(user);

    return { user, session };
  }

  async getProfileFromProvider({
    provider,
    code,
    state,
  }: AuthCallbackParams): Promise<OAuthProfile> {
    const providerImpl = providers[provider];

    if (!providerImpl) {
      throw new Error("Provider inválido");
    }

    return providerImpl.exchangeCode({ code, state });
  }

  async createSession(user: { id: string }): Promise<Session> {
    return {
      accessToken: "jwt-aqui",
      userId: user.id,
    };
  }
}
