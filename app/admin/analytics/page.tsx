"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  AlertCircle,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnalyticsData {
  period: {
    type: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    uniqueCustomers: number;
    changes: {
      revenue: number;
      orders: number;
      avgOrderValue: number;
      customers: number;
    };
  };
  topProducts: Array<{
    id: string;
    name: string;
    image: string | null;
    quantitySold: number;
    revenue: number;
    orders: number;
  }>;
  provinces: Array<{
    province: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    paid: number;
  };
  conversion: {
    newCustomers: number;
    returningCustomers: number;
    avgCLV: number;
    avgOrdersPerCustomer: number;
    repeatCustomerRate: number;
  };
  actionRequired: {
    ordersPending48h: number;
    lowStockProducts: number;
    delayedOrders: number;
  };
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "En Proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
  paid: "Pagado",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30days");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/admin/analytics?period=${period}`;

      if (period === "custom" && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate.toISOString()}&endDate=${customEndDate.toISOString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch analytics");

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [period, customStartDate, customEndDate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    if (newPeriod !== "custom") {
      setShowCustomPicker(false);
    } else {
      setShowCustomPicker(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CU", {
      style: "currency",
      currency: "CUP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const TrendIcon = ({ value }: { value: number }) => {
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          No se pudieron cargar los datos de analytics
        </p>
      </div>
    );
  }

  // Preparar datos para gráficos
  const statusChartData = Object.entries(data.ordersByStatus).map(
    ([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
    })
  );

  const provinceChartData = data.provinces.slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análisis Avanzado</h1>
        <p className="text-muted-foreground mt-1">
          Métricas detalladas y análisis de rendimiento de tu negocio
        </p>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <Tabs
              value={period}
              onValueChange={handlePeriodChange}
              className="w-full md:w-auto"
            >
              <TabsList className="grid grid-cols-4 md:grid-cols-7 w-full">
                <TabsTrigger value="today">Hoy</TabsTrigger>
                <TabsTrigger value="yesterday">Ayer</TabsTrigger>
                <TabsTrigger value="7days">7 días</TabsTrigger>
                <TabsTrigger value="30days">30 días</TabsTrigger>
                <TabsTrigger value="3months">3 meses</TabsTrigger>
                <TabsTrigger value="year">Año</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>

            {showCustomPicker && (
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate
                        ? format(customStartDate, "PP", { locale: es })
                        : "Fecha inicio"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">hasta</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate
                        ? format(customEndDate, "PP", { locale: es })
                        : "Fecha fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button onClick={fetchAnalytics} size="sm">
                  Aplicar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Required Alerts */}
      {(data.actionRequired.ordersPending48h > 0 ||
        data.actionRequired.lowStockProducts > 0 ||
        data.actionRequired.delayedOrders > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap gap-4 items-center">
            <span className="font-semibold">Acción requerida:</span>
            {data.actionRequired.ordersPending48h > 0 && (
              <Badge variant="destructive">
                {data.actionRequired.ordersPending48h} órdenes pendientes +48h
              </Badge>
            )}
            {data.actionRequired.lowStockProducts > 0 && (
              <Badge variant="destructive">
                {data.actionRequired.lowStockProducts} productos bajo stock
              </Badge>
            )}
            {data.actionRequired.delayedOrders > 0 && (
              <Badge variant="destructive">
                {data.actionRequired.delayedOrders} órdenes atrasadas
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendIcon value={data.summary.changes.revenue} />
              <span>{formatPercentage(data.summary.changes.revenue)}</span>
              <span>vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Órdenes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalOrders}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendIcon value={data.summary.changes.orders} />
              <span>{formatPercentage(data.summary.changes.orders)}</span>
              <span>vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Promedio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.summary.avgOrderValue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendIcon value={data.summary.changes.avgOrderValue} />
              <span>
                {formatPercentage(data.summary.changes.avgOrderValue)}
              </span>
              <span>vs período anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Únicos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.uniqueCustomers}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendIcon value={data.summary.changes.customers} />
              <span>{formatPercentage(data.summary.changes.customers)}</span>
              <span>vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CLV Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.conversion.avgCLV)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor de vida del cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes por Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.conversion.avgOrdersPerCustomer.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio de compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Retorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.conversion.repeatCustomerRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes recurrentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevos vs Recurrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.conversion.newCustomers} /{" "}
              {data.conversion.returningCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribución de clientes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Top 10 Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.quantitySold} unidades vendidas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(product.revenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.orders} órdenes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Órdenes por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(data.ordersByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between p-2 rounded border"
                >
                  <span className="text-sm">{STATUS_LABELS[status]}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Province Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis por Provincias</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={provinceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="province"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "orders") return [value, "Órdenes"];
                  if (name === "revenue")
                    return [formatCurrency(value as number), "Ingresos"];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="orders" fill="#3b82f6" name="Órdenes" />
              <Bar dataKey="revenue" fill="#10b981" name="Ingresos (CUP)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
