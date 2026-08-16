"use server";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { getAdminCredentials, setSession, deleteSession, getSession } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Generate unique slug
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-alphanumeric/spaces/hyphens
    .replace(/[\s_-]+/g, "-") // replace multiple spaces/hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // remove leading/trailing hyphens

  let slug = baseSlug || "post";
  let count = 0;

  while (true) {
    const checkSlug = count === 0 ? slug : `${slug}-${count}`;
    const existing = await db.query.posts.findFirst({
      where: eq(posts.slug, checkSlug),
    });
    if (!existing) {
      return checkSlug;
    }
    count++;
  }
}

// 1. Admin Authentication Actions
export async function authenticateAdmin(prevState: any, formData: FormData) {
  const usernameInput = formData.get("username") as string;
  const passwordInput = formData.get("password") as string;

  const credentials = getAdminCredentials();

  if (usernameInput === credentials.username && passwordInput === credentials.password) {
    await setSession(usernameInput);
    return { success: true, error: null };
  }

  return { success: false, error: "Invalid username or password" };
}

export async function logoutAdmin() {
  await deleteSession();
  redirect("/admin/login");
}

// 2. Post CRUD Actions
export async function createBlogPost(formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as "news" | "photo" | "video";
  const published = formData.get("published") === "true";
  
  // Media info from Cloudinary (if uploaded)
  const mediaUrl = formData.get("mediaUrl") as string || null;
  const mediaPublicId = formData.get("mediaPublicId") as string || null;
  const mediaType = formData.get("mediaType") as string || null;
  const mediaWidth = formData.get("mediaWidth") ? parseInt(formData.get("mediaWidth") as string) : null;
  const mediaHeight = formData.get("mediaHeight") ? parseInt(formData.get("mediaHeight") as string) : null;

  if (!title || !summary || !content || !type) {
    throw new Error("Missing required fields");
  }

  const id = Math.random().toString(36).substring(2, 11); // Clean short ID
  const slug = await generateUniqueSlug(title);

  await db.insert(posts).values({
    id,
    title,
    slug,
    type,
    summary,
    content,
    mediaUrl,
    mediaPublicId,
    mediaType,
    mediaWidth,
    mediaHeight,
    published,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateBlogPost(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const type = formData.get("type") as "news" | "photo" | "video";
  const published = formData.get("published") === "true";
  
  // Media info
  const mediaUrl = formData.get("mediaUrl") as string || null;
  const mediaPublicId = formData.get("mediaPublicId") as string || null;
  const mediaType = formData.get("mediaType") as string || null;
  const mediaWidth = formData.get("mediaWidth") ? parseInt(formData.get("mediaWidth") as string) : null;
  const mediaHeight = formData.get("mediaHeight") ? parseInt(formData.get("mediaHeight") as string) : null;

  // If a new media was uploaded and there was an old media, we should clean up the old media in Cloudinary
  const oldPost = await db.query.posts.findFirst({
    where: eq(posts.id, id),
  });

  if (!oldPost) {
    throw new Error("Post not found");
  }

  if (oldPost.mediaPublicId && mediaPublicId !== oldPost.mediaPublicId) {
    // Delete old media from Cloudinary
    await deleteFromCloudinary(oldPost.mediaPublicId, oldPost.type === "video" ? "video" : "image");
  }

  const updateFields: any = {
    title,
    summary,
    content,
    type,
    published,
    updatedAt: new Date(),
  };

  // Only update media details if they are explicitly passed (or set to null if deleted)
  if (formData.has("mediaUrl")) {
    updateFields.mediaUrl = mediaUrl;
    updateFields.mediaPublicId = mediaPublicId;
    updateFields.mediaType = mediaType;
    updateFields.mediaWidth = mediaWidth;
    updateFields.mediaHeight = mediaHeight;
  }

  await db.update(posts).set(updateFields).where(eq(posts.id, id));

  revalidatePath("/");
  revalidatePath(`/blog/${oldPost.slug}`);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteBlogPost(id: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Delete media from Cloudinary
  if (post.mediaPublicId) {
    await deleteFromCloudinary(post.mediaPublicId, post.type === "video" ? "video" : "image");
  }

  await db.delete(posts).where(eq(posts.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function toggleBlogPostPublish(id: string, currentPublished: boolean) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await db
    .update(posts)
    .set({ published: !currentPublished, updatedAt: new Date() })
    .where(eq(posts.id, id));

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

// 3. User Interaction Actions
export async function incrementPostViews(id: string) {
  try {
    await db
      .update(posts)
      .set({ views: sql`${posts.views} + 1` })
      .where(eq(posts.id, id));
  } catch (error) {
    console.error("Failed to increment views:", error);
  }
}
