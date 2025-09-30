"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  ArrowRight,
  Calendar,
  DollarSign,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { DataService } from "@/lib/data-service";
import { Order } from "@/lib/types";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const { clearCart } = useAppStore();
  const t = translations["es"];
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session_id = searchParams.get("session_id");
    setSessionId(session_id);

    // Limpiar el carrito después de una compra exitosa
    if (session_id) {
      clearCart();

      // Obtener los detalles de la orden
      const fetchOrder = async () => {
        try {
          const orderData = await DataService.getOrderBySessionId(session_id);
          setOrder(orderData);
        } catch (error) {
          console.error("Error fetching order details:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [searchParams, clearCart]);

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t.pending;
      case "paid":
        return t.paid;
      case "confirmed":
        return t.confirmed;
      case "processing":
        return t.processing;
      case "shipped":
        return t.shipped;
      case "delivered":
        return t.delivered;
      case "cancelled":
        return t.cancelled;
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Encabezado de éxito */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <CardTitle className="text-2xl text-green-800">
              {t.paymentSuccessful}
            </CardTitle>
            <p className="text-lg text-green-700">
              {t.orderProcessedSuccessfully}
            </p>
          </CardHeader>
        </Card>

        {/* Resumen de la orden */}
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{t.loadingOrderDetails}</p>
            </CardContent>
          </Card>
        ) : order ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t.orderSummary}
                  </span>
                  <Badge variant="secondary">
                    {getStatusText(order.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información de la orden */}
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
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        #{order.id.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Información del destinatario */}
                {order.recipientInfo && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Destinatario en Cuba
                    </h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium">
                        {order.recipientInfo.first_name || "Nombre"}{" "}
                        {order.recipientInfo.last_name || "no disponible"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.recipientInfo.street || "Dirección"} #
                        {order.recipientInfo.house_number || "N/A"}
                        {order.recipientInfo.between_streets &&
                          `, ${order.recipientInfo.between_streets}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.recipientInfo.neighborhood || "Barrio"},{" "}
                        {order.recipientInfo.province || "Provincia"}
                      </p>
                      {order.recipientInfo.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {order.recipientInfo.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Artículos comprados */}
                <div>
                  <h4 className="font-medium mb-3">{t.itemsPurchased}</h4>
                  <div className="space-y-3">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <div
                          key={item.product?.id || item.id}
                          className="flex items-center space-x-4 p-3 bg-muted rounded-lg"
                        >
                          {item.product?.image && (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {item.product?.name || "Producto"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t.quantity}: {item.quantity} × $
                              {item.product?.price?.toFixed(2) ||
                                item.unit_price?.toFixed(2) ||
                                "0.00"}
                            </p>
                          </div>
                          <p className="font-medium">
                            $
                            {(
                              item.total_price ||
                              item.quantity *
                                (item.product?.price || item.unit_price || 0)
                            ).toFixed(2)}
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
        ) : sessionId ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {t.transactionId}
                </p>
                <p className="font-mono text-sm text-gray-800 break-all">
                  {sessionId}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Información adicional */}
        <Card>
          <CardContent className="py-6">
            <div className="space-y-2 text-sm text-green-600 text-center">
              <p className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4" />
                {t.confirmationEmailSoon}
              </p>
              <p>{t.orderWillBeShipped}</p>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild size="lg">
            <Link href="/orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Ver Mis Órdenes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button variant="outline" size="lg" asChild>
            <Link href="/products">Seguir Comprando</Link>
          </Button>
        </motion.div>

        {/* Mensaje de agradecimiento */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">{t.thankYouMessage}</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
