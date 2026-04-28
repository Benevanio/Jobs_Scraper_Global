/** @type {import('drizzle-kit').Config} */
export default {
  schema: "./src/db/schema/index.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};

// import { defineConfig } from "drizzle-kit";

// export default defineConfig({
//   schema: "./src/db/schema/index.js",
//   out: "./src/db/migrations",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL,
//   },
// });
