"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
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
  LineChart,
  Line,
  Area,
  AreaChart,
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
    projectedRevenue: number;
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
  salesByDay: Array<{
    date: string;
    paidRevenue: number;
    projectedRevenue: number;
  }>;
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
    pendiente: number;
    pagado: number;
    entregado: number;
    cancelado: number;
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
  pendiente: "Pendiente",
  pagado: "Pagado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30days");
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    // Si es período custom pero no hay fechas seleccionadas, no hacer la petición
    if (period === "custom" && (!customStartDate || !customEndDate)) {
      return;
    }

    setLoading(true);
    try {
      // Obtener el token de sesión
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No authenticated session");
      }

      let url = `/api/admin/analytics?period=${period}`;

      if (period === "custom" && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate.toISOString()}&endDate=${customEndDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
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
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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

  // Preparar datos para gráficos - Filtrar estados con 0 órdenes
  const statusChartData = Object.entries(data.ordersByStatus)
    .filter(([_, count]) => count > 0) // Solo mostrar estados con órdenes
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
    }));

  const provinceChartData = data.provinces.slice(0, 10);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Análisis Avanzado
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Métricas detalladas y análisis de rendimiento de tu negocio
        </p>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col gap-4">
            <Tabs
              value={period}
              onValueChange={handlePeriodChange}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full h-auto">
                <TabsTrigger
                  value="today"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Hoy
                </TabsTrigger>
                <TabsTrigger
                  value="yesterday"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Ayer
                </TabsTrigger>
                <TabsTrigger
                  value="7days"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  7d
                </TabsTrigger>
                <TabsTrigger
                  value="30days"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  30d
                </TabsTrigger>
                <TabsTrigger
                  value="3months"
                  className="hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-3"
                >
                  3m
                </TabsTrigger>
                <TabsTrigger
                  value="year"
                  className="hidden sm:inline-flex text-xs sm:text-sm px-2 sm:px-3"
                >
                  Año
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Custom
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {showCustomPicker && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="text-xs sm:text-sm">
                          {customStartDate
                            ? format(customStartDate, "PP", { locale: es })
                            : "Fecha inicio"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-muted-foreground text-center sm:text-left text-xs sm:text-sm">
                    hasta
                  </span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto justify-start"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="text-xs sm:text-sm">
                          {customEndDate
                            ? format(customEndDate, "PP", { locale: es })
                            : "Fecha fin"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    onClick={fetchAnalytics}
                    size="sm"
                    className="w-full sm:w-auto"
                    disabled={!customStartDate || !customEndDate}
                  >
                    Aplicar
                  </Button>
                </div>
                {(!customStartDate || !customEndDate) && (
                  <p className="text-xs text-muted-foreground">
                    Selecciona ambas fechas para ver los datos del período
                    personalizado
                  </p>
                )}
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
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <AlertDescription className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 items-start sm:items-center">
            <span className="font-semibold text-sm">Acción requerida:</span>
            <div className="flex flex-wrap gap-2">
              {data.actionRequired.ordersPending48h > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.actionRequired.ordersPending48h} órdenes +48h
                </Badge>
              )}
              {data.actionRequired.lowStockProducts > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.actionRequired.lowStockProducts} bajo stock
                </Badge>
              )}
              {data.actionRequired.delayedOrders > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.actionRequired.delayedOrders} atrasadas
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Ventas Confirmadas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold break-all">
              {formatCurrency(data.summary.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="whitespace-nowrap">solo órdenes pagadas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Proyección Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold break-all">
              {formatCurrency(data.summary.projectedRevenue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="whitespace-nowrap">todas las órdenes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total de Órdenes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.summary.totalOrders}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
              <TrendIcon value={data.summary.changes.orders} />
              <span>{formatPercentage(data.summary.changes.orders)}</span>
              <span className="whitespace-nowrap">vs anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Valor Promedio
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold break-all">
              {formatCurrency(data.summary.avgOrderValue)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
              <TrendIcon value={data.summary.changes.avgOrderValue} />
              <span>
                {formatPercentage(data.summary.changes.avgOrderValue)}
              </span>
              <span className="whitespace-nowrap">vs anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Clientes Únicos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.summary.uniqueCustomers}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
              <TrendIcon value={data.summary.changes.customers} />
              <span>{formatPercentage(data.summary.changes.customers)}</span>
              <span className="whitespace-nowrap">vs anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              CLV Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold break-all">
              {formatCurrency(data.conversion.avgCLV)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor de vida del cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Órdenes por Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.conversion.avgOrdersPerCustomer.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio de compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Tasa de Retorno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.conversion.repeatCustomerRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes recurrentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Nuevos vs Recurrentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.conversion.newCustomers} /{" "}
              {data.conversion.returningCustomers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribución de clientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart - Ventas Confirmadas vs Proyección */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Tendencia de Ventas
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Comparación de ingresos confirmados vs proyectados por día
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data.salesByDay}>
              <defs>
                <linearGradient
                  id="colorPaidRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient
                  id="colorProjectedRevenue"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  // Parse como fecha local en lugar de UTC
                  const [year, month, day] = value.split("-").map(Number);
                  const date = new Date(year, month - 1, day);
                  return format(date, "dd MMM", { locale: es });
                }}
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                labelFormatter={(value) => {
                  // Parse como fecha local en lugar de UTC
                  const [year, month, day] = value.split("-").map(Number);
                  const date = new Date(year, month - 1, day);
                  return format(date, "dd MMMM yyyy", { locale: es });
                }}
                formatter={(value: number, name: string) => {
                  const label =
                    name === "paidRevenue"
                      ? "Ventas Confirmadas"
                      : "Proyección Total";
                  return [`$${(value as number).toLocaleString()}`, label];
                }}
              />
              <Area
                type="monotone"
                dataKey="paidRevenue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorPaidRevenue)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="projectedRevenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorProjectedRevenue)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top Products */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Top 10 Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {data.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg border"
                >
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs sm:text-sm">
                    {index + 1}
                  </div>
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">
                      {product.name}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {product.quantitySold} unidades
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-xs sm:text-sm break-all">
                      {formatCurrency(product.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.orders} órdenes
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Órdenes por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <>
                <div className="w-full overflow-hidden">
                  <ResponsiveContainer
                    width="100%"
                    height={250}
                    className="sm:h-[300px]"
                  >
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={window.innerWidth < 640 ? 60 : 80}
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
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
                  {Object.entries(data.ordersByStatus)
                    .filter(([_, count]) => count > 0) // Solo mostrar estados con órdenes
                    .map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-medium truncate">
                          {STATUS_LABELS[status]}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs sm:text-sm ml-2"
                        >
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-muted-foreground">
                <p className="text-sm">No hay órdenes en este período</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Province Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Análisis por Provincias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
            <div className="min-w-[500px] sm:min-w-0 px-2 sm:px-0">
              <ResponsiveContainer
                width="100%"
                height={350}
                className="sm:h-[400px]"
              >
                <BarChart data={provinceChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="province"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                    className="text-xs sm:text-sm"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-xs sm:text-sm"
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "orders") return [value, "Órdenes"];
                      if (name === "revenue")
                        return [formatCurrency(value as number), "Ingresos"];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} iconSize={12} />
                  <Bar dataKey="orders" fill="#3b82f6" name="Órdenes" />
                  <Bar dataKey="revenue" fill="#10b981" name="Ingresos (CUP)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
