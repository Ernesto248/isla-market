import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("🔵 WEBHOOK RECEIVED AT:", new Date().toISOString());
  console.log(
    "🔑 Webhook secret configured:",
    !!process.env.STRIPE_WEBHOOK_SECRET
  );
  console.log(
    "🔑 Webhook secret prefix:",
    process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 12)
  );
  console.log("🌐 Request URL:", req.url);
  console.log("📋 Request method:", req.method);

  try {
    // Método alternativo para Next.js App Router
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature") as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    console.log("📝 Request body length:", rawBody.length);
    console.log("🔐 Signature present:", !!sig);
    console.log("🔐 Signature value:", sig?.substring(0, 20) + "...");

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      console.log("✅ Webhook signature verified successfully!");
    } catch (err: any) {
      console.error(`❌ Webhook Error: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        try {
          await handleCheckoutSessionCompleted(session);
        } catch (error) {
          console.error("Error processing checkout session:", error);
          return NextResponse.json(
            { error: "Failed to process order" },
            { status: 500 }
          );
        }
        break;
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent ${paymentIntent.id} succeeded!`);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log("Processing completed checkout session:", session.id);

    const supabaseAdmin = createSupabaseAdmin();

    // Extraer información del customer y metadata
    const customerEmail = session.customer_details?.email;
    const customerName = session.metadata?.customer_name;
    const customerPhone = session.metadata?.customer_phone;
    const recipientName = session.metadata?.recipient_name;
    const recipientAddress = session.metadata?.recipient_address;
    const cartItems = JSON.parse(session.metadata?.cart || "[]");
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

    if (!customerEmail || !cartItems.length || !totalAmount) {
      throw new Error("Missing essential data for order creation");
    }

    console.log("Processing order for:", customerEmail, "Total:", totalAmount);

    // 0. Check if order already exists for this session
    const { data: existingOrder } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .single();

    if (existingOrder) {
      console.log(
        "⚠️ Order already exists for session:",
        session.id,
        "- skipping creation"
      );
      return;
    }

    // 1. Find or create user in auth.users and public.users
    let userId: string;
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (userError && userError.code === "PGRST116") {
      // No rows found
      // Create user in auth.users (if not already there from previous auth flow)
      const { data: authUserData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          user_metadata: {
            full_name: customerName,
          },
        });

      if (authError) {
        console.error("Error creating auth user:", authError);
        throw authError;
      }
      userId = authUserData.user!.id;

      // Create user in public.users table
      const { error: publicUserError } = await supabaseAdmin
        .from("users")
        .insert({
          id: userId,
          email: customerEmail,
          full_name: customerName,
          role: "customer",
        });

      if (publicUserError) {
        console.error("Error creating public user:", publicUserError);
        throw publicUserError;
      }
    } else if (userError) {
      console.error("Error fetching existing user:", userError);
      throw userError;
    } else {
      userId = existingUser.id;
    }

    // 2. Create shipping address
    const [firstName, lastName] = recipientName?.split(" ") || ["", ""];
    const addressParts = recipientAddress?.split(", ") || [];
    const street = addressParts[0]?.split("#")[0]?.trim();
    const houseNumber = addressParts[0]?.split("#")[1]?.trim();
    const betweenStreets = addressParts[1]?.trim();
    const neighborhood = addressParts[2]?.trim();
    const province = addressParts[3]?.trim();

    const { data: shippingAddress, error: shippingError } = await supabaseAdmin
      .from("shipping_addresses")
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        phone: customerPhone,
        street: street,
        house_number: houseNumber,
        between_streets: betweenStreets,
        neighborhood: neighborhood,
        province: province,
        is_default: false, // Can be updated later
      })
      .select()
      .single();

    if (shippingError) {
      console.error("Error creating shipping address:", shippingError);
      throw shippingError;
    }

    // 3. Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        shipping_address_id: shippingAddress.id,
        total_amount: totalAmount,
        status: "paid", // Set status to paid
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_session_id: session.id,
        notes: "Order placed via Stripe checkout",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw orderError;
    }

    // 4. Create order items
    const orderItems = cartItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id, // Usando los datos simplificados
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.quantity * item.price,
    }));

    const { error: orderItemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      console.error("Error creating order items:", orderItemsError);
      throw orderItemsError;
    }

    // 5. Reducir stock de productos
    console.log("Reducing stock for", cartItems.length, "products");
    for (const item of cartItems) {
      // Usar SQL directo para reducir stock de manera atómica
      const { error: stockError } = await supabaseAdmin.rpc(
        "reduce_product_stock",
        {
          product_id: item.product_id,
          quantity_to_reduce: item.quantity,
        }
      );

      if (stockError) {
        console.error(
          `Error reducing stock for product ${item.product_id}:`,
          stockError
        );
        // No fallar completamente por errores de stock, pero log para monitoring
      } else {
        console.log(
          `✅ Stock reduced for product ${item.product_id}: -${item.quantity}`
        );
      }
    }

    console.log(`Order ${order.id} created successfully for user ${userId}`);
  } catch (error) {
    console.error("Error processing checkout.session.completed:", error);
    throw error; // Re-throw para que sea manejado por el caller
  }
}
