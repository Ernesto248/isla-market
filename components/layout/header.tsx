"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart, User, Menu, X, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { AuthModal } from "@/components/auth/auth-modal";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useAuth } from "@/contexts/auth-context";
import { useHydration } from "@/hooks/use-hydration";
import { toast } from "sonner";
import { useEffect } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<
    "login" | "signup" | "forgot-password"
  >("login");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isReferrer, setIsReferrer] = useState(false);

  const { theme, setTheme, getCartItemsCount, isHydrated } = useAppStore();
  const { user, session, signOut, loading } = useAuth();
  const clientHydrated = useHydration();
  const t = translations["es"];
  const cartItemsCount = isHydrated ? getCartItemsCount() : 0;

  // Verificar si el usuario es referidor
  useEffect(() => {
    if (user && session?.access_token) {
      fetch("/api/referrals/check-status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setIsReferrer(data.is_referrer || false);
        })
        .catch(() => {
          setIsReferrer(false);
        });
    } else {
      setIsReferrer(false);
    }
  }, [user, session]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const openAuthModal = (mode: "login" | "signup" | "forgot-password") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast.error("Error al cerrar sesión");
        return;
      }

      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      toast.error("Error inesperado");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                {/* Logo Image - Redondeado */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
                  <Image
                    src="/icono.png"
                    alt="Isla Market Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>

                {/* Brand Text - Gradiente como el Hero */}
                <span className="text-xl sm:text-2xl font-bold font-aleo bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Isla Market
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className="relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 group"
              >
                <span className="relative z-10">{t.home}</span>
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-200" />
              </Link>
              <Link
                href="/products"
                className="relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 group"
              >
                <span className="relative z-10">{t.products}</span>
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-200" />
              </Link>
              {user && (
                <Link
                  href="/orders"
                  className="relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 group"
                >
                  <span className="relative z-10">{t.myOrders}</span>
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-200" />
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 group"
                >
                  <span className="relative z-10">{t.admin}</span>
                  <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-cyan-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-200" />
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="h-9 w-9 relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {isHydrated && cartItemsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user.user_metadata?.first_name ||
                            user.email?.split("@")[0] ||
                            "Usuario"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="w-full">
                        {t.myOrders}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full">
                        Mi Perfil
                      </Link>
                    </DropdownMenuItem>
                    {isReferrer && (
                      <DropdownMenuItem asChild>
                        <Link href="/profile/referrals" className="w-full">
                          Mis Referidos
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600 focus:text-red-600"
                      disabled={loading}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAuthModal("login")}
                    disabled={loading}
                  >
                    {t.login}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openAuthModal("signup")}
                    disabled={loading}
                  >
                    {t.signup}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t py-4"
            >
              <nav className="flex flex-col space-y-2">
                <Link
                  href="/"
                  className="text-sm font-medium px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t.home}
                </Link>
                <Link
                  href="/products"
                  className="text-sm font-medium px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t.products}
                </Link>
                {user && (
                  <Link
                    href="/orders"
                    className="text-sm font-medium px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t.myOrders}
                  </Link>
                )}
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium px-4 py-3 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:via-blue-500/10 hover:to-purple-500/10 hover:text-cyan-600 dark:hover:text-cyan-400"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t.admin}
                  </Link>
                )}
                {!user && (
                  <div className="flex flex-col space-y-2 pt-4 border-t">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        openAuthModal("login");
                        setIsMenuOpen(false);
                      }}
                    >
                      {t.login}
                    </Button>
                    <Button
                      onClick={() => {
                        openAuthModal("signup");
                        setIsMenuOpen(false);
                      }}
                    >
                      {t.signup}
                    </Button>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
