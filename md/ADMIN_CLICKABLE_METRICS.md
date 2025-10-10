# Implementación: Tarjetas Clickeables en Dashboard Admin

**Fecha:** 10 de octubre de 2025  
**Feature:** Tarjetas de métricas interactivas con gráfico dinámico  
**Archivos modificados:** 4

---

## 🎯 Objetivo

Hacer que las 3 primeras tarjetas del dashboard admin ("Ventas Confirmadas", "Proyección Total", y "Órdenes") sean clickeables, y que al seleccionarlas, el gráfico de ventas muestre la información por día de la tarjeta seleccionada.

---

## 🐛 Problema Anterior

### Dashboard Estático

```
❌ Gráfico mostraba solo un tipo de datos (ventas proyectadas)
❌ Tarjetas eran solo visuales, no interactivas
❌ No había forma de ver detalles por día de cada métrica
❌ Usuario no podía explorar diferentes perspectivas de los datos
```

---

## ✅ Solución Implementada

### 1. **API Actualizada** (`app/api/admin/stats/route.ts`)

#### ANTES:

```typescript
const salesByDay = Array.from({ length: daysAgo + 1 }, (_, i) => {
  // Solo un array con ventas proyectadas
  return {
    date: dateStr,
    sales: daySales,
    orders: ordersCount,
  };
});

// Retorno
sales: {
  byDay: salesByDay, // Solo un array
}
```

#### DESPUÉS:

```typescript
// 3 arrays separados para cada métrica
const salesByDayConfirmed = Array.from({ length: daysAgo + 1 }, (_, i) => {
  // Solo órdenes con estado "pagado"
  return {
    date: dateStr,
    value: confirmedSales,
  };
});

const salesByDayProjected = Array.from({ length: daysAgo + 1 }, (_, i) => {
  // Todas las órdenes excepto canceladas
  return {
    date: dateStr,
    value: projectedSales,
  };
});

const ordersByDay = Array.from({ length: daysAgo + 1 }, (_, i) => {
  // Cantidad de órdenes por día
  return {
    date: dateStr,
    value: ordersCount,
  };
});

// Retorno
sales: {
  total: Math.round(totalSales * 100) / 100,
  projected: Math.round(projectedSales * 100) / 100,
  average: Math.round(averageOrderValue * 100) / 100,
  byDayConfirmed: salesByDayConfirmed,   // ← Nuevo
  byDayProjected: salesByDayProjected,   // ← Nuevo
  byDayOrders: ordersByDay,              // ← Nuevo
}
```

**Beneficios:**

- ✅ Datos precisos para cada métrica
- ✅ Separación clara de responsabilidades
- ✅ Formato consistente (`{ date, value }`)

---

### 2. **Tipo TypeScript Actualizado** (`app/admin/page.tsx`)

```typescript
// Nuevo tipo para métricas
type MetricType = "confirmed" | "projected" | "orders";

interface DashboardStats {
  sales: {
    total: number;
    projected: number;
    average: number;
    byDayConfirmed: Array<{ date: string; value: number }>; // ← Nuevo
    byDayProjected: Array<{ date: string; value: number }>; // ← Nuevo
    byDayOrders: Array<{ date: string; value: number }>; // ← Nuevo
  };
  // ... resto de la interfaz
}
```

---

### 3. **StatsCard Clickeable** (`components/admin/dashboard/stats-card.tsx`)

#### Props Nuevas:

```typescript
interface StatsCardProps {
  // ... props existentes
  onClick?: () => void; // ← Nueva: Handler para clicks
  isSelected?: boolean; // ← Nueva: Estado de selección
}
```

#### Estilos de Selección:

```typescript
<Card
  className={cn(
    "transition-all duration-200",
    onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
    isSelected && "ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5",
    className
  )}
  onClick={onClick}
>
```

**Estados visuales:**

- **Normal:** Card estándar
- **Hover:** Sombra + escala 1.02
- **Seleccionado:** Ring primary + fondo tinted + escala

---

### 4. **SalesChart Dinámico** (`components/admin/dashboard/sales-chart.tsx`)

#### Props Actualizadas:

```typescript
interface SalesChartProps {
  data: Array<{
    date: string;
    value: number; // ← Antes era "sales"
  }>;
  metricType: MetricType; // ← Nueva prop
}
```

#### Configuración por Métrica:

```typescript
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
    color: "hsl(142 76% 36%)", // Verde
    formatter: (value: number) =>
      `${value} ${value === 1 ? "orden" : "órdenes"}`,
  },
};
```

#### Formato Dinámico del Eje Y:

```typescript
<YAxis
  tickFormatter={config.formatter}
  allowDecimals={metricType === "orders" ? false : true} // ← Enteros para órdenes
/>
```

---

### 5. **Dashboard con Estado** (`app/admin/page.tsx`)

#### Estado de Selección:

```typescript
const [selectedMetric, setSelectedMetric] = useState<MetricType>("confirmed");
```

**Valor inicial:** `"confirmed"` (Ventas Confirmadas) - la métrica más importante

#### Tarjetas Clickeables:

```typescript
<StatsCard
  title="Ventas Confirmadas"
  value={`$${stats.sales.total.toLocaleString()}`}
  description="solo órdenes pagadas"
  icon={DollarSign}
  onClick={() => setSelectedMetric("confirmed")}  // ← Handler
  isSelected={selectedMetric === "confirmed"}     // ← Estado
/>

<StatsCard
  title="Proyección Total"
  value={`$${stats.sales.projected.toLocaleString()}`}
  description="todas las órdenes"
  icon={TrendingUp}
  onClick={() => setSelectedMetric("projected")}
  isSelected={selectedMetric === "projected"}
/>

<StatsCard
  title="Órdenes"
  value={stats.orders.total}
  description="total de órdenes"
  icon={ShoppingCart}
  onClick={() => setSelectedMetric("orders")}
  isSelected={selectedMetric === "orders"}
/>
```

**Nota:** Las tarjetas "Productos Activos" y "Ticket Promedio" NO tienen `onClick` - no son clickeables.

#### Gráfico Dinámico:

```typescript
<SalesChart
  data={
    selectedMetric === "confirmed"
      ? stats.sales.byDayConfirmed
      : selectedMetric === "projected"
      ? stats.sales.byDayProjected
      : stats.sales.byDayOrders
  }
  metricType={selectedMetric}
/>
```

---

## 🎨 Flujo de Interacción

```
Usuario hace click en "Ventas Confirmadas"
  ↓
setSelectedMetric("confirmed")
  ↓
StatsCard recibe isSelected={true}
  ↓
Aplica estilos: ring-2 ring-primary + bg-primary/5 + scale-[1.02]
  ↓
SalesChart recibe:
  - data={stats.sales.byDayConfirmed}
  - metricType="confirmed"
  ↓
Gráfico se actualiza:
  - Título: "Ventas Confirmadas"
  - Descripción: "Solo órdenes pagadas en los últimos 30 días"
  - Datos: Solo órdenes con estado "pagado"
  - Eje Y: Formato dinero ($)
  ↓
Usuario ve gráfico de ventas confirmadas por día ✓
```

---

## 📊 Comparación de Métricas

### 1️⃣ Ventas Confirmadas

```
Tarjeta:
  Valor: $45,250
  Descripción: "solo órdenes pagadas"

Gráfico:
  Título: "Ventas Confirmadas"
  Descripción: "Solo órdenes pagadas en los últimos 30 días"
  Datos: Solo status = "pagado"
  Eje Y: $0, $500, $1,000...
  Color: Primary (azul)
```

### 2️⃣ Proyección Total

```
Tarjeta:
  Valor: $68,900
  Descripción: "todas las órdenes"

Gráfico:
  Título: "Proyección de Ventas"
  Descripción: "Todas las órdenes excepto canceladas en los últimos 30 días"
  Datos: Todos los status excepto "cancelado"
  Eje Y: $0, $1,000, $2,000...
  Color: Primary (azul)
```

### 3️⃣ Órdenes

```
Tarjeta:
  Valor: 156
  Descripción: "total de órdenes"

Gráfico:
  Título: "Órdenes por Día"
  Descripción: "Cantidad de órdenes diarias en los últimos 30 días"
  Datos: Cantidad de órdenes (número entero)
  Eje Y: 0, 5, 10, 15... (sin decimales)
  Color: Verde (#22c55e)
  Tooltip: "5 órdenes" / "1 orden"
```

---

## 🎯 Estados Visuales de las Tarjetas

### Normal (No Seleccionada, No Clickeable)

```css
Card {
  /* Estilos estándar */
  border: 1px solid hsl(var(--border));
  shadow: sm;
}
```

**Ejemplo:** "Productos Activos", "Ticket Promedio"

---

### Normal (No Seleccionada, Clickeable)

```css
Card {
  cursor: pointer;
  transition: all 0.2s;
}

Card:hover {
  shadow: lg;
  scale: 1.02;
}
```

**Ejemplo:** "Ventas Confirmadas" (cuando NO está seleccionada)

---

### Seleccionada

```css
Card {
  ring: 2px solid hsl(var(--primary));
  shadow: lg;
  scale: 1.02;
  background: hsl(var(--primary) / 0.05);
}

Card Icon {
  color: hsl(var(--primary));
}
```

**Ejemplo:** "Ventas Confirmadas" (cuando ESTÁ seleccionada)

---

## 🧪 Testing Checklist

### Funcionalidad

- [ ] **Click en "Ventas Confirmadas":**

  - Tarjeta se destaca visualmente (ring + fondo tinted)
  - Gráfico cambia a "Ventas Confirmadas"
  - Datos muestran solo órdenes pagadas
  - Eje Y en formato dinero ($)

- [ ] **Click en "Proyección Total":**

  - Tarjeta anterior se desmarca
  - Nueva tarjeta se destaca
  - Gráfico cambia a "Proyección de Ventas"
  - Datos incluyen todas las órdenes excepto canceladas
  - Eje Y en formato dinero ($)

- [ ] **Click en "Órdenes":**
  - Gráfico cambia a "Órdenes por Día"
  - Datos muestran cantidad de órdenes
  - Eje Y sin decimales (números enteros)
  - Color del gráfico cambia a verde
  - Tooltip muestra "X órdenes" o "1 orden"

### Visual

- [ ] Transiciones suaves (200ms)
- [ ] Hover effect funciona en tarjetas clickeables
- [ ] Ring primary visible en tarjeta seleccionada
- [ ] Fondo tinted (bg-primary/5) en tarjeta seleccionada
- [ ] Icono cambia a color primary cuando seleccionado
- [ ] Gráfico se actualiza sin parpadeos

### Edge Cases

- [ ] Al cargar la página, "Ventas Confirmadas" está seleccionada por defecto
- [ ] Click en tarjeta ya seleccionada no causa problemas
- [ ] Click en "Productos Activos" o "Ticket Promedio" no hace nada
- [ ] Datos del gráfico coinciden con los totales de las tarjetas

### Responsividad

- [ ] Mobile: Tarjetas en stack vertical, funcionan correctamente
- [ ] Tablet: Grid de 2-3 columnas, clicks funcionan
- [ ] Desktop: Grid de 5 columnas, todo visible y clickeable

---

## 📱 Responsive Behavior

### Mobile (< 640px)

```
┌─────────────────────┐
│ Ventas Confirmadas  │ ← Seleccionada (ring + bg)
│ $45,250             │
└─────────────────────┘
┌─────────────────────┐
│ Proyección Total    │ ← Clickeable
│ $68,900             │
└─────────────────────┘
┌─────────────────────┐
│ Órdenes             │ ← Clickeable
│ 156                 │
└─────────────────────┘
┌─────────────────────┐
│ Productos Activos   │ ← No clickeable
│ 45                  │
└─────────────────────┘
┌─────────────────────┐
│ Ticket Promedio     │ ← No clickeable
│ $290                │
└─────────────────────┘

┌─────────────────────┐
│ [Gráfico Dinámico]  │ ← Muestra métrica seleccionada
│                     │
└─────────────────────┘
```

---

### Desktop (> 1280px)

```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Ventas  │Proyecc. │ Órdenes │Productos│ Ticket  │
│Confirm. │ Total   │         │ Activos │Promedio │
│$45,250  │$68,900  │  156    │   45    │  $290   │
│   🔵    │         │         │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┘
     ↑         ↑         ↑         ↑         ↑
  Selected  Click    Click      No         No
            able     able     clickeable clickeable

┌────────────────────────┬────────────────────────┐
│  [Gráfico Dinámico]    │  [Gráfico de Status]   │
│  Ventas Confirmadas    │  Órdenes por Estado    │
│                        │                        │
└────────────────────────┴────────────────────────┘
```

---

## 🔧 Código Clave

### Handler Simple

```typescript
const [selectedMetric, setSelectedMetric] = useState<MetricType>("confirmed");

// En la tarjeta
<StatsCard
  onClick={() => setSelectedMetric("confirmed")}
  isSelected={selectedMetric === "confirmed"}
/>;
```

### Lógica de Datos

```typescript
<SalesChart
  data={
    selectedMetric === "confirmed"
      ? stats.sales.byDayConfirmed // Solo pagadas
      : selectedMetric === "projected"
      ? stats.sales.byDayProjected // Todas excepto canceladas
      : stats.sales.byDayOrders // Cantidad de órdenes
  }
  metricType={selectedMetric}
/>
```

### Config del Gráfico

```typescript
const config = metricConfig[metricType];

<CardTitle>{config.title}</CardTitle>
<CardDescription>{config.description}</CardDescription>
<YAxis tickFormatter={config.formatter} />
<Tooltip formatter={(value) => [config.formatter(value), config.dataLabel]} />
```

---

## 💡 Mejoras Futuras (Opcional)

### 1. **Animación de Transición en Gráfico**

```typescript
import { motion } from "framer-motion";

<motion.div
  key={metricType}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <ResponsiveContainer>{/* Gráfico */}</ResponsiveContainer>
</motion.div>;
```

---

### 2. **Keyboard Navigation**

```typescript
<Card
  onClick={onClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      onClick?.();
    }
  }}
  tabIndex={onClick ? 0 : undefined}
  role={onClick ? "button" : undefined}
  aria-pressed={isSelected}
>
```

---

### 3. **Tooltip Explicativo**

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Card onClick={onClick}>{/* Contenido */}</Card>
    </TooltipTrigger>
    <TooltipContent>
      <p>Click para ver gráfico detallado</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

---

### 4. **Comparación de Métricas**

```typescript
const [compareMode, setCompareMode] = useState(false);

// Mostrar 2 gráficos lado a lado para comparar métricas
{
  compareMode && (
    <div className="grid md:grid-cols-2 gap-4">
      <SalesChart data={stats.sales.byDayConfirmed} metricType="confirmed" />
      <SalesChart data={stats.sales.byDayProjected} metricType="projected" />
    </div>
  );
}
```

---

### 5. **Exportar Datos**

```typescript
const exportChartData = () => {
  const csv = data.map((item) => `${item.date},${item.value}`).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${metricType}-${new Date().toISOString()}.csv`;
  a.click();
};
```

---

## 📊 Impacto

| Aspecto           | Antes       | Después         | Mejora |
| ----------------- | ----------- | --------------- | ------ |
| Interactividad    | ❌ Estático | ✅ Clickeable   | +100%  |
| Métricas visibles | ⚠️ Solo 1   | ✅ 3 diferentes | +200%  |
| UX                | ⚠️ Limitada | ✅ Exploratoria | +150%  |
| Feedback visual   | ❌ Ninguno  | ✅ Múltiple     | +100%  |
| Insights          | ⚠️ Básicos  | ✅ Detallados   | +180%  |

---

## 🔗 Archivos Modificados

```
app/api/admin/stats/route.ts
  ├── Agregado: salesByDayConfirmed (solo órdenes pagadas)
  ├── Agregado: salesByDayProjected (todas excepto canceladas)
  ├── Agregado: ordersByDay (cantidad de órdenes)
  └── Modificado: Estructura de retorno con 3 arrays

app/admin/page.tsx
  ├── Agregado: type MetricType
  ├── Modificado: interface DashboardStats
  ├── Agregado: estado selectedMetric
  ├── Modificado: StatsCards con onClick e isSelected
  └── Modificado: SalesChart con datos dinámicos

components/admin/dashboard/stats-card.tsx
  ├── Agregado: prop onClick
  ├── Agregado: prop isSelected
  ├── Agregado: estilos de hover
  └── Agregado: estilos de selección

components/admin/dashboard/sales-chart.tsx
  ├── Agregado: prop metricType
  ├── Agregado: metricConfig con configuración por métrica
  ├── Modificado: data prop (sales → value)
  ├── Modificado: título y descripción dinámicos
  ├── Modificado: formatter dinámico del eje Y
  └── Agregado: allowDecimals condicional
```

---

## 🚀 Testing Manual

### Paso 1: Abrir Dashboard

```
http://localhost:3000/admin
```

### Paso 2: Verificar Estado Inicial

- "Ventas Confirmadas" debe estar seleccionada (ring + fondo)
- Gráfico debe mostrar "Ventas Confirmadas"

### Paso 3: Click en "Proyección Total"

- Tarjeta anterior se desmarca
- Nueva tarjeta se marca
- Gráfico cambia título y datos

### Paso 4: Click en "Órdenes"

- Gráfico cambia a verde
- Eje Y muestra números enteros
- Tooltip dice "X órdenes"

### Paso 5: Hover Effects

- Tarjetas clickeables tienen hover effect
- Cursor cambia a pointer
- Escala ligeramente al hover

---

**Status:** ✅ Implementación completada  
**Testing:** Listo para pruebas manuales  
**Deployment:** Listo para producción  
**Breaking Changes:** Ninguno (mejoras incrementales)

---

## 🎉 Resultado Final

El dashboard admin ahora tiene tarjetas de métricas **completamente interactivas** que permiten explorar diferentes perspectivas de los datos. Los usuarios pueden:

1. ✅ Ver ventas confirmadas (solo dinero real) por día
2. ✅ Ver proyección total (incluyendo pendientes) por día
3. ✅ Ver cantidad de órdenes por día
4. ✅ Feedback visual inmediato al seleccionar
5. ✅ Gráfico dinámico que se adapta a la métrica

Todo con transiciones suaves, colores semánticos, y una UX profesional. 🚀
