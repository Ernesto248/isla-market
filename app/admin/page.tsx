"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { StatsCard } from "@/components/admin/dashboard/stats-card";
import { SalesChart } from "@/components/admin/dashboard/sales-chart";
import { OrdersChart } from "@/components/admin/dashboard/orders-chart";
import { RecentOrders } from "@/components/admin/dashboard/recent-orders";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DashboardStats {
  sales: {
    total: number;
    average: number;
    byDay: Array<{ date: string; sales: number }>;
  };
  orders: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    recent: Array<{
      id: string;
      customer_name: string;
      total: number;
      status: string;
      created_at: string;
    }>;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
  };
  categories: {
    total: number;
  };
}

export default function AdminDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Esperar a que haya una sesión válida
        if (!session?.access_token) {
          setError("No se encontró una sesión válida");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/admin/stats?period=30", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al cargar las estadísticas"
          );
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }

    // Solo hacer la llamada cuando tengamos una sesión
    if (session) {
      fetchStats();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Vista general de tu tienda</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[350px]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[350px]" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Vista general de tu tienda</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "No se pudieron cargar las estadísticas"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vista general de tu tienda - Últimos 30 días
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ventas Totales"
          value={`$${stats.sales.total.toLocaleString()}`}
          description="en los últimos 30 días"
          icon={DollarSign}
        />
        <StatsCard
          title="Órdenes"
          value={stats.orders.total}
          description="total de órdenes"
          icon={ShoppingCart}
        />
        <StatsCard
          title="Productos Activos"
          value={stats.products.active}
          description={`${stats.products.total} productos totales`}
          icon={Package}
        />
        <StatsCard
          title="Ticket Promedio"
          value={`$${stats.sales.average.toLocaleString()}`}
          description="por orden"
          icon={TrendingUp}
        />
      </div>

      {/* Low Stock Alert */}
      {stats.products.lowStock > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Productos con bajo inventario</AlertTitle>
          <AlertDescription>
            Hay {stats.products.lowStock} producto(s) con menos de 10 unidades
            en stock. Considera reabastecer pronto.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart data={stats.sales.byDay} />
        <OrdersChart data={stats.orders.byStatus} />
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={stats.orders.recent} />
    </div>
  );
}
