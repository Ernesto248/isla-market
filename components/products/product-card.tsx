"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { language, addToCart } = useAppStore();
  const t = translations[language];

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group"
    >
      <Card className="h-full overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
        <div className="relative overflow-hidden">
          <img
            src={
              product.images?.[0] ||
              product.image ||
              "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=500"
            }
            alt={product.name}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500">
              Featured
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
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>

            <Badge
              variant={
                (product.stock_quantity || product.stock || 0) > 0
                  ? "default"
                  : "destructive"
              }
            >
              {(product.stock_quantity || product.stock || 0) > 0
                ? `${product.stock_quantity || product.stock} ${t.inStock}`
                : t.outOfStock}
            </Badge>
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
    </motion.div>
  );
}
