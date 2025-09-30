"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";

export default function CheckoutCancelPage() {
  const t = translations["es"];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4"
            >
              <XCircle className="w-8 h-8 text-orange-600" />
            </motion.div>
            <CardTitle className="text-2xl text-orange-800">
              Pago Cancelado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-lg text-orange-700">
                Tu pago ha sido cancelado
              </p>

              <p className="text-orange-600">
                No se ha realizado ningún cargo a tu tarjeta. Los productos
                siguen en tu carrito.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/checkout" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Checkout
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/products" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Seguir Comprando
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            ¿Necesitas ayuda? Contáctanos si tienes algún problema con tu
            pedido.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
