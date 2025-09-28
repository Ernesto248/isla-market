'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, User, Menu, X, Sun, Moon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { AuthModal } from '@/components/auth/auth-modal';
import { CartDrawer } from '@/components/cart/cart-drawer';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { theme, language, user, setTheme, setLanguage, getCartItemsCount } = useAppStore();
  const t = translations[language];
  const cartItemsCount = getCartItemsCount();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Isla Market
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                {t.home}
              </Link>
              <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
                {t.products}
              </Link>
              {user && (
                <Link href="/orders" className="text-sm font-medium hover:text-primary transition-colors">
                  {t.myOrders}
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  {t.admin}
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
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="h-9 w-9"
              >
                <Globe className="h-4 w-4" />
                <span className="sr-only">{language === 'en' ? 'ES' : 'EN'}</span>
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCartOpen(true)}
                className="h-9 w-9 relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemsCount > 0 && (
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
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium hidden sm:inline">
                    {user.firstName}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => useAppStore.getState().setUser(null)}
                  >
                    {t.logout}
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAuthModal('login')}
                  >
                    {t.login}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => openAuthModal('signup')}
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
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t py-4"
            >
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t.home}
                </Link>
                <Link
                  href="/products"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t.products}
                </Link>
                {user && (
                  <Link
                    href="/orders"
                    className="text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t.myOrders}
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium hover:text-primary transition-colors"
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
                        openAuthModal('login');
                        setIsMenuOpen(false);
                      }}
                    >
                      {t.login}
                    </Button>
                    <Button
                      onClick={() => {
                        openAuthModal('signup');
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

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
}