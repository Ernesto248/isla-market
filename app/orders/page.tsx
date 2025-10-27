"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Calendar,
  DollarSign,
  Truck,
  X,
  Home,
  Store,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { DataService } from "@/lib/data-service";
import { Order } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function OrdersContent() {
  const { user } = useAuth();
  const t = translations["es"];
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const { toast } = useToast();

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      // Estados en español (nuevos)
      case "pendiente":
      case "pending":
        return t.pending;
      case "pagado":
      case "paid":
        return t.paid;
      case "entregado":
      case "delivered":
        return t.delivered;
      case "cancelado":
      case "cancelled":
        return t.cancelled;
      // Estados legacy en inglés
      case "confirmed":
        return t.confirmed;
      case "processing":
        return t.processing;
      case "shipped":
        return t.shipped;
      default:
        return status;
    }
  };

  // Función para obtener la variante del badge
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "entregado":
      case "delivered":
        return "default";
      case "pagado":
      case "paid":
      case "confirmed":
      case "processing":
      case "shipped":
        return "secondary";
      case "cancelado":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return;

      try {
        // TODO: Implement DataService.getUserOrders(user.id)
        // For now, use mock data
        const userOrders = await DataService.getUserOrders(user.id);
        setOrders(userOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrderId(orderId);

    try {
      // Obtener el token de acceso para autenticación
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cancelar la orden");
      }

      // Actualizar la lista de órdenes
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: "cancelado" } : order
        )
      );

      toast({
        title: "Orden cancelada",
        description:
          "La orden ha sido cancelada exitosamente y el stock ha sido restaurado.",
      });
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "No se pudo cancelar la orden. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
      setOrderToCancel(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">{t.myOrders}</h1>
        <p className="text-xl text-muted-foreground">
          {`Tienes ${orders.length} órdenes`}
        </p>
      </motion.div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-4">
            Aún no has realizado ningún pedido
          </p>
          <p className="text-sm text-muted-foreground">
            Comienza a comprar para enviar amor a tu familia en Cuba
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span className="text-base sm:text-lg">
                        {t.orderNumber}
                        {order.id}
                      </span>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Delivery Type Badge */}
                      {order.delivery_type === "store_pickup" ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300"
                        >
                          <Store className="h-3 w-3 mr-1" />
                          <span className="text-xs sm:text-sm">
                            Recogida en Tienda
                          </span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
                        >
                          <Home className="h-3 w-3 mr-1" />
                          <span className="text-xs sm:text-sm">
                            Entrega a Domicilio
                          </span>
                        </Badge>
                      )}
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Order Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t.orderDate}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : "Fecha no disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t.orderTotal}</p>
                        <p className="text-sm text-muted-foreground">
                          $
                          {order.total_amount
                            ? Number(order.total_amount).toFixed(2)
                            : "0.00"}
                        </p>
                        {order.shipping_fee !== undefined &&
                          order.shipping_fee > 0 && (
                            <p className="text-xs text-muted-foreground">
                              (Incluye ${Number(order.shipping_fee).toFixed(2)}{" "}
                              de envío)
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t.orderStatus}</p>
                        <p className="text-sm text-muted-foreground">
                          {getStatusText(order.status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Info */}
                  <div className="border-t pt-4">
                    {order.delivery_type === "store_pickup" ? (
                      <>
                        <h4 className="font-medium mb-3 flex items-center">
                          <Store className="h-4 w-4 mr-2" />
                          Recogida en Tienda
                        </h4>
                        <div className="space-y-2 mb-3">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Quién recoge:
                            </span>{" "}
                            {order.recipientInfo?.first_name || "Nombre"}{" "}
                            {order.recipientInfo?.last_name || "no disponible"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Teléfono:
                            </span>{" "}
                            {order.recipientInfo?.phone || "No disponible"}
                          </p>
                        </div>
                        <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                            📍 Punto de Recogida
                          </p>
                          <p className="text-xs sm:text-sm text-green-700 dark:text-green-400">
                            San Clemente esquina Cisneros, Camagüey, Cuba
                          </p>
                          <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 mt-1.5">
                            🕐 Lunes a Sábado, 8:00 AM - 5:00 PM
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="font-medium mb-3 flex items-center">
                          <Home className="h-4 w-4 mr-2" />
                          Destinatario en Cuba
                        </h4>
                        <div className="space-y-1.5">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {order.recipientInfo?.first_name || "Nombre"}{" "}
                              {order.recipientInfo?.last_name ||
                                "no disponible"}
                            </span>
                          </p>
                          {order.recipientInfo?.phone && (
                            <p className="text-sm text-muted-foreground">
                              📞 {order.recipientInfo.phone}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {order.recipientInfo?.street || "Dirección"} #
                            {order.recipientInfo?.house_number || "N/A"}
                            {order.recipientInfo?.between_streets && (
                              <>, entre {order.recipientInfo.between_streets}</>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.recipientInfo?.neighborhood || "Barrio"},{" "}
                            {order.recipientInfo?.province || "Provincia"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Artículos</h4>
                    <div className="space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items
                          .filter((item) => item.product)
                          .map((item, idx) => {
                            // Usar imagen de variante si existe, sino la del producto
                            const imageUrl =
                              item.variant?.image_url || item.product!.image;
                            // Usar precio de unit_price (precio al momento de la orden)
                            const unitPrice = item.unit_price;

                            return (
                              <div
                                key={`${item.product!.id}-${idx}`}
                                className="flex items-center gap-3 sm:gap-4"
                              >
                                <img
                                  src={imageUrl}
                                  alt={item.product!.name}
                                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-md flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm sm:text-base truncate">
                                    {item.product!.name}
                                  </p>
                                  {/* NUEVO: Mostrar info de variante si existe */}
                                  {item.variant &&
                                    item.variant.attributes_display && (
                                      <p className="text-xs text-muted-foreground mb-1">
                                        {item.variant.attributes_display}
                                      </p>
                                    )}
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {t.quantity}: {item.quantity} × $
                                    {unitPrice.toFixed(2)}
                                  </p>
                                </div>
                                <p className="font-medium text-sm sm:text-base flex-shrink-0">
                                  ${item.total_price.toFixed(2)}
                                </p>
                              </div>
                            );
                          })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Cargando artículos...
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Cancel Order Button - Only for pending orders */}
                {order.status === "pendiente" && (
                  <CardFooter className="border-t pt-4 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setOrderToCancel(order.id)}
                      disabled={cancellingOrderId === order.id}
                      className="w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      <span className="text-xs sm:text-sm">
                        {cancellingOrderId === order.id
                          ? "Cancelando..."
                          : "Cancelar Orden"}
                      </span>
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={orderToCancel !== null}
        onOpenChange={(open) => !open && setOrderToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la orden y restaurará el stock de los
              productos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener orden</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToCancel && handleCancelOrder(orderToCancel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <AuthGuard requireAuth={true}>
      <OrdersContent />
    </AuthGuard>
  );
}
