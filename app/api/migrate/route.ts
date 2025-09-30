import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Datos mock adaptados para la base de datos
const mockCategories = [
  {
    name: "Electronics",
    description: "Smartphones, tablets, and electronic devices",
    slug: "electronics",
    image_url:
      "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=500",
  },
  {
    name: "Home & Garden",
    description: "Home appliances and garden tools",
    slug: "home-garden",
    image_url:
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=500",
  },
  {
    name: "Food & Beverages",
    description: "Non-perishable food items and beverages",
    slug: "food-beverages",
    image_url:
      "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=500",
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdmin();
    // Verificar que es una solicitud autorizada (en producción usar autenticación)
    const { password } = await request.json();
    if (password !== "migrate123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting migration...");

    // 1. Limpiar datos existentes (opcional)
    await supabaseAdmin
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("shipping_addresses")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("products")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // No limpiar categorías ya que ya existen

    // 2. Obtener categorías existentes
    const { data: existingCategories, error: categoriesError } =
      await supabaseAdmin.from("categories").select("*");

    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
      return NextResponse.json(
        { error: categoriesError.message },
        { status: 500 }
      );
    }

    console.log("Existing categories:", existingCategories?.length);

    // 3. Crear productos usando las categorías existentes
    const categoryMap: { [key: string]: string } = {};
    if (existingCategories) {
      existingCategories.forEach((cat) => {
        if (cat.slug === "electronicos") categoryMap["electronics"] = cat.id;
        if (cat.slug === "hogar") categoryMap["home-garden"] = cat.id;
        if (cat.slug === "comida") categoryMap["food-beverages"] = cat.id;
      });
    }

    const mockProducts = [
      {
        name: "Samsung Galaxy A54",
        description: "Latest Samsung smartphone with 128GB storage",
        price: 399.99,
        category_id: categoryMap["electronics"],
        images: [
          "https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 25,
        weight: 0.2,
        dimensions: "15x7x0.8 cm",
      },
      {
        name: "iPad Air",
        description: "Apple iPad Air with 64GB storage",
        price: 599.99,
        category_id: categoryMap["electronics"],
        images: [
          "https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 15,
        weight: 0.5,
        dimensions: "25x18x0.6 cm",
      },
      {
        name: "Rice Cooker",
        description: "Electric rice cooker 6-cup capacity",
        price: 89.99,
        category_id: categoryMap["home-garden"],
        images: [
          "https://images.pexels.com/photos/4226796/pexels-photo-4226796.jpeg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 30,
        weight: 2.5,
        dimensions: "30x25x20 cm",
      },
      {
        name: "Coffee Beans 2lb",
        description: "Premium Colombian coffee beans",
        price: 24.99,
        category_id: categoryMap["food-beverages"],
        images: [
          "https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 50,
        weight: 0.9,
        dimensions: "20x15x8 cm",
      },
      {
        name: "Bluetooth Headphones",
        description: "Wireless noise-canceling headphones",
        price: 149.99,
        category_id: categoryMap["electronics"],
        images: [
          "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 20,
        weight: 0.3,
        dimensions: "18x16x8 cm",
      },
      {
        name: "Blender",
        description: "High-speed blender for smoothies and soups",
        price: 129.99,
        category_id: categoryMap["home-garden"],
        images: [
          "https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 18,
        weight: 3.2,
        dimensions: "35x20x20 cm",
      },
      {
        name: "Olive Oil 1L",
        description: "Extra virgin olive oil from Spain",
        price: 19.99,
        category_id: categoryMap["food-beverages"],
        images: [
          "https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 40,
        weight: 1.0,
        dimensions: "25x8x8 cm",
      },
      {
        name: "Smart Watch",
        description: "Fitness tracking smartwatch with heart rate monitor",
        price: 199.99,
        category_id: categoryMap["electronics"],
        images: [
          "https://images.pexels.com/photos/393047/pexels-photo-393047.jpeg?auto=compress&cs=tinysrgb&w=500",
        ],
        stock_quantity: 12,
        weight: 0.1,
        dimensions: "4x4x1 cm",
      },
    ];

    // Filtrar productos que tienen category_id válido
    const validProducts = mockProducts.filter((product) => product.category_id);

    if (validProducts.length === 0) {
      return NextResponse.json(
        { error: "No valid categories found for products" },
        { status: 400 }
      );
    }

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .insert(validProducts)
      .select();

    if (productsError) {
      console.error("Error creating products:", productsError);
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
    }

    console.log("Migration completed successfully");
    return NextResponse.json({
      message: "Migration completed successfully",
      data: {
        categories: existingCategories?.length || 0,
        products: products?.length || 0,
      },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Migration endpoint. Use POST with password to run migration.",
    endpoints: {
      categories: "/api/categories",
      products: "/api/products",
      orders: "/api/orders",
    },
  });
}
