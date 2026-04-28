import { db } from "../../db/client.js";
import { DB } from "../../db/types/types.js";

export async function findUserByProvider(
  {
    provider,
    providerAccountId,
  }: { provider: string; providerAccountId: string },
  tx: DB = db,
) {
  const existingAccount = await tx.query.accounts.findFirst({
    where: (acc, { eq, and }) =>
      and(
        eq(acc.provider, provider),
        eq(acc.providerAccountId, providerAccountId),
      ),
  });

  if (!existingAccount) return null;

  return tx.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, existingAccount.userId),
  });
}

export async function findUserByEmail(email: string, tx: DB = db) {
  return tx.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });
}
