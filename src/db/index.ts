import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Ensure the data directory exists in the project root
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "database.db");
const sqlite = new Database(dbPath);

// Enable Write-Ahead Logging (WAL) mode for fast concurrent operations
sqlite.pragma("journal_mode = WAL");
// Optimize synchronization mode for high write speeds
sqlite.pragma("synchronous = NORMAL");
// Set busy timeout to prevent locking exceptions under high load
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });
export type DatabaseInstance = typeof db;
export type Post = typeof schema.posts.$inferSelect;
export type NewPost = typeof schema.posts.$inferInsert;
