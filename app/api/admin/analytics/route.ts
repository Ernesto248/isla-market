import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";
import {
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);

    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    // Obtener parámetros de período
    const periodType = searchParams.get("period") || "30days";
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");

    // Calcular fechas según el período
    let startDate: Date;
    let endDate: Date = endOfDay(new Date());
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (periodType) {
      case "today":
        startDate = startOfDay(new Date());
        previousStartDate = startOfDay(subDays(new Date(), 1));
        previousEndDate = endOfDay(subDays(new Date(), 1));
        break;
      case "yesterday":
        startDate = startOfDay(subDays(new Date(), 1));
        endDate = endOfDay(subDays(new Date(), 1));
        previousStartDate = startOfDay(subDays(new Date(), 2));
        previousEndDate = endOfDay(subDays(new Date(), 2));
        break;
      case "7days":
        startDate = startOfDay(subDays(new Date(), 6));
        previousStartDate = startOfDay(subDays(new Date(), 13));
        previousEndDate = endOfDay(subDays(new Date(), 7));
        break;
      case "30days":
        startDate = startOfDay(subDays(new Date(), 29));
        previousStartDate = startOfDay(subDays(new Date(), 59));
        previousEndDate = endOfDay(subDays(new Date(), 30));
        break;
      case "3months":
        startDate = startOfDay(subMonths(new Date(), 3));
        previousStartDate = startOfDay(subMonths(new Date(), 6));
        previousEndDate = endOfDay(subMonths(new Date(), 3));
        break;
      case "year":
        startDate = startOfYear(new Date());
        previousStartDate = startOfYear(subYears(new Date(), 1));
        previousEndDate = endOfYear(subYears(new Date(), 1));
        break;
      case "custom":
        if (!customStartDate || !customEndDate) {
          return NextResponse.json(
            { error: "Custom period requires startDate and endDate" },
            { status: 400 }
          );
        }
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        const daysDiff = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        previousStartDate = subDays(startDate, daysDiff);
        previousEndDate = subDays(endDate, daysDiff);
        break;
      default:
        startDate = startOfDay(subDays(new Date(), 29));
        previousStartDate = startOfDay(subDays(new Date(), 59));
        previousEndDate = endOfDay(subDays(new Date(), 30));
    }

    // 1. Obtener todas las órdenes
    const { data: allOrders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        created_at,
        user_id,
        shipping_addresses (
          province
        )
      `
      )
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    // Filtrar órdenes del período actual
    const currentOrders = allOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Filtrar órdenes del período anterior (para comparación)
    const previousOrders = allOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousStartDate && orderDate <= previousEndDate;
    });

    // 2. Obtener items de órdenes
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        product_id,
        quantity,
        unit_price,
        total_price,
        order_id,
        created_at,
        products (
          id,
          name,
          images
        )
      `
      );

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    }

    // 3. Calcular Top Productos
    const productSales = new Map<
      string,
      {
        product: any;
        quantity: number;
        revenue: number;
        orders: number;
        orderIds: Set<string>;
      }
    >();

    const currentOrderIds = new Set(currentOrders.map((o) => o.id));

    orderItems
      ?.filter((item) => currentOrderIds.has(item.order_id))
      .forEach((item: any) => {
        if (!item.products) return;

        const productId = item.product_id;
        const existing = productSales.get(productId);

        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += parseFloat(item.total_price.toString());
          existing.orderIds.add(item.order_id);
          existing.orders = existing.orderIds.size;
        } else {
          productSales.set(productId, {
            product: item.products,
            quantity: item.quantity,
            revenue: parseFloat(item.total_price.toString()),
            orderIds: new Set([item.order_id]),
            orders: 1,
          });
        }
      });

    const topProducts = Array.from(productSales.values())
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        image: item.product.images?.[0] || null,
        quantitySold: item.quantity,
        revenue: item.revenue,
        orders: item.orders,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // 4. Análisis de Provincias
    const provinceStats = new Map<
      string,
      { orders: number; revenue: number }
    >();

    currentOrders.forEach((order: any) => {
      const province = order.shipping_addresses?.province || "Sin especificar";
      const revenue = parseFloat(order.total_amount.toString());

      const existing = provinceStats.get(province);
      if (existing) {
        existing.orders += 1;
        existing.revenue += revenue;
      } else {
        provinceStats.set(province, { orders: 1, revenue });
      }
    });

    const provinceData = Array.from(provinceStats.entries())
      .map(([province, data]) => ({
        province,
        orders: data.orders,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.orders - a.orders);

    // 5. Órdenes por Estado
    const ordersByStatus = {
      pendiente: currentOrders.filter((o) => o.status === "pendiente").length,
      pagado: currentOrders.filter((o) => o.status === "pagado").length,
      entregado: currentOrders.filter((o) => o.status === "entregado").length,
      cancelado: currentOrders.filter((o) => o.status === "cancelado").length,
    };

    // 5.5. Calcular ventas por día (para gráfico de líneas)
    const salesByDayMap = new Map<
      string,
      { paidRevenue: number; projectedRevenue: number }
    >();

    currentOrders.forEach((order) => {
      // Excluir órdenes canceladas de la proyección
      if (order.status === "cancelado") return;

      const dateKey = order.created_at.split("T")[0]; // YYYY-MM-DD
      const revenue = parseFloat(order.total_amount.toString());

      const existing = salesByDayMap.get(dateKey);
      if (existing) {
        existing.projectedRevenue += revenue;
        if (order.status === "pagado") {
          existing.paidRevenue += revenue;
        }
      } else {
        salesByDayMap.set(dateKey, {
          paidRevenue: order.status === "pagado" ? revenue : 0,
          projectedRevenue: revenue,
        });
      }
    });

    // Convertir a array y ordenar por fecha
    const salesByDay = Array.from(salesByDayMap.entries())
      .map(([date, data]) => ({
        date,
        paidRevenue: data.paidRevenue,
        projectedRevenue: data.projectedRevenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Métricas de Conversión
    // Total Revenue: solo órdenes con estado "pagado"
    const totalRevenue = currentOrders
      .filter((o) => o.status === "pagado")
      .reduce(
        (sum, order) => sum + parseFloat(order.total_amount.toString()),
        0
      );

    // Projected Revenue: todas las órdenes EXCEPTO canceladas
    const projectedRevenue = currentOrders
      .filter((o) => o.status !== "cancelado")
      .reduce(
        (sum, order) => sum + parseFloat(order.total_amount.toString()),
        0
      );

    const previousRevenue = previousOrders
      .filter((o) => o.status === "pagado")
      .reduce(
        (sum, order) => sum + parseFloat(order.total_amount.toString()),
        0
      );

    const avgOrderValue =
      currentOrders.length > 0 ? totalRevenue / currentOrders.length : 0;

    const previousAvgOrderValue =
      previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;

    // Clientes únicos
    const uniqueCustomers = new Set(
      currentOrders.map((o) => o.user_id).filter(Boolean)
    );
    const previousUniqueCustomers = new Set(
      previousOrders.map((o) => o.user_id).filter(Boolean)
    );

    // Obtener todos los clientes para identificar nuevos vs recurrentes
    const { data: allOrdersForCustomerAnalysis } = await supabase
      .from("orders")
      .select("user_id, created_at")
      .order("created_at", { ascending: true });

    // Identificar clientes nuevos (primera orden en el período actual)
    const firstOrders = new Map<string, Date>();
    allOrdersForCustomerAnalysis?.forEach((order) => {
      if (!order.user_id) return;
      const orderDate = new Date(order.created_at);
      if (!firstOrders.has(order.user_id)) {
        firstOrders.set(order.user_id, orderDate);
      }
    });

    let newCustomers = 0;
    let returningCustomers = 0;

    uniqueCustomers.forEach((userId) => {
      if (!userId) return;
      const firstOrderDate = firstOrders.get(userId);
      if (firstOrderDate && firstOrderDate >= startDate) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    });

    // CLV básico (promedio de valor de todas las órdenes de un cliente)
    const customerOrders = new Map<string, number[]>();
    allOrders.forEach((order) => {
      if (!order.user_id) return;
      const revenue = parseFloat(order.total_amount.toString());
      if (!customerOrders.has(order.user_id)) {
        customerOrders.set(order.user_id, []);
      }
      customerOrders.get(order.user_id)!.push(revenue);
    });

    let totalCLV = 0;
    let customersWithMultipleOrders = 0;
    customerOrders.forEach((orders) => {
      if (orders.length > 0) {
        const clv = orders.reduce((sum, val) => sum + val, 0);
        totalCLV += clv;
        if (orders.length > 1) {
          customersWithMultipleOrders++;
        }
      }
    });

    const avgCLV = customerOrders.size > 0 ? totalCLV / customerOrders.size : 0;

    // Órdenes por cliente promedio
    const avgOrdersPerCustomer =
      uniqueCustomers.size > 0
        ? currentOrders.filter((o) => o.user_id).length / uniqueCustomers.size
        : 0;

    // 7. Acciones Requeridas
    const now = new Date();
    const twoDaysAgo = subDays(now, 2);

    const ordersPending48h = allOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return (
        order.status === "pendiente" &&
        orderDate < twoDaysAgo &&
        orderDate >= subDays(now, 30)
      );
    }).length;

    // Productos con bajo stock
    const { data: lowStockProducts } = await supabase
      .from("products")
      .select("id, name")
      .lte("stock_quantity", 10)
      .eq("is_active", true);

    // Órdenes "atrasadas" (pagado pero no entregado después de 3 días)
    const threeDaysAgo = subDays(now, 3);
    const delayedOrders = allOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return (
        order.status === "pagado" &&
        orderDate < threeDaysAgo &&
        orderDate >= subDays(now, 30)
      );
    }).length;

    // 8. Calcular cambios porcentuales
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Respuesta final
    return NextResponse.json({
      period: {
        type: periodType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        previousStartDate: previousStartDate.toISOString(),
        previousEndDate: previousEndDate.toISOString(),
      },
      summary: {
        totalRevenue,
        projectedRevenue,
        totalOrders: currentOrders.length,
        avgOrderValue,
        uniqueCustomers: uniqueCustomers.size,
        changes: {
          revenue: calculateChange(totalRevenue, previousRevenue),
          orders: calculateChange(currentOrders.length, previousOrders.length),
          avgOrderValue: calculateChange(avgOrderValue, previousAvgOrderValue),
          customers: calculateChange(
            uniqueCustomers.size,
            previousUniqueCustomers.size
          ),
        },
      },
      topProducts,
      provinces: provinceData,
      ordersByStatus,
      salesByDay,
      conversion: {
        newCustomers,
        returningCustomers,
        avgCLV: Math.round(avgCLV * 100) / 100,
        avgOrdersPerCustomer: Math.round(avgOrdersPerCustomer * 100) / 100,
        repeatCustomerRate:
          uniqueCustomers.size > 0
            ? Math.round(
                (returningCustomers / uniqueCustomers.size) * 100 * 100
              ) / 100
            : 0,
      },
      actionRequired: {
        ordersPending48h,
        lowStockProducts: lowStockProducts?.length || 0,
        delayedOrders,
      },
    });
  } catch (error) {
    console.error("Error getting analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
