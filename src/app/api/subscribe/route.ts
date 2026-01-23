import { NextRequest, NextResponse } from "next/server";
import { db, subscriptions } from "@/lib/db";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, frequency } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const validFrequencies = ["weekly", "monthly"];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: "Frequency must be weekly or monthly" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.query.subscriptions.findFirst({
      where: (subs, { eq }) => eq(subs.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already subscribed" },
        { status: 400 }
      );
    }

    // Create new subscription
    const id = nanoid();
    const verificationToken = nanoid(32);
    const unsubscribeToken = nanoid(32);

    await db.insert(subscriptions).values({
      id,
      email,
      frequency,
      verificationToken,
      unsubscribeToken,
      verified: false,
      createdAt: new Date().toISOString(),
    });

    // TODO: Send verification email using Resend
    // For now, just mark as verified for testing
    await db
      .update(subscriptions)
      .set({ verified: true })
      .where(eq(subscriptions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
