"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useAppStore();
  const t = translations["es"]; // Forzar español
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
          <SheetDescription>
            {cart.length === 0
              ? "Tu carrito está vacío"
              : `Tienes ${cart.length} producto${
                  cart.length > 1 ? "s" : ""
                } en tu carrito`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-8rem)] mt-6">
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
                <div className="flex-1 overflow-y-auto py-2 -mx-1 px-1">
                  <div className="space-y-3">
                    {cart.map((item) => {
                      // Calcular precio unitario (variante o producto)
                      const unitPrice = item.variant
                        ? item.variant.price
                        : item.product.price;

                      // Obtener imagen (variante específica o producto)
                      const imageUrl =
                        item.variant?.image_url ||
                        item.product.image ||
                        item.product.images?.[0] ||
                        "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=200";

                      // Crear key única para el item (producto + variante)
                      const itemKey = item.variant_id
                        ? `${item.product.id}-${item.variant_id}`
                        : item.product.id;

                      return (
                        <motion.div
                          key={itemKey}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="relative flex flex-col gap-3 p-3 border rounded-lg bg-card"
                        >
                          {/* Botón de eliminar en la esquina superior derecha */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-red-500"
                            onClick={() =>
                              removeFromCart(item.product.id, item.variant_id)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          {/* Contenedor principal con imagen y detalles */}
                          <div className="flex gap-3 pr-6">
                            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
                              <Image
                                src={imageUrl}
                                alt={item.product.name}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-1">
                                {item.product.name}
                              </h3>

                              {/* Mostrar información de variante si existe */}
                              {item.variant &&
                                item.variant.attributes_display && (
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {item.variant.attributes_display}
                                  </p>
                                )}

                              <p className="text-base font-semibold text-primary">
                                ${unitPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Controles de cantidad */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Cantidad:
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                    item.variant_id
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <span className="min-w-[2rem] text-center text-sm font-semibold">
                                {item.quantity}
                              </span>

                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                    item.variant_id
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Subtotal del producto */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm text-muted-foreground">
                              Subtotal:
                            </span>
                            <span className="text-sm font-semibold">
                              ${(unitPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer fijo en la parte inferior */}
                <div className="flex-shrink-0 border-t bg-background pt-4 pb-4 space-y-3">
                  {/* Resumen de items */}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>
                      {cart.length} producto{cart.length !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      unidad
                      {cart.reduce((sum, item) => sum + item.quantity, 0) !== 1
                        ? "es"
                        : ""}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{t.total}:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>

                  {/* Botón de checkout */}
                  <Button
                    className="w-full"
                    size="lg"
                    asChild
                    onClick={onClose}
                  >
                    <Link href="/checkout">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      {t.checkout}
                    </Link>
                  </Button>

                  {/* Botón de continuar comprando */}
                  <Button
                    className="w-full"
                    variant="outline"
                    asChild
                    onClick={onClose}
                  >
                    <Link href="/products">{t.continueShopping}</Link>
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
