"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useParams } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Calendar,
  ShoppingBag,
  DollarSign,
  Package,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  role: "customer" | "admin";
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    products: {
      id: string;
      name: string;
      images: string[] | null;
    } | null;
  }>;
}

interface CustomerData {
  user: Customer;
  orders: Order[];
  stats: {
    total_orders: number;
    total_spent: number;
    pending_orders: number;
    completed_orders: number;
  };
}

// Función helper para obtener el color del badge según el estado
const getStatusColor = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "pending":
      return "secondary";
    case "paid":
    case "confirmed":
    case "processing":
      return "default";
    case "shipped":
      return "default";
    case "delivered":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    confirmed: "Confirmado",
    processing: "Procesando",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };
  return statusMap[status] || status;
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const { user, loading: authLoading } = useAuth();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Redirigir si no está autenticado o no es admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Cargar datos del cliente
  useEffect(() => {
    const loadCustomerData = async () => {
      if (!customerId || !user || user.role !== "admin") return;

      try {
        setLoading(true);
        const response = await fetch(`/api/admin/customers/${customerId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al cargar el cliente");
        }

        setCustomerData(data);
      } catch (error) {
        console.error("Error loading customer:", error);
        toast.error("Error al cargar los datos del cliente");
        router.push("/admin/customers");
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, [customerId, user, router]);

  // Actualizar rol del usuario
  const handleRoleChange = async (newRole: "customer" | "admin") => {
    if (!customerData) return;

    try {
      setUpdatingRole(true);
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el rol");
      }

      const { user: updatedUser } = await response.json();
      setCustomerData({
        ...customerData,
        user: updatedUser,
      });

      toast.success("Rol actualizado exitosamente");
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Error al actualizar el rol");
    } finally {
      setUpdatingRole(false);
    }
  };

  if (authLoading || loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!customerData) {
    return null;
  }

  const { user: customer, orders, stats } = customerData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/admin/customers")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Detalle del Cliente
          </h1>
          <p className="text-muted-foreground mt-1">
            Información completa y historial de órdenes
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Columna Principal (2/3) */}
        <div className="md:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">
                      {customer.full_name || "Sin nombre"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registrado</p>
                    <p className="font-medium">
                      {new Date(customer.created_at).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rol</p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          customer.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {customer.role === "admin" ? "Admin" : "Cliente"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cambiar Rol */}
              <div className="pt-4 border-t">
                <label className="text-sm font-medium mb-2 block">
                  Cambiar Rol
                </label>
                <Select
                  value={customer.role}
                  onValueChange={handleRoleChange}
                  disabled={updatingRole || customer.id === user.id}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                {customer.id === user.id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No puedes cambiar tu propio rol
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historial de Órdenes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Historial de Órdenes ({orders.length})
              </CardTitle>
              <CardDescription>
                Todas las órdenes realizadas por este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Este cliente aún no ha realizado ninguna orden
                  </p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Orden</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Productos</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/admin/orders/${order.id}`)
                          }
                        >
                          <TableCell className="font-mono text-sm">
                            #{order.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString(
                              "es-ES"
                            )}
                          </TableCell>
                          <TableCell>
                            {order.order_items.length} producto(s)
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.total_amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral (1/3) - Estadísticas */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Órdenes
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pending_orders} pendiente(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Gastado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.total_spent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En órdenes completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Órdenes Completadas
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed_orders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_orders > 0
                  ? `${Math.round(
                      (stats.completed_orders / stats.total_orders) * 100
                    )}% del total`
                  : "Sin órdenes aún"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
