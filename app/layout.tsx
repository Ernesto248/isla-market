import "./globals.css";
import type { Metadata } from "next";
import { Inter, Aleo } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthModalProvider } from "@/contexts/auth-modal-context";
import { GlobalAuthModal } from "@/components/auth/global-auth-modal";
import { SessionRefresher } from "@/components/auth/session-refresher";
import { CartGuard } from "@/components/cart/cart-guard";
import { ReferralCapture } from "@/components/referral-capture";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

const aleo = Aleo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-aleo",
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://isla-market.vercel.app"
  ),
  title: "Isla Market",
  description:
    "Compra electrónicos, artículos para el hogar y alimentos para enviar a tus seres queridos en Cuba",
  icons: {
    icon: "/icono.png",
    shortcut: "/icono.png",
    apple: "/icono.png",
  },
  openGraph: {
    title: "Isla Market - Envía Amor a Cuba",
    description:
      "Compra electrónicos, artículos para el hogar y alimentos para enviar a tus seres queridos en Cuba",
    url: "https://isla-market.vercel.app",
    siteName: "Isla Market",
    images: [
      {
        url: "//icono.png", // Usaremos PNG en lugar de SVG
        width: 1200,
        height: 630,
        alt: "Isla Market - Envía Amor a Cuba",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Isla Market - Envía Amor a Cuba",
    description:
      "Compra electrónicos, artículos para el hogar y alimentos para enviar a tus seres queridos en Cuba",
    images: ["/icono.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${aleo.variable}`}>
        <AuthProvider>
          <AuthModalProvider>
            <ThemeProvider>
              <ReferralCapture />
              <SessionRefresher />
              <CartGuard />
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <GlobalAuthModal />
              <Toaster />
            </ThemeProvider>
          </AuthModalProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
