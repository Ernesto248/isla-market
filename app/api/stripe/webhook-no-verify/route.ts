import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("🔥 WEBHOOK SIN VERIFICACIÓN - SOLO PARA DEBUG");

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    console.log("📋 Event type:", event.type);
    console.log("📋 Event ID:", event.id);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("💰 Session ID:", session.id);
      console.log("💰 Amount:", session.amount_total);
      console.log("💰 Customer:", session.customer_details?.email);
      console.log("💰 Metadata:", session.metadata);

      // Aquí podrías llamar a handleCheckoutSessionCompleted(session)
      // pero por ahora solo loggeamos para ver si llega la data correcta

      return NextResponse.json({
        received: true,
        message: "Webhook procesado sin verificación",
        session_id: session.id,
      });
    }

    return NextResponse.json({ received: true, event_type: event.type });
  } catch (error: any) {
    console.error("💥 Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
