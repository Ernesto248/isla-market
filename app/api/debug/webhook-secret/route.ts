import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const envSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const cliSecret =
    "whsec_db4900120d306bafde95ea932b4bda2fd2d0c91ef0862963c3026b46f9879788";

  return NextResponse.json({
    env_secret_configured: !!envSecret,
    env_secret_length: envSecret?.length || 0,
    env_secret_prefix: envSecret?.substring(0, 20) || "NOT_SET",
    cli_secret_length: cliSecret.length,
    cli_secret_prefix: cliSecret.substring(0, 20),
    secrets_match: envSecret === cliSecret,
    env_secret_full: envSecret, // Solo para debug - quitar en producción
  });
}
