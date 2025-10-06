"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/contexts/auth-context";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { translations } from "@/lib/translations";
import { Product } from "@/lib/types";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart } = useAppStore();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const t = translations["es"]; // Forzar español

  // Función para truncar descripción
  const truncateDescription = (
    text: string | null,
    maxLength: number = 100
  ) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevenir navegación al hacer clic en el botón
    e.stopPropagation(); // Evitar que el evento se propague al Link
    // Verificar si el usuario está autenticado
    if (!user) {
      // Mostrar toast con botón para iniciar sesión
      toast(t.loginToAddCart, {
        action: {
          label: t.loginButton,
          onClick: () => {
            openAuthModal("login", product);
          },
        },
        duration: 5000,
      });
      return;
    }

    // Si está autenticado, agregar al carrito normalmente
    addToCart(product);
    toast.success("Producto agregado al carrito", {
      description: product.name,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Link href={`/products/${product.slug}`} className="block h-full">
        <Card className="h-full overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div className="relative overflow-hidden h-48">
            <Image
              src={
                product.images?.[0] ||
                product.image ||
                "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=500"
              }
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {product.featured && (
              <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500">
                Destacados
              </Badge>
            )}

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {truncateDescription(product.description)}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={(product.stock_quantity || product.stock || 0) === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t.addToCart}
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
