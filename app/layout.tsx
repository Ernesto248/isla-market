import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: "Isla Market - Send Love to Cuba",
  description:
    "Shop electronics, home goods, and food products to send to your loved ones in Cuba",
  icons: {
    icon: "/island.svg",
    shortcut: "/island.svg",
    apple: "/island.svg",
  },
  openGraph: {
    title: "Isla Market - Send Love to Cuba",
    description:
      "Shop electronics, home goods, and food products to send to your loved ones in Cuba",
    url: "https://isla-market.com",
    siteName: "Isla Market",
    images: [
      {
        url: "/island.svg",
        width: 800,
        height: 600,
        alt: "Isla Market Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Isla Market - Send Love to Cuba",
    description:
      "Shop electronics, home goods, and food products to send to your loved ones in Cuba",
    images: ["/island.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
