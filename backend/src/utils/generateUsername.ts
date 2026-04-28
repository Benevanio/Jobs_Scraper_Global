import { DB } from "../db/types/types";


export async function generateUsername(
  base: string | undefined,
  dbOrTx: DB,
): Promise<string> {
  const normalizedBase = normalize(base);

  const safeBase = normalizedBase || "user";

  const exists = await dbOrTx.query.users.findFirst({
    where: (u, { eq }) => eq(u.username, safeBase),
  });

  if (!exists) return safeBase;

  const MAX_ATTEMPTS = 20;

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const username = `${safeBase}_${i}`;

    const existing = await dbOrTx.query.users.findFirst({
      where: (u, { eq }) => eq(u.username, username),
    });

    if (!existing) return username;
  }

  const randomSuffix = Math.floor(Math.random() * 10000);

  return `${safeBase}_${randomSuffix}`;
}

function normalize(str?: string): string {
  return (
    str
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 20) || ""
  );
}
