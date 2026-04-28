// import { NodePgDatabase } from "drizzle-orm/node-postgres";
// import * as schema from "../schema";

// export type Tx = NodePgDatabase<typeof schema>;

// import { db } from "../client";

// export type DB = typeof db;

import { ExtractTablesWithRelations } from "drizzle-orm";
import { NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "../schema";

export type DB =
  | NodePgDatabase<typeof schema>
  | PgTransaction<
      NodePgQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;