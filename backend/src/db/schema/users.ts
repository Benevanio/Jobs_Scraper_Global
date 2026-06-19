import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    firstName: text("first_name"),
    lastName: text("last_name"),

    displayName: text("display_name"),
    username: text("username"),

    email: text("email"),
    emailVerified: boolean("email_verified").default(false).notNull(),

    avatarUrl: text("avatar_url"),
    phone: varchar("phone", { length: 20 }),
    cpf: varchar("cpf", { length: 14 }),
    technologies: text("technologies").array().default([]),
    level: varchar("level", { length: 50 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    usernameUnique: uniqueIndex("users_username_unique").on(table.username),
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
