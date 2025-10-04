"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Calendar, DollarSign, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/contexts/auth-context";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { DataService } from "@/lib/data-service";
import { Order } from "@/lib/types";

function OrdersContent() {
  const { user } = useAuth();
  const t = translations["es"];
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>
                        {t.orderNumber}
                        {order.id}
                      </span>
                    </CardTitle>
                    <Badge variant={getStatusVariant(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Order Info */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.orderDate}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : "Fecha no disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.orderTotal}</p>
                        <p className="text-sm text-muted-foreground">
                          $
                          {order.total_amount
                            ? Number(order.total_amount).toFixed(2)
                            : "0.00"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t.orderStatus}</p>
                        <p className="text-sm text-muted-foreground">
                          {getStatusText(order.status)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Info */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Destinatario en Cuba</h4>
                    <p className="text-sm text-muted-foreground">
                      {order.recipientInfo?.first_name || "Nombre"}{" "}
                      {order.recipientInfo?.last_name || "no disponible"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.recipientInfo?.street || "Dirección"} #
                      {order.recipientInfo?.house_number || "N/A"},{" "}
                      {order.recipientInfo?.between_streets || ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.recipientInfo?.neighborhood || "Barrio"},{" "}
                      {order.recipientInfo?.province || "Provincia"}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Artículos</h4>
                    <div className="space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items
                          .filter((item) => item.product)
                          .map((item) => (
                            <div
                              key={item.product!.id}
                              className="flex items-center space-x-4"
                            >
                              <img
                                src={item.product!.image}
                                alt={item.product!.name}
                                className="w-12 h-12 object-cover rounded-md"
                              />
                              <div className="flex-1">
                                <p className="font-medium">
                                  {item.product!.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {t.quantity}: {item.quantity} × $
                                  {item.product!.price.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-medium">
                                $
                                {(item.product!.price * item.quantity).toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Cargando artículos...
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
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
