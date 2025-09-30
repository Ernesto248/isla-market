import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    stripe_secret_configured: !!process.env.STRIPE_SECRET_KEY,
    stripe_secret_prefix:
      process.env.STRIPE_SECRET_KEY?.substring(0, 12) || "NOT_SET",
    stripe_publishable_configured:
      !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripe_publishable_prefix:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) ||
      "NOT_SET",
    stripe_webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripe_webhook_prefix:
      process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 12) || "NOT_SET",
    supabase_url_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
