// import {
//   pgTable,
//   text,
//   timestamp,
//   uniqueIndex,
//   uuid,
// } from "drizzle-orm/pg-core";

// import { users } from "./users.js";

// export const accounts = pgTable(
//   "accounts",
//   {
//     id: uuid("id").defaultRandom().primaryKey(),

//     userId: uuid("user_id")
//       .notNull()
//       .references(() => users.id, { onDelete: "cascade" }),

//     provider: text("provider").notNull(), // google, facebook, etc.
//     providerAccountId: text("provider_account_id").notNull(),

//     accessToken: text("access_token"),
//     refreshToken: text("refresh_token"),

//     tokenType: text("token_type"), // 'Bearer'
//     scope: text("scope"),

//     expiresAt: timestamp("expires_at"),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//   },
//   (table) => ({
//     providerAccountUnique: uniqueIndex("accounts_provider_unique").on(
//       table.provider,
//       table.providerAccountId,
//     ),
//   }),
// );

import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),

    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),

    tokenType: text("token_type"),
    scope: text("scope"),

    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("accounts_provider_unique").on(
      table.provider,
      table.providerAccountId
    ),
  })
);

// 🔥 TIPOS
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;