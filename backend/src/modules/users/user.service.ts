import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { userPreferences, users } from "../../db/schema";
import { DB } from "../../db/types/types";
import { UpdateProfileData, User } from "../types/user.types";

export class UserService {
  constructor(private readonly tx: DB = db) {}

  async getUserById(id: string): Promise<User | undefined> {
    return this.tx.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, id),
    });
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
    const result = await this.tx
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!result[0]) {
      throw new Error(`Usuário ${userId} não encontrado`);
    }

    return result[0];
  }

  async createDefaultPreferences(userId: string): Promise<void> {
    await this.tx.insert(userPreferences).values({ userId });
  }
}
