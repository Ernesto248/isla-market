import Stripe from "stripe";

// Verificar que la API key esté configurada
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not configured in environment variables"
  );
}

console.log(
  "Stripe Secret Key configured:",
  stripeSecretKey.substring(0, 12) + "..."
);

// Configuración de Stripe para el servidor
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});

// Configuración para el cliente (frontend)
export const getStripePublishableKey = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
  }
  return key;
};

// Configuración del webhook
export const getStripeWebhookSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return secret;
};
