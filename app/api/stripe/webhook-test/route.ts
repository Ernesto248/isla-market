import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("🧪 TEST WEBHOOK RECEIVED");

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    console.log("📊 Body type:", typeof body);
    console.log("📊 Body length:", body.length);
    console.log("📊 Signature:", signature?.substring(0, 30) + "...");
    console.log("📊 Secret configured:", !!endpointSecret);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature!, endpointSecret);
      console.log("✅ SUCCESS: Event verified:", event.type);
      return NextResponse.json({ received: true, event_type: event.type });
    } catch (err: any) {
      console.log("❌ FAILED: Verification error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (error: any) {
    console.log("💥 CRASH:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
