import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import type { CreateProductWithVariantsData } from "@/lib/types";

export const dynamic = "force-dynamic";

// Crear cliente de Supabase con Service Role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * POST /api/admin/products/with-variants
 * Crea un producto completo con sus variantes en una sola operación
 *
 * Este endpoint es útil para crear productos con variantes de forma más eficiente
 * que hacer múltiples llamadas individuales.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const adminCheck = await requireAdmin(request);
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body: CreateProductWithVariantsData = await request.json();

    // Validaciones básicas
    if (!body.product || !body.product.name || !body.product.category_id) {
      return NextResponse.json(
        { error: "Product name and category_id are required" },
        { status: 400 }
      );
    }

    if (!body.variants || body.variants.length === 0) {
      return NextResponse.json(
        { error: "At least one variant is required" },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe
    const { data: category, error: categoryError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("id", body.product.category_id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Generar slug si no se proporciona
    let slug = body.product.slug;
    if (!slug) {
      slug = body.product.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
        .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres especiales con guiones
        .replace(/^-+|-+$/g, ""); // Eliminar guiones al inicio y final
    }

    // Verificar que el slug es único
    const { data: existingProduct } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: `Product with slug "${slug}" already exists` },
        { status: 400 }
      );
    }

    // Crear el producto con has_variants = true
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert({
        name: body.product.name,
        slug: slug,
        description: body.product.description || "",
        category_id: body.product.category_id,
        images: body.product.images || [],
        has_variants: true, // IMPORTANTE: el producto soporta variantes
        price: 0, // El precio se define en las variantes
        stock_quantity: 0, // El stock se define en las variantes
        is_active:
          body.product.is_active !== undefined ? body.product.is_active : true,
        featured: body.product.featured || false,
      })
      .select()
      .single();

    if (productError || !product) {
      console.error("Error creating product:", productError);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    // Validar que todos los atributos y valores existen
    const allAttributeValueIds = new Set<string>();
    body.variants.forEach((variant) => {
      variant.attribute_value_ids.forEach((id) => allAttributeValueIds.add(id));
    });

    const { data: attributeValues, error: attrError } = await supabaseAdmin
      .from("product_attribute_values")
      .select("id, attribute_id")
      .in("id", Array.from(allAttributeValueIds))
      .eq("is_active", true);

    if (
      attrError ||
      !attributeValues ||
      attributeValues.length !== allAttributeValueIds.size
    ) {
      // Rollback: eliminar el producto creado
      await supabaseAdmin.from("products").delete().eq("id", product.id);

      return NextResponse.json(
        { error: "One or more attribute values are invalid or inactive" },
        { status: 400 }
      );
    }

    // Crear las variantes
    const createdVariants: any[] = [];
    const errors: { variantIndex: number; error: string }[] = [];

    for (let index = 0; index < body.variants.length; index++) {
      const variantData = body.variants[index];
      try {
        // Verificar que no hay valores duplicados del mismo atributo
        const variantAttributeIds = variantData.attribute_value_ids.map(
          (valueId: string) => {
            const av = attributeValues.find((a) => a.id === valueId);
            return av?.attribute_id;
          }
        );

        const uniqueAttributeIds = new Set(variantAttributeIds);
        if (uniqueAttributeIds.size !== variantAttributeIds.length) {
          errors.push({
            variantIndex: index,
            error: "Cannot have multiple values from the same attribute",
          });
          continue;
        }

        // Verificar que no existe una variante con la misma combinación
        const variantCombination = [...variantData.attribute_value_ids]
          .sort()
          .join("-");
        const duplicateVariant = createdVariants.find(
          (v) =>
            [...v.attribute_value_ids].sort().join("-") === variantCombination
        );

        if (duplicateVariant) {
          errors.push({
            variantIndex: index,
            error: "Duplicate variant combination",
          });
          continue;
        }

        // Generar SKU si no se proporciona
        let sku = variantData.sku;
        if (!sku) {
          const attrValues = variantData.attribute_value_ids
            .map((id: string) => {
              const av = attributeValues.find((a) => a.id === id);
              return av ? av.id.slice(0, 4) : "";
            })
            .join("-");
          sku = `${slug}-${attrValues}`.toUpperCase();
        }

        // Crear la variante
        const { data: variant, error: variantError } = await supabaseAdmin
          .from("product_variants")
          .insert({
            product_id: product.id,
            sku: sku,
            price: variantData.price,
            stock_quantity: variantData.stock_quantity || 0,
            image_url: variantData.image_url || null,
            display_order: index,
            is_active: true,
          })
          .select()
          .single();

        if (variantError || !variant) {
          errors.push({
            variantIndex: index,
            error: `Failed to create variant: ${
              variantError?.message || "Unknown error"
            }`,
          });
          continue;
        }

        // Crear las relaciones con los atributos
        const variantAttributes = variantData.attribute_value_ids.map(
          (valueId: string) => ({
            variant_id: variant.id,
            attribute_value_id: valueId,
          })
        );

        const { error: relationError } = await supabaseAdmin
          .from("product_variant_attributes")
          .insert(variantAttributes);

        if (relationError) {
          // Eliminar la variante creada si falla
          await supabaseAdmin
            .from("product_variants")
            .delete()
            .eq("id", variant.id);

          errors.push({
            variantIndex: index,
            error: `Failed to create variant attributes: ${relationError.message}`,
          });
          continue;
        }

        createdVariants.push({
          ...variant,
          attribute_value_ids: variantData.attribute_value_ids,
        });
      } catch (variantError) {
        errors.push({
          variantIndex: index,
          error: `Unexpected error: ${
            variantError instanceof Error ? variantError.message : "Unknown"
          }`,
        });
      }
    }

    // Si no se creó ninguna variante, eliminar el producto
    if (createdVariants.length === 0) {
      await supabaseAdmin.from("products").delete().eq("id", product.id);

      return NextResponse.json(
        {
          error: "Failed to create any variants",
          details: errors,
        },
        { status: 500 }
      );
    }

    // Obtener el producto completo con sus variantes
    const { data: fullProduct } = await supabaseAdmin
      .from("products")
      .select(
        `
        *,
        categories (
          id,
          name,
          slug
        ),
        product_variants (
          *,
          product_variant_attributes (
            id,
            product_attribute_values (
              id,
              value,
              attribute_id,
              product_attributes (
                id,
                name,
                display_name
              )
            )
          )
        )
      `
      )
      .eq("id", product.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        product: fullProduct,
        stats: {
          total_variants_requested: body.variants.length,
          variants_created: createdVariants.length,
          variants_failed: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/products/with-variants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
