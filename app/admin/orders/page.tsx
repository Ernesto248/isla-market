"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Package,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

// Función helper para obtener el color del badge según el estado
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

// Función helper para obtener el texto en español del estado
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

// Función helper para obtener el icono según el estado
const getStatusIcon = (status: Order["status"]) => {
  switch (status) {
    case "pendiente":
      return <Clock className="h-3 w-3" />;
    case "pagado":
      return <CheckCircle2 className="h-3 w-3" />;
    case "entregado":
      return <CheckCircle2 className="h-3 w-3" />;
    case "cancelado":
      return <XCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Estadísticas rápidas
  const [stats, setStats] = useState({
    total: 0,
    pendiente: 0,
    pagado: 0,
    entregado: 0,
    cancelado: 0,
  });

  // Cargar órdenes
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Error al cargar las órdenes");
        }

        const data = await response.json();
        const ordersData = data.orders || [];
        setOrders(ordersData);
        setFilteredOrders(ordersData);

        // Calcular estadísticas
        setStats({
          total: ordersData.length,
          pendiente: ordersData.filter((o: Order) => o.status === "pendiente")
            .length,
          pagado: ordersData.filter((o: Order) => o.status === "pagado").length,
          entregado: ordersData.filter((o: Order) => o.status === "entregado")
            .length,
          cancelado: ordersData.filter((o: Order) => o.status === "cancelado")
            .length,
        });
      } catch (error) {
        console.error("Error loading orders:", error);
        toast.error("Error al cargar las órdenes");
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token) {
      fetchOrders();
    }
  }, [session?.access_token]);

  // Filtrar órdenes según búsqueda y estado
  useEffect(() => {
    let filtered = orders;

    // Filtrar por búsqueda (ID, nombre del cliente, email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.email?.toLowerCase().includes(query) ||
          order.full_name?.toLowerCase().includes(query) ||
          order.recipientInfo?.first_name?.toLowerCase().includes(query) ||
          order.recipientInfo?.last_name?.toLowerCase().includes(query)
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gestión de Órdenes</h1>
        <p className="text-muted-foreground">
          Administra y da seguimiento a todas las órdenes
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Órdenes
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Todas las órdenes registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendiente}</div>
            <p className="text-xs text-muted-foreground">Esperando pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pagado}</div>
            <p className="text-xs text-muted-foreground">Listas para enviar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.entregado}</div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Órdenes</CardTitle>
          <CardDescription>
            Busca por ID, cliente o destinatario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente o destinatario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por estado */}
            <div className="w-full sm:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="entregado">Entregado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredOrders.length} de {orders.length} órdenes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de órdenes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">
                          {searchQuery || statusFilter !== "all"
                            ? "No se encontraron órdenes con los filtros aplicados"
                            : "No hay órdenes registradas aún"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {order.full_name ||
                              order.email?.split("@")[0] ||
                              "Cliente"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {order.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {order.recipientInfo
                              ? `${order.recipientInfo.first_name} ${order.recipientInfo.last_name}`
                              : "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {order.recipientInfo?.province || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(order.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(order.status)}
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/orders/${order.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
