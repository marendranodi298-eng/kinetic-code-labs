import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").unique().notNull(), // Declare unique here to let Drizzle & SQLite manage the auto-index natively
    type: text("type").$type<"news" | "photo" | "video">().notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    mediaPublicId: text("media_public_id"),
    mediaWidth: integer("media_width"),
    mediaHeight: integer("media_height"),
    mediaType: text("media_type"),
    views: integer("views").notNull().default(0),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
  },
  (table) => [
    index("type_idx").on(table.type),
    index("published_idx").on(table.published),
    index("created_at_idx").on(table.createdAt),
    index("published_created_at_idx").on(table.published, table.createdAt),
    index("published_type_created_at_idx").on(table.published, table.type, table.createdAt),
  ]
);
