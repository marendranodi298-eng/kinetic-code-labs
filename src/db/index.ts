import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const url = process.env.TURSO_CONNECTION_URL || "file:data/database.db";
const authToken = process.env.TURSO_AUTH_TOKEN || "";

// Ensure the local data directory exists if running in local file mode
if (url.startsWith("file:")) {
  const dbDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
export type DatabaseInstance = typeof db;
export type Post = typeof schema.posts.$inferSelect;
export type NewPost = typeof schema.posts.$inferInsert;
