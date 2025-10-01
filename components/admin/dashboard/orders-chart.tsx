"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface OrdersChartProps {
  data: Array<{
    status: string;
    count: number;
  }>;
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "hsl(45, 93%, 47%)", // Yellow
  processing: "hsl(217, 91%, 60%)", // Blue
  shipped: "hsl(262, 83%, 58%)", // Purple
  delivered: "hsl(142, 71%, 45%)", // Green
  cancelled: "hsl(0, 84%, 60%)", // Red
};

export function OrdersChart({ data }: OrdersChartProps) {
  const formattedData = data.map((item) => ({
    status: statusLabels[item.status] || item.status,
    count: item.count,
    fill: statusColors[item.status] || "hsl(var(--primary))",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Órdenes por Estado</CardTitle>
        <CardDescription>
          Distribución de órdenes según su estado actual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="status"
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [value, "Órdenes"]}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
