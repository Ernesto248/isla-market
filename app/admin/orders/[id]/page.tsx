"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  User,
  MapPin,
  Phone,
  Mail,
  Package,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

// Funciones helper
const getStatusColor = (
  status: Order["status"]
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "pendiente":
      return "secondary";
    case "pagado":
      return "default";
    case "entregado":
      return "outline";
    case "cancelado":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusText = (status: Order["status"]): string => {
  switch (status) {
    case "pendiente":
      return "Pendiente";
    case "pagado":
      return "Pagado";
    case "entregado":
      return "Entregado";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
};

const getStatusIcon = (status: Order["status"]) => {
  switch (status) {
    case "pendiente":
      return <Clock className="h-4 w-4" />;
    case "pagado":
      return <CheckCircle2 className="h-4 w-4" />;
    case "entregado":
      return <CheckCircle2 className="h-4 w-4" />;
    case "cancelado":
      return <XCircle className="h-4 w-4" />;
    default:
      return null;
  }
};

// Lógica de estados permitidos según el flujo del negocio
// Flujo simplificado: pendiente → pagado → entregado (con opción de cancelar)
const getAllowedNextStates = (
  currentStatus: Order["status"]
): Order["status"][] => {
  const allowedTransitions: Record<Order["status"], Order["status"][]> = {
    pendiente: ["pagado", "cancelado"], // Pendiente puede pasar a Pagado o Cancelado
    pagado: ["entregado", "cancelado"], // Pagado puede pasar a Entregado o Cancelado
    entregado: [], // Estado final, no se puede cambiar
    cancelado: [], // Estado final, no se puede cambiar
  };

  return allowedTransitions[currentStatus] || [];
};

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { session } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<Order["status"] | "">("");

  // Transformar datos de la API al formato esperado
  const transformOrderData = (rawData: any): Order => {
    console.log("🔍 Raw data structure:", {
      hasUsers: !!rawData.users,
      usersType: Array.isArray(rawData.users) ? "array" : typeof rawData.users,
      users: rawData.users,
      userFullName: rawData.users?.full_name,
      userEmail: rawData.users?.email,
      customerId: rawData.customer_id,
      customerName: rawData.customer_name,
      hasShippingAddresses: !!rawData.shipping_addresses,
      shippingAddressesType: Array.isArray(rawData.shipping_addresses)
        ? "array"
        : typeof rawData.shipping_addresses,
      shippingAddresses: rawData.shipping_addresses,
    });

    // Intentar obtener el nombre del cliente de múltiples fuentes
    const fullName =
      rawData.users?.full_name || // De la tabla users
      rawData.customer_name || // Del campo customer_name de la orden
      rawData.users?.email?.split("@")[0] || // Del email como fallback
      null;

    return {
      ...rawData,
      // Mapear order_items a items
      items:
        rawData.order_items?.map((item: any) => ({
          ...item,
          // Mapear el objeto products a product
          product: item.products
            ? {
                ...item.products,
                // Asegurar que tenga la propiedad image (primera imagen del array)
                image: item.products.images?.[0] || null,
              }
            : null,
        })) || [],
      // Extraer información del usuario
      // users es un OBJETO, no un array (porque usamos .single() en el query)
      full_name: fullName,
      email: rawData.users?.email || null,
      // Mapear shipping_addresses a recipientInfo
      // shipping_addresses es un ARRAY de direcciones
      recipientInfo: Array.isArray(rawData.shipping_addresses)
        ? rawData.shipping_addresses[0] || null
        : rawData.shipping_addresses || null,
    };
  };

  // Cargar orden
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${params.id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Orden no encontrada");
            router.push("/admin/orders");
            return;
          }
          throw new Error("Error al cargar la orden");
        }

        const rawData = await response.json();
        console.log("📦 Raw order data from API:", rawData);

        // Transformar los datos al formato esperado
        const transformedOrder = transformOrderData(rawData);
        console.log("✨ Transformed order data:", transformedOrder);

        setOrder(transformedOrder);
        setNewStatus(transformedOrder.status);
      } catch (error) {
        console.error("Error loading order:", error);
        toast.error("Error al cargar la orden");
        router.push("/admin/orders");
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token && params.id) {
      fetchOrder();
    }
  }, [session?.access_token, params.id, router]);

  // Actualizar estado de la orden
  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === order?.status) {
      toast.info("No hay cambios para guardar");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          notes: order?.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la orden");
      }

      const rawData = await response.json();
      console.log("📦 Raw updated order data:", rawData);

      // Transformar los datos igual que en la carga inicial
      const transformedOrder = transformOrderData(rawData);
      console.log("✨ Transformed updated order:", transformedOrder);

      setOrder(transformedOrder);
      toast.success(`Estado actualizado a: ${getStatusText(newStatus)}`);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error al actualizar la orden");
    } finally {
      setUpdating(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/orders")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Detalle de Orden</h1>
          <p className="text-muted-foreground">
            ID: {order.id.substring(0, 16)}...
          </p>
        </div>
        <Badge
          variant={getStatusColor(order.status)}
          className="flex items-center gap-2 text-base px-4 py-2"
        >
          {getStatusIcon(order.status)}
          {getStatusText(order.status)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna Principal (2/3) */}
        <div className="md:col-span-2 space-y-6">
          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Ordenados
              </CardTitle>
              <CardDescription>
                {order.items?.length || 0} producto(s) en esta orden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product?.image || "/placeholder.png"}
                            alt={item.product?.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium">
                              {item.product?.name || "Producto"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {item.product_id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        x{item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatPrice(item.total_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              {/* Resumen de totales */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{order.full_name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Correo Electrónico
                  </p>
                  <p className="font-medium">{order.email || "N/A"}</p>
                </div>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Teléfono del Comprador
                    </p>
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Destinatario */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Destinatario en Cuba
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.recipientInfo ? (
                <>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre</p>
                      <p className="font-medium">
                        {order.recipientInfo.first_name}{" "}
                        {order.recipientInfo.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{order.recipientInfo.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">
                        {order.recipientInfo.street} #
                        {order.recipientInfo.house_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Entre: {order.recipientInfo.between_streets}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.recipientInfo.neighborhood},{" "}
                        {order.recipientInfo.province}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No hay información del destinatario
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral (1/3) */}
        <div className="space-y-6">
          {/* Cambiar Estado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cambiar Estado</CardTitle>
              <CardDescription>Actualiza el estado de la orden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getAllowedNextStates(order.status).length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">
                    Esta orden está en estado final y no se puede modificar.
                  </p>
                </div>
              ) : (
                <>
                  <Select
                    value={newStatus}
                    onValueChange={(value) =>
                      setNewStatus(value as Order["status"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Mostrar el estado actual primero */}
                      <SelectItem value={order.status}>
                        {getStatusText(order.status)} (actual)
                      </SelectItem>
                      {/* Luego mostrar los estados permitidos */}
                      {getAllowedNextStates(order.status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {getStatusText(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={
                          updating || newStatus === order.status || !newStatus
                        }
                        className="w-full"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          "Actualizar Estado"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          ¿Confirmar cambio de estado?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Estás a punto de cambiar el estado de la orden de{" "}
                          <span className="font-semibold text-foreground">
                            {getStatusText(order.status)}
                          </span>{" "}
                          a{" "}
                          <span className="font-semibold text-foreground">
                            {newStatus &&
                              getStatusText(newStatus as Order["status"])}
                          </span>
                          .
                          <br />
                          Esta acción quedará registrada en el historial de la
                          orden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStatusUpdate}>
                          Confirmar cambio
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Creada</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Última Actualización</p>
                <p className="font-medium">{formatDate(order.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
