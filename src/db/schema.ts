import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    type: text("type").$type<"news" | "photo" | "video">().notNull(), // 'news', 'photo', or 'video'
    summary: text("summary").notNull(),
    content: text("content").notNull(), // markdown or html content
    mediaUrl: text("media_url"), // Cloudinary URL
    mediaPublicId: text("media_public_id"), // Cloudinary public_id (used to delete files)
    mediaWidth: integer("media_width"),
    mediaHeight: integer("media_height"),
    mediaType: text("media_type"), // mime type e.g. image/jpeg, video/mp4
    views: integer("views").notNull().default(0),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(new Date()),
  },
  (table) => [
    uniqueIndex("slug_idx").on(table.slug),
    index("type_idx").on(table.type),
    index("published_idx").on(table.published),
    index("created_at_idx").on(table.createdAt),
    // Composite index for fast home page queries (filtering by published & sorting by date)
    index("published_created_at_idx").on(table.published, table.createdAt),
    // Composite index for type page queries
    index("published_type_created_at_idx").on(table.published, table.type, table.createdAt),
  ]
);
