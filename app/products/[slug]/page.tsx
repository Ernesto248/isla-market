"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ImageCarousel } from "@/components/products/image-carousel";
import { ProductCard } from "@/components/products/product-card";
import { VariantSelectorSimple } from "@/components/products/variant-selector-simple";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/contexts/auth-context";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { translations } from "@/lib/translations";
import { Product, ProductVariant } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductDetailResponse {
  product: Product & { categories?: { name: string; slug: string } };
  relatedProducts: Product[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [productData, setProductData] = useState<ProductDetailResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);

  const { addToCart } = useAppStore();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const t = translations["es"];

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${slug}`);

        if (!response.ok) {
          throw new Error("Producto no encontrado");
        }

        const data = await response.json();
        setProductData(data);

        // Si el producto tiene variantes, cargarlas
        if (data.product.has_variants) {
          const variantsResponse = await fetch(
            `/api/products/${slug}/variants`
          );
          if (variantsResponse.ok) {
            const variantsData = await variantsResponse.json();
            setVariants(variantsData);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error al cargar el producto");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
    }
  }, [slug, router]);

  const handleAddToCart = () => {
    if (!user) {
      toast(t.loginToAddCart, {
        action: {
          label: t.loginButton,
          onClick: () => {
            openAuthModal("login", productData?.product);
          },
        },
        duration: 5000,
      });
      return;
    }

    if (productData?.product) {
      const product = productData.product;
      const hasVariants = product.has_variants && variants.length > 0;

      // Si tiene variantes, verificar que se haya seleccionado una
      if (hasVariants && !selectedVariant) {
        toast.error("Selecciona una variante", {
          description: "Por favor selecciona todas las opciones del producto",
        });
        return;
      }

      // Obtener stock disponible (variante o producto simple)
      const availableStock = hasVariants
        ? selectedVariant?.stock_quantity || 0
        : product.stock_quantity || product.stock || 0;

      if (availableStock === 0) {
        toast.error("Producto sin stock");
        return;
      }

      if (quantity > availableStock) {
        toast.error("Stock insuficiente", {
          description: `Solo hay ${availableStock} unidades disponibles`,
        });
        return;
      }

      // Agregar la cantidad seleccionada al carrito (CON variante si aplica)
      addToCart(product, quantity, selectedVariant);

      toast.success("Producto agregado al carrito", {
        description: `${quantity} x ${product.name}${
          selectedVariant
            ? ` (${selectedVariant.attributes_display || ""})`
            : ""
        }`,
      });

      // Resetear cantidad
      setQuantity(1);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast(t.loginToAddCart, {
        action: {
          label: t.loginButton,
          onClick: () => {
            openAuthModal("login", productData?.product);
          },
        },
        duration: 5000,
      });
      return;
    }

    if (productData?.product) {
      const product = productData.product;
      const hasVariants = product.has_variants && variants.length > 0;

      // Si tiene variantes, verificar que se haya seleccionado una
      if (hasVariants && !selectedVariant) {
        toast.error("Selecciona una variante", {
          description: "Por favor selecciona todas las opciones del producto",
        });
        return;
      }

      // Obtener stock disponible (variante o producto simple)
      const availableStock = hasVariants
        ? selectedVariant?.stock_quantity || 0
        : product.stock_quantity || product.stock || 0;

      if (availableStock === 0) {
        toast.error("Producto sin stock");
        return;
      }

      if (quantity > availableStock) {
        toast.error("Stock insuficiente", {
          description: `Solo hay ${availableStock} unidades disponibles`,
        });
        return;
      }

      // Guardar el producto en sessionStorage para "Comprar Ahora"
      // Esto permite crear una orden sin afectar el carrito
      sessionStorage.setItem(
        "buyNowProduct",
        JSON.stringify({
          product: product,
          quantity: quantity,
          variant_id: selectedVariant?.id || null,
          variant: selectedVariant || null, // Incluir objeto completo de variante
        })
      );

      // Redirigir a checkout con un parámetro especial
      router.push("/checkout?buyNow=true");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-6 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return null;
  }

  const { product, relatedProducts } = productData;
  const hasVariants = product.has_variants && variants.length > 0;

  // Stock disponible: variante seleccionada o producto simple
  const stock = hasVariants
    ? selectedVariant?.stock_quantity || 0
    : product.stock_quantity || product.stock || 0;

  const isOutOfStock = stock === 0;

  // Precio a mostrar: variante seleccionada o producto simple
  const displayPrice =
    hasVariants && selectedVariant ? selectedVariant.price : product.price;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        className="mb-4 sm:mb-6"
        items={[
          { label: t.products, href: "/products" },
          ...(product.categories ? [{ label: product.categories.name }] : []),
          { label: product.name },
        ]}
      />

      {/* Botón volver */}
      <Button
        variant="ghost"
        className="mb-4 sm:mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t.backToProducts}
      </Button>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-12 sm:mb-16">
        {/* Columna izquierda: Imágenes */}
        <div className="group">
          <ImageCarousel
            images={product.images || []}
            productName={product.name}
          />
        </div>

        {/* Columna derecha: Información */}
        <div className="space-y-4 sm:space-y-6">
          {/* Brand/Category badge */}
          {product.categories && (
            <Badge variant="secondary" className="text-xs font-medium">
              {product.categories.name}
            </Badge>
          )}

          {/* Rating
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="ml-1 text-sm font-medium">4.9</span>
            </div>
            <span className="text-sm text-muted-foreground">(156)</span>
          </div> */}

          {/* Nombre del producto */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
            {product.name}
          </h1>

          {/* Precio */}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-bold">
              ${displayPrice.toFixed(2)}
            </span>
          </div>

          {/* Descripción */}
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Selector de variantes (si el producto tiene variantes) */}
          {hasVariants && (
            <div className="pt-4 border-t">
              <VariantSelectorSimple
                productId={product.id}
                variants={variants}
                onVariantChange={(variant: ProductVariant | null) => {
                  setSelectedVariant(variant);
                  // Resetear cantidad cuando cambia la variante
                  if (variant) {
                    setQuantity(1);
                  }
                }}
              />
            </div>
          )}

          {/* Selector de cantidad */}
          {!isOutOfStock && (
            <div className="space-y-3 pt-3 sm:pt-4 border-t">
              <label className="text-sm font-semibold">Cantidad</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    min="1"
                    max={stock}
                    value={quantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setQuantity(Math.min(Math.max(1, value), stock));
                    }}
                    className="w-16 sm:w-20 text-center border rounded-md py-2 font-medium bg-background text-foreground"
                    aria-label="Cantidad"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10"
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    disabled={quantity >= stock}
                  >
                    +
                  </Button>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {stock} disponibles
                </span>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:flex-1 border-2 hover:bg-background text-sm sm:text-base"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="truncate">Agregar al Carrito</span>
            </Button>
            <Button
              size="lg"
              className="w-full sm:flex-1 bg-foreground text-background hover:bg-foreground/90 text-sm sm:text-base"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
            >
              <span className="truncate">Comprar Ahora</span>
            </Button>
          </div>

          {/* Stock info */}
          {isOutOfStock && (
            <Badge variant="destructive" className="w-fit">
              {t.outOfStock}
            </Badge>
          )}
        </div>
      </div>

      {/* Productos relacionados */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">{t.relatedProducts}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct, index) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
