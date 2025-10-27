"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CreditCard,
  User,
  MapPin,
  ShoppingBag,
  ArrowLeft,
  Home,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { toast } from "sonner";

const checkoutSchema = z
  .object({
    // Customer Information
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional().or(z.literal("")), // Campo opcional

    // Delivery Type
    deliveryType: z.enum(["home_delivery", "store_pickup"], {
      required_error: "Por favor selecciona un tipo de entrega",
    }),

    // Recipient Information
    recipientFirstName: z.string().min(2, "Recipient first name is required"),
    recipientLastName: z.string().min(2, "Recipient last name is required"),
    recipientPhone: z.string().min(8, "Phone number is required"), // Siempre requerido

    // Address fields - solo requeridos para home_delivery
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    betweenStreets: z.string().optional(),
    neighborhood: z.string().optional(),
    province: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si es entrega a domicilio, validar que todos los campos de dirección estén llenos
      if (data.deliveryType === "home_delivery") {
        return (
          data.street &&
          data.street.length >= 5 &&
          data.houseNumber &&
          data.houseNumber.length >= 1 &&
          data.betweenStreets &&
          data.betweenStreets.length >= 5 &&
          data.neighborhood &&
          data.neighborhood.length >= 2 &&
          data.province &&
          data.province.length >= 2
        );
      }
      return true;
    },
    {
      message:
        "Todos los campos de dirección son requeridos para entrega a domicilio",
      path: ["street"], // Error aparecerá en el campo street
    }
  );

type CheckoutForm = z.infer<typeof checkoutSchema>;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNowParam = searchParams.get("buyNow") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [buyNowMode, setBuyNowMode] = useState(false);
  const [buyNowItems, setBuyNowItems] = useState<any[]>([]);
  const [isLoadingBuyNow, setIsLoadingBuyNow] = useState(isBuyNowParam); // Inicializar basado en el parámetro
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useAppStore();
  const t = translations["es"];

  // Determinar qué items mostrar: buyNow o carrito
  const displayItems = buyNowMode ? buyNowItems : cart;
  const subtotal = buyNowMode
    ? buyNowItems.reduce((sum, item) => {
        // Usar precio de variante si existe, sino precio del producto
        const itemPrice = item.variant?.price || item.product.price;
        return sum + itemPrice * item.quantity;
      }, 0)
    : getCartTotal();

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: user?.user_metadata?.first_name || "",
      lastName: user?.user_metadata?.last_name || "",
      email: user?.email || "",
      deliveryType: "home_delivery", // Por defecto entrega a domicilio
    },
  });

  // Watch delivery type para actualizar el total
  const deliveryType = form.watch("deliveryType");
  const SHIPPING_FEE = 5.0; // Cargo por envío a domicilio
  const shippingFee = deliveryType === "home_delivery" ? SHIPPING_FEE : 0;
  const total = subtotal + shippingFee;

  // Verificar si es modo "Comprar Ahora"
  useEffect(() => {
    if (isBuyNowParam) {
      console.log("🛒 [BUY NOW] Detectado modo Buy Now, cargando datos...");

      const buyNowData = sessionStorage.getItem("buyNowProduct");
      if (buyNowData) {
        console.log("✅ [BUY NOW] Datos encontrados en sessionStorage");
        const { product, quantity, variant_id, variant } =
          JSON.parse(buyNowData);
        setBuyNowMode(true);
        setBuyNowItems([
          {
            product,
            quantity,
            variant_id: variant_id || null,
            variant: variant || null,
          },
        ]);
        // NO desactivamos isLoadingBuyNow aquí - se hará en otro useEffect
      } else {
        console.log("❌ [BUY NOW] No hay datos, redirigiendo...");
        // Si no hay datos de buyNow, redirigir a productos
        setIsLoadingBuyNow(false);
        router.push("/products");
      }
    }
  }, [isBuyNowParam, router]);

  // Desactivar isLoadingBuyNow solo cuando buyNowItems tenga datos
  useEffect(() => {
    if (isLoadingBuyNow && buyNowItems.length > 0) {
      console.log("✅ [BUY NOW] Items cargados, desactivando estado de carga");
      setIsLoadingBuyNow(false);
    }
  }, [buyNowItems, isLoadingBuyNow]);

  useEffect(() => {
    console.log(
      `🔍 [useEffect] Verificando carrito - Longitud: ${cart.length}, isProcessingOrder: ${isProcessingOrder}, buyNowMode: ${buyNowMode}, isLoadingBuyNow: ${isLoadingBuyNow}, isBuyNowParam: ${isBuyNowParam}`
    );
    // Solo redirigir si no hay items Y no estamos procesando una orden Y no es modo buyNow Y no estamos cargando datos de Buy Now Y no tiene parámetro buyNow
    if (
      displayItems.length === 0 &&
      !isProcessingOrder &&
      !buyNowMode &&
      !isLoadingBuyNow &&
      !isBuyNowParam
    ) {
      console.log("🔀 [useEffect] Redirigiendo a /products (sin items)");
      router.push("/products");
    }
  }, [
    cart,
    displayItems,
    router,
    isProcessingOrder,
    buyNowMode,
    isLoadingBuyNow,
    isBuyNowParam,
  ]);

  const onSubmit = async (data: CheckoutForm) => {
    console.log("🚀 [CHECKOUT] Iniciando proceso de orden...");
    setIsLoading(true);
    setIsProcessingOrder(true); // Activar bandera para evitar redirección automática
    console.log("✅ [CHECKOUT] Bandera isProcessingOrder activada");

    try {
      // Crear orden directamente (sin Stripe)
      console.log("📤 [CHECKOUT] Enviando solicitud a API...");
      console.log(
        `📦 [CHECKOUT] Modo: ${buyNowMode ? "BUY NOW" : "CART"}, Items: ${
          displayItems.length
        }, Entrega: ${data.deliveryType}`
      );
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          customerPhone: data.phone || null, // Teléfono del comprador (opcional)
          deliveryType: data.deliveryType, // NUEVO: Tipo de entrega
          items: displayItems.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant_id || null,
            quantity: item.quantity,
            price_at_time: item.variant?.price || item.product.price,
          })),
          shippingAddress: {
            first_name: data.recipientFirstName,
            last_name: data.recipientLastName,
            phone: data.recipientPhone, // NUEVO: Campo dedicado para teléfono del destinatario
            // Campos de dirección solo si es entrega a domicilio
            ...(data.deliveryType === "home_delivery" && {
              street: data.street,
              house_number: data.houseNumber,
              between_streets: data.betweenStreets,
              neighborhood: data.neighborhood,
              city: data.province,
              province: data.province,
              country: "Cuba",
            }),
          },
        }),
      });

      if (!response.ok) {
        console.error("❌ [CHECKOUT] Error en respuesta:", response.status);
        const error = await response.json();
        throw new Error(error.error || "Error al crear la orden");
      }

      const result = await response.json();
      console.log("✅ [CHECKOUT] Orden creada:", result.order.id);

      // Mostrar mensaje de éxito
      toast.success("¡Orden creada exitosamente! Revisa tu email.");
      console.log("🎉 [CHECKOUT] Toast mostrado");

      // Limpiar según el modo
      if (buyNowMode) {
        console.log("🧹 [CHECKOUT] Limpiando sessionStorage (modo Buy Now)...");
        sessionStorage.removeItem("buyNowProduct");
        console.log("✅ [CHECKOUT] sessionStorage limpiado");
      } else {
        console.log("🧹 [CHECKOUT] Limpiando carrito...");
        clearCart();
        console.log("✅ [CHECKOUT] Carrito limpiado");
      }

      console.log(
        `🔀 [CHECKOUT] Navegando a: /checkout/success?orderId=${result.order.id}`
      );
      router.push(`/checkout/success?orderId=${result.order.id}`);
      console.log("✅ [CHECKOUT] router.push ejecutado");
      console.log(
        "ℹ️ [CHECKOUT] Bandera permanece activa hasta que el componente se desmonte"
      );

      // No necesitamos desactivar la bandera porque:
      // 1. El componente se desmontará al navegar
      // 2. Mantenerla activa previene cualquier redirección no deseada
    } catch (error: any) {
      console.error("❌ [CHECKOUT] Error en checkout:", error);
      toast.error(`Error al crear la orden: ${error.message}`);
      setIsProcessingOrder(false); // Desactivar bandera en caso de error
      console.log("🔓 [CHECKOUT] Bandera desactivada por error");
    } finally {
      setIsLoading(false);
      console.log("🏁 [CHECKOUT] Proceso finalizado");
    }
  };

  // Solo retornar null si no hay items Y NO estamos procesando Y NO estamos cargando Buy Now Y NO tiene parámetro buyNow
  if (
    displayItems.length === 0 &&
    !isProcessingOrder &&
    !isLoadingBuyNow &&
    !isBuyNowParam
  ) {
    console.log(
      "🚫 [RENDER] No renderizando (sin items, no procesando, no cargando, no buyNow)"
    );
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Botón volver */}
        <Button
          variant="ghost"
          className="mb-4 sm:mb-6"
          onClick={() => router.push("/products")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Productos
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
            {t.checkout}
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground">
            Completa tu pedido para enviar amor a Cuba
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 min-w-0">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Customer Information */}
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-2xl">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{t.customerInformation}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 sm:pt-0">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t.firstName}</Label>
                      <Input
                        id="firstName"
                        {...form.register("firstName")}
                        className={
                          form.formState.errors.firstName
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t.lastName}</Label>
                      <Input
                        id="lastName"
                        {...form.register("lastName")}
                        className={
                          form.formState.errors.lastName ? "border-red-500" : ""
                        }
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      className={
                        form.formState.errors.email ? "border-red-500" : ""
                      }
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t.phone}{" "}
                      <span className="text-muted-foreground text-xs">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...form.register("phone")}
                      placeholder="Ej: +53 5555-5555"
                      className={
                        form.formState.errors.phone ? "border-red-500" : ""
                      }
                    />
                    {form.formState.errors.phone && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recipient Information */}
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-lg sm:text-2xl">
                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{t.recipientInformation}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6 sm:pt-0">
                  {/* Delivery Type Selector */}
                  <div className="space-y-3">
                    <Label className="text-sm">Tipo de Entrega</Label>
                    <div className="max-w-[280px]">
                      <RadioGroup
                        value={deliveryType}
                        onValueChange={(value) =>
                          form.setValue(
                            "deliveryType",
                            value as "home_delivery" | "store_pickup"
                          )
                        }
                        className="grid grid-cols-1 gap-3"
                      >
                        {/* Home Delivery Option */}
                        <label
                          htmlFor="home_delivery"
                          className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            deliveryType === "home_delivery"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem
                            value="home_delivery"
                            id="home_delivery"
                            className="mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Home className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="font-semibold text-sm truncate">
                                Entrega a Domicilio
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
                              Enviamos el pedido a la dirección en Cuba
                            </p>
                            <div className="text-xs font-medium text-amber-600 dark:text-amber-500 truncate">
                              + $5.00 USD cargo de envío
                            </div>
                          </div>
                        </label>

                        {/* Store Pickup Option */}
                        <label
                          htmlFor="store_pickup"
                          className={`flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            deliveryType === "store_pickup"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem
                            value="store_pickup"
                            id="store_pickup"
                            className="mt-0.5 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Store className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="font-semibold text-sm truncate">
                                Recogida en Tienda
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
                              Retira el pedido en nuestro punto de recogida
                            </p>
                            <div className="text-xs font-medium text-green-600 dark:text-green-500">
                              Sin cargo adicional
                            </div>
                          </div>
                        </label>
                      </RadioGroup>
                    </div>
                    {form.formState.errors.deliveryType && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.deliveryType.message}
                      </p>
                    )}
                  </div>

                  {/* Store Pickup Info */}
                  {deliveryType === "store_pickup" && (
                    <div className="max-w-[280px]">
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Store className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-xs truncate">
                              Punto de Recogida
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              San Clemente esquina Cisneros
                              <br />
                              Camagüey, Cuba
                              <br />
                              Lun-Sáb, 8:00 AM - 5:00 PM
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recipient Basic Info (always shown) */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientFirstName">
                        {deliveryType === "store_pickup"
                          ? "Nombre de quien recoge"
                          : t.firstName}
                      </Label>
                      <Input
                        id="recipientFirstName"
                        {...form.register("recipientFirstName")}
                        placeholder="Ej: Juan"
                        className={
                          form.formState.errors.recipientFirstName
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {form.formState.errors.recipientFirstName && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.recipientFirstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipientLastName">
                        {deliveryType === "store_pickup"
                          ? "Apellido"
                          : t.lastName}
                      </Label>
                      <Input
                        id="recipientLastName"
                        {...form.register("recipientLastName")}
                        placeholder="Ej: Pérez"
                        className={
                          form.formState.errors.recipientLastName
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {form.formState.errors.recipientLastName && (
                        <p className="text-sm text-red-500">
                          {form.formState.errors.recipientLastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recipient Phone (always required) */}
                  <div className="space-y-2">
                    <Label htmlFor="recipientPhone">
                      Teléfono{" "}
                      {deliveryType === "store_pickup"
                        ? "de contacto"
                        : "del destinatario"}
                    </Label>
                    <Input
                      id="recipientPhone"
                      type="tel"
                      {...form.register("recipientPhone")}
                      placeholder="Ej: +53 5555-5555"
                      className={
                        form.formState.errors.recipientPhone
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {form.formState.errors.recipientPhone && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.recipientPhone.message}
                      </p>
                    )}
                  </div>

                  {/* Address Fields (only for home delivery) */}
                  {deliveryType === "home_delivery" && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm">
                          Dirección de Entrega en Cuba
                        </h4>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="street">{t.street}</Label>
                            <Input
                              id="street"
                              {...form.register("street")}
                              placeholder="Ej: Calle 23"
                              className={
                                form.formState.errors.street
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {form.formState.errors.street && (
                              <p className="text-sm text-red-500">
                                {form.formState.errors.street.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="houseNumber">{t.houseNumber}</Label>
                            <Input
                              id="houseNumber"
                              {...form.register("houseNumber")}
                              placeholder="Ej: 456"
                              className={
                                form.formState.errors.houseNumber
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {form.formState.errors.houseNumber && (
                              <p className="text-sm text-red-500">
                                {form.formState.errors.houseNumber.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="betweenStreets">
                            {t.betweenStreets}
                          </Label>
                          <Input
                            id="betweenStreets"
                            {...form.register("betweenStreets")}
                            placeholder="Ej: entre 5ta y 7ma"
                            className={
                              form.formState.errors.betweenStreets
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {form.formState.errors.betweenStreets && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.betweenStreets.message}
                            </p>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="neighborhood">
                              {t.neighborhood}
                            </Label>
                            <Input
                              id="neighborhood"
                              {...form.register("neighborhood")}
                              placeholder="Ej: Vedado"
                              className={
                                form.formState.errors.neighborhood
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {form.formState.errors.neighborhood && (
                              <p className="text-sm text-red-500">
                                {form.formState.errors.neighborhood.message}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="province">{t.province}</Label>
                            <Input
                              id="province"
                              {...form.register("province")}
                              placeholder="Ej: La Habana"
                              className={
                                form.formState.errors.province
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                            {form.formState.errors.province && (
                              <p className="text-sm text-red-500">
                                {form.formState.errors.province.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : (
                  <ShoppingBag className="h-5 w-5 mr-2" />
                )}
                {isLoading ? "Creando orden..." : "Confirmar Pedido"}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 min-w-0">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Resumen del Pedido</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {displayItems.map((item) => {
                  // Usar precio de variante si existe, sino precio del producto
                  const itemPrice = item.variant?.price || item.product.price;

                  return (
                    <div
                      key={`${item.product.id}-${
                        item.variant_id || "no-variant"
                      }`}
                      className="flex items-center gap-3 min-w-0"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={
                            item.variant?.image_url ||
                            item.product.image ||
                            item.product.images?.[0] ||
                            "https://via.placeholder.com/150"
                          }
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-md"
                          sizes="48px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {item.product.name}
                        </p>
                        {/* Mostrar nombre de variante si existe */}
                        {item.variant && (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.variant.variant_name && item.variant.color
                              ? `${item.variant.variant_name} - ${item.variant.color}`
                              : item.variant.variant_name ||
                                item.variant.color ||
                                item.variant.attributes_display}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ${itemPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium text-sm flex-shrink-0">
                        ${(itemPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}

                <Separator />

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {/* Shipping Fee */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Envío:</span>
                  <span
                    className={`font-medium ${
                      shippingFee > 0 ? "text-amber-600" : "text-green-600"
                    }`}
                  >
                    {shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : "Gratis"}
                  </span>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{t.total}:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard requireAuth={true}>
      <CheckoutContent />
    </AuthGuard>
  );
}
