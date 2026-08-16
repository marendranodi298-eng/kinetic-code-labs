import { defineConfig } from "drizzle-kit";

// Automatically detect if we are using Turso Cloud or Local SQLite
const url = process.env.TURSO_CONNECTION_URL || "./data/database.db";
const isTurso = url.startsWith("libsql:") || url.startsWith("https:");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: {
    url: url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
