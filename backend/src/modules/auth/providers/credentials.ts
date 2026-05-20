import * as argon2 from "argon2";
import { eq } from "drizzle-orm";
import { db } from "../../../db/client.js";
import { credentials } from "../../../db/schema/credentials.js";

export async function registerWithCredentials(
  email: string,
  password: string,
): Promise<void> {
  const existing = await db.query.credentials.findFirst({
    where: eq(credentials.email, email),
  });

  if (existing) {
    throw new Error("Email já cadastrado");
  }

  const passwordHash = await argon2.hash(password);

  await db.insert(credentials).values({
    email,
    passwordHash,
    userId: "",
  });
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ userId: string }> {
  const credential = await db.query.credentials.findFirst({
    where: eq(credentials.email, email),
  });

  if (!credential) {
    throw new Error("Credenciais inválidas");
  }

  const valid = await argon2.verify(credential.passwordHash, password);

  if (!valid) {
    throw new Error("Credenciais inválidas");
  }

  return { userId: credential.userId };
}
