"use client";

import { motion } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { ClientOnly } from "@/components/ui/client-only";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { language, cart, updateQuantity, removeFromCart, getCartTotal } =
    useAppStore();
  const t = translations[language];
  const total = getCartTotal();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <span>{t.cart}</span>
            <ClientOnly fallback={<Badge variant="secondary">0</Badge>}>
              <Badge variant="secondary">{cart.length}</Badge>
            </ClientOnly>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <ClientOnly
            fallback={
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">{t.cartEmpty}</p>
                  <Button onClick={onClose} asChild>
                    <Link href="/products">{t.continueShopping}</Link>
                  </Button>
                </div>
              </div>
            }
          >
            {cart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">{t.cartEmpty}</p>
                  <Button onClick={onClose} asChild>
                    <Link href="/products">{t.continueShopping}</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto py-6">
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <motion.div
                        key={item.product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            ${item.product.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>

                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>{t.total}:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    asChild
                    onClick={onClose}
                  >
                    <Link href="/checkout">{t.checkout}</Link>
                  </Button>
                </div>
              </>
            )}
          </ClientOnly>
        </div>
      </SheetContent>
    </Sheet>
  );
}
