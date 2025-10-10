"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type MetricType = "confirmed" | "projected" | "orders";

interface SalesChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  metricType: MetricType;
}

const metricConfig = {
  confirmed: {
    title: "Ventas Confirmadas",
    description: "Solo órdenes pagadas en los últimos 30 días",
    dataLabel: "Ventas",
    color: "hsl(var(--primary))",
    formatter: (value: number) => `$${value.toLocaleString()}`,
  },
  projected: {
    title: "Proyección de Ventas",
    description: "Todas las órdenes excepto canceladas en los últimos 30 días",
    dataLabel: "Proyección",
    color: "hsl(var(--primary))",
    formatter: (value: number) => `$${value.toLocaleString()}`,
  },
  orders: {
    title: "Órdenes por Día",
    description: "Cantidad de órdenes diarias en los últimos 30 días",
    dataLabel: "Órdenes",
    color: "hsl(142 76% 36%)", // Verde para órdenes
    formatter: (value: number) =>
      `${value} ${value === 1 ? "orden" : "órdenes"}`,
  },
};

export function SalesChart({ data, metricType }: SalesChartProps) {
  const config = metricConfig[metricType];

  const formattedData = data.map((item) => {
    // Parse como fecha local en lugar de UTC para evitar problemas de zona horaria
    const [year, month, day] = item.date.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return {
      value: item.value,
      date: format(date, "dd MMM", { locale: es }),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient
                id={`color-${metricType}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={config.formatter}
              allowDecimals={metricType === "orders" ? false : true}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [
                config.formatter(value),
                config.dataLabel,
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={config.color}
              fillOpacity={1}
              fill={`url(#color-${metricType})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
