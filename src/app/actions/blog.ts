"use server";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { getAdminCredentials, setSession, deleteSession, getSession, encryptTemp, decryptTemp } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

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
  const otpInput = formData.get("otp") as string;

  const credentials = getAdminCredentials();
  const cookieStore = await cookies();

  // Get current failed attempts count
  const attemptsCookie = cookieStore.get("login_attempts")?.value;
  let attempts = attemptsCookie ? parseInt(attemptsCookie, 10) : 0;

  // Check if 2FA session is active and user has submitted code
  const tempSession = cookieStore.get("temp_auth_session")?.value;

  if (attempts >= 2 && tempSession) {
    const decrypted = await decryptTemp(tempSession);
    if (!decrypted) {
      return { 
        success: false, 
        requireOtp: true, 
        error: "2FA session expired. Please type your password again to receive a new code." 
      };
    }

    if (usernameInput === credentials.username && passwordInput === credentials.password) {
      if (otpInput === decrypted.otp) {
        // Correct password and OTP - Clear attempt status and log in
        cookieStore.delete("login_attempts");
        cookieStore.delete("temp_auth_session");
        await setSession(usernameInput);
        return { success: true, requireOtp: false, error: null };
      } else {
        return { 
          success: false, 
          requireOtp: true, 
          error: "Invalid 2FA code. Please enter the OTP sent to your Telegram bot." 
        };
      }
    } else {
      // Wrong credentials during 2FA mode - reset attempts count and session
      cookieStore.delete("temp_auth_session");
      cookieStore.set("login_attempts", "1");
      return { 
        success: false, 
        requireOtp: false, 
        error: "Invalid username or password." 
      };
    }
  }

  // Standard login attempt
  if (usernameInput === credentials.username && passwordInput === credentials.password) {
    // Reset login attempts on success
    cookieStore.delete("login_attempts");
    await setSession(usernameInput);
    return { success: true, requireOtp: false, error: null };
  }

  // Failed login attempt
  attempts += 1;
  cookieStore.set("login_attempts", attempts.toString(), { maxAge: 60 * 15 }); // 15 mins retention

  if (attempts >= 2) {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry
    const tempToken = await encryptTemp({ otp, expires: expires.toISOString() });
    
    cookieStore.set("temp_auth_session", tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 300,
      path: "/",
    });

    // Dispatch message to Telegram channel
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      
      if (token && chatId) {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🔒 *Kinetic Code Labs Control Center Alert*\n\n2FA security code has been triggered for admin access.\n\nYour 6-Digit OTP: *${otp}*\n\nThis code is valid for 5 minutes. If you did not request this, please secure your dashboard immediately.`,
            parse_mode: "Markdown",
          }),
        });
      }
    } catch (err) {
      console.error("Telegram send error:", err);
    }

    return {
      success: false,
      requireOtp: true,
      error: "Too many failed attempts. A 2FA verification code has been dispatched to your Telegram.",
    };
  }

  return {
    success: false,
    requireOtp: false,
    error: `Invalid username or password. (${2 - attempts} attempt(s) remaining before 2FA trigger)`,
  };
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
