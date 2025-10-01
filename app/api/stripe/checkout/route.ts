import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { useAuth } from "@/contexts/auth-context";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer_email, success_url, cancel_url, metadata } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 }
      );
    }

    // Convertir items del carrito a line_items de Stripe
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          description: item.product.description || undefined,
          images: item.product.images ? [item.product.images[0]] : undefined,
          metadata: {
            product_id: item.product.id,
          },
        },
        unit_amount: Math.round(item.product.price * 100), // Convertir a centavos
      },
      quantity: item.quantity,
    }));

    // Crear checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url:
        success_url ||
        `${request.headers.get(
          "origin"
        )}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancel_url || `${request.headers.get("origin")}/checkout/cancel`,
      customer_email,
      metadata: {
        ...metadata,
        // Solo enviamos los datos esenciales del carrito (Stripe limita a 500 chars por valor)
        cart: JSON.stringify(
          items.map((item: any) => ({
            product_id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          }))
        ),
        source: "isla-market",
      },
      // Para pruebas, podemos usar US o remover completamente esta sección
      // shipping_address_collection: {
      //   allowed_countries: ["US"], // Para pruebas
      // },
      phone_number_collection: {
        enabled: true,
      },
      // Configurar para que expire en 30 minutos
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
