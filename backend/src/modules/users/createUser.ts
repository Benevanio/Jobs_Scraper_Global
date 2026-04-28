import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { DB } from "../../db/types/types.js";
import { generateUsername } from "../../utils/generateUsername.js";
import { OAuthProfile } from "../types/auth.types.js";
import { findUserByEmail } from "./findUsers.js";

type CreateUserParams = {
  profile: OAuthProfile;
};

export async function createUser({ profile }: CreateUserParams, tx: DB = db) {
  const baseName =
    profile.username || profile.name || profile.email?.split("@")[0] || "user";

  const username = await generateUsername(baseName, tx);

  try {
    const result = await tx
      .insert(users)
      .values({
        email: profile.email ?? null,
        displayName: profile.name ?? null,
        firstName: profile.given_name ?? null,
        lastName: profile.family_name ?? null,
        avatarUrl: profile.picture ?? null,
        username,
      })
      .returning();

    return result[0];
  } catch (err: any) {
    if (err.code === "23505") {
      if (!profile.email) throw err;

      const existingUser = await findUserByEmail(profile.email, tx);
      if (!existingUser) throw err;

      return existingUser;
    }

    throw err;
  }
}
