import { db } from "../../db/client.js";
import { OAuthProfile } from "../types/auth.types.js";
import { createAccount } from "./createAccount.js";
import { createUser } from "./createUser.js";
import { findUserByEmail, findUserByProvider } from "./findUsers.js";



type FindOrCreateUserParams = {
  provider: string;
  profile: OAuthProfile;
};

export async function findOrCreateUser({
  provider,
  profile,
}: FindOrCreateUserParams) {
  return db.transaction(async (tx) => {
    const existingByProvider = await findUserByProvider(
      { provider, providerAccountId: profile.id },
      tx,
    );

    if (existingByProvider) return existingByProvider;

    if (profile.email) {
      const existingByEmail = await findUserByEmail(profile.email, tx);

      if (existingByEmail) {
        await createAccount(
          {
            userId: existingByEmail.id,
            provider,
            profile,
          },
          tx,
        );

        return existingByEmail;
      }
    }

    const newUser = await createUser({ profile }, tx);

    await createAccount(
      {
        userId: newUser.id,
        provider,
        profile,
      },
      tx,
    );

    return newUser;
  });
}
