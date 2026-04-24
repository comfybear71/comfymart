import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add Neon to Vercel Storage.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
export { schema };

/**
 * Run a block of queries with the current user injected as a Postgres
 * session variable. RLS policies read `current_setting('app.user_id', true)`
 * and refuse any row whose org the user doesn't belong to.
 *
 * Use this in every route handler / server action that touches tenant data.
 * Never use the bare `db` export inside user-facing code paths.
 */
export async function withUser<T>(
  userId: string,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
    return fn(tx as unknown as typeof db);
  });
}
