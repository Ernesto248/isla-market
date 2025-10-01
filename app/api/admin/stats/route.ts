import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin-auth";

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

    // Obtener parámetro de período (opcional)
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // días por defecto
    const daysAgo = parseInt(period);

    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // 1. Estadísticas generales de órdenes
    const { data: allOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, total_amount, created_at");

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      );
    }

    // 2. Órdenes del período seleccionado
    const ordersInPeriod = allOrders.filter(
      (order) => new Date(order.created_at) >= startDate
    );

    // 3. Calcular totales
    const totalSales = ordersInPeriod.reduce(
      (sum, order) => sum + parseFloat(order.total_amount.toString()),
      0
    );

    const totalOrders = ordersInPeriod.length;

    // 4. Órdenes por estado (solo pagadas y entregadas)
    const ordersByStatus = [
      {
        status: "paid",
        count: allOrders.filter((o) => o.status === "paid").length,
      },
      {
        status: "delivered",
        count: allOrders.filter((o) => o.status === "delivered").length,
      },
    ];

    // 5. Ventas por día (últimos N días)
    const salesByDay = Array.from({ length: daysAgo }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysAgo - 1 - i));
      const dateStr = date.toISOString().split("T")[0];

      const daySales = ordersInPeriod
        .filter((order) => order.created_at.split("T")[0] === dateStr)
        .reduce(
          (sum, order) => sum + parseFloat(order.total_amount.toString()),
          0
        );

      return {
        date: dateStr,
        sales: daySales,
        orders: ordersInPeriod.filter(
          (order) => order.created_at.split("T")[0] === dateStr
        ).length,
      };
    });

    // 6. Productos más vendidos
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(
        `
        product_id,
        quantity,
        total_price,
        products (
          id,
          name,
          price,
          images
        )
      `
      )
      .order("created_at", { ascending: false });

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    }

    // Agrupar por producto
    const productSales = new Map<
      string,
      { product: any; quantity: number; revenue: number }
    >();

    orderItems?.forEach((item: any) => {
      if (!item.products) return;

      const productId = item.product_id;
      const existing = productSales.get(productId);

      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += parseFloat(item.total_price.toString());
      } else {
        productSales.set(productId, {
          product: item.products,
          quantity: item.quantity,
          revenue: parseFloat(item.total_price.toString()),
        });
      }
    });

    // Convertir a array y ordenar por cantidad vendida
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // 7. Estadísticas de productos
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, stock_quantity, is_active");

    if (productsError) {
      console.error("Error fetching products:", productsError);
    }

    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter((p) => p.is_active).length || 0;
    const lowStockProducts =
      products?.filter((p) => (p.stock_quantity || 0) < 10).length || 0;

    // 8. Estadísticas de categorías
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, is_active");

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
    }

    const totalCategories = categories?.length || 0;

    // 9. Órdenes recientes (últimas 10)
    const { data: recentOrdersRaw, error: recentOrdersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        status,
        total_amount,
        created_at,
        users (
          email,
          full_name
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentOrdersError) {
      console.error("Error fetching recent orders:", recentOrdersError);
    }

    // Formatear órdenes recientes para el dashboard
    const recentOrders =
      recentOrdersRaw?.map((order: any) => ({
        id: order.id,
        customer_name:
          order.users?.full_name || order.users?.email || "Cliente desconocido",
        total: parseFloat(order.total_amount.toString()),
        status: order.status,
        created_at: order.created_at,
      })) || [];

    // 10. Calcular ticket promedio
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Retornar todas las estadísticas
    return NextResponse.json({
      period: {
        days: daysAgo,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      sales: {
        total: Math.round(totalSales * 100) / 100,
        average: Math.round(averageOrderValue * 100) / 100,
        byDay: salesByDay,
      },
      orders: {
        total: totalOrders,
        byStatus: ordersByStatus,
        recent: recentOrders,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        topSelling: topProducts,
      },
      categories: {
        total: totalCategories,
      },
    });
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
