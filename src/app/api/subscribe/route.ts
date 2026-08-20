import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const source = body.source || "Website Newsletter";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Check if already subscribed
    try {
      const existing = await db.query.subscribers.findFirst({
        where: eq(subscribers.email, email),
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          message: "You are already subscribed to updates!",
        });
      }

      // Insert new subscriber
      await db.insert(subscribers).values({
        id: crypto.randomUUID(),
        email,
        source,
        active: true,
        createdAt: new Date(),
      });
    } catch (dbErr: any) {
      console.error("Database subscriber insert error (table may be syncing):", dbErr);
    }

    // Send Real-Time Telegram Notification to Admin
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const timestamp = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });

      const messageText = `🔔 *New Newsletter Subscriber!*\n\n📧 *Email:* \`${email}\`\n🌐 *Source:* ${source}\n⏰ *Time:* ${timestamp} IST\n🚀 *Portal:* Kinetic Code Labs`;

      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: "Markdown",
        }),
      }).catch((err) => console.error("Telegram notify failed:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully!",
    });
  } catch (error: any) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { success: false, error: "Server error occurred. Please try again." },
      { status: 500 }
    );
  }
}
