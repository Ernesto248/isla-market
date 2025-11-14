# Fix: Variant Data Not Loading in Edit Mode

## Problem Description

When editing a product with variants, clicking "Gestionar Variantes" (Manage Variants) would show an empty form instead of pre-populating with existing variant data. Users had to re-enter all variant information from scratch.

## Root Cause

Two issues were identified:

### 1. VariantEditor Component - Missing Fields in Initial Data Mapping

**File**: `components/admin/variant-editor-simple.tsx`

The `useEffect` that loads `initialVariants` was not mapping the new simplified system fields (`variant_name`, `color`, `attributes_display`). It only mapped legacy fields.

**Before** (lines 89-111):

```tsx
useEffect(() => {
  if (initialVariants && initialVariants.length > 0) {
    const variantData: VariantData[] = initialVariants.map((variant) => ({
      id: variant.id,
      attribute_value_ids:
        variant.attribute_values?.map((a: ProductAttributeValue) => a.id) || [],
      sku: variant.sku || "",
      price: variant.price,
      stock_quantity: variant.stock_quantity,
      is_active: variant.is_active,
      _displayName: getVariantDisplayName(variant),
      _attributeValues: variant.attribute_values?.map(
        (a: ProductAttributeValue) => ({
          attributeName: a.attribute?.display_name || "",
          value: a.value,
        })
      ),
    }));

    setVariants(variantData);
  }
}, [initialVariants]);
```

**After**:

```tsx
useEffect(() => {
  if (initialVariants && initialVariants.length > 0) {
    const variantData: VariantData[] = initialVariants.map((variant) => {
      // Extraer los nuevos campos del sistema simplificado
      const variantAny = variant as any;
      const variantName = variantAny.variant_name || "";
      const color = variantAny.color || "";
      const attributesDisplay = variantAny.attributes_display || "";

      // Generar display name
      let displayName = "";
      if (variantName && color) {
        displayName = `${variantName} - ${color}`;
      } else if (variantName) {
        displayName = variantName;
      } else if (attributesDisplay) {
        displayName = attributesDisplay;
      } else {
        displayName = getVariantDisplayName(variant);
      }

      return {
        id: variant.id,
        attribute_value_ids:
          variant.attribute_values?.map((a: ProductAttributeValue) => a.id) ||
          [],
        sku: variant.sku || "",
        price: variant.price,
        stock_quantity: variant.stock_quantity,
        is_active: variant.is_active,
        // Incluir los nuevos campos del sistema simplificado
        variant_name: variantName,
        color: color,
        attributes_display: attributesDisplay,
        _displayName: displayName,
        _attributeValues: variant.attribute_values?.map(
          (a: ProductAttributeValue) => ({
            attributeName: a.attribute?.display_name || "",
            value: a.value,
          })
        ),
      };
    });

    setVariants(variantData);
  }
}, [initialVariants]);
```

### 2. API Endpoint - Missing Fields in SELECT Query

**File**: `app/api/admin/products/[id]/route.ts`

The GET endpoint was not including `variant_name` and `color` fields in the SELECT query for `product_variants`.

**Before** (lines 36-56):

```tsx
const { data: product, error } = await supabaseAdmin
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
      id,
      sku,
      price,
      stock_quantity,
      image_url,
      attributes_display,
      is_active,
      display_order
    )
  `
  )
  .eq("id", params.id)
  .single();
```

**After**:

```tsx
const { data: product, error } = await supabaseAdmin
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
      id,
      sku,
      price,
      stock_quantity,
      image_url,
      attributes_display,
      is_active,
      display_order,
      variant_name,
      color
    )
  `
  )
  .eq("id", params.id)
  .single();
```

## Changes Made

1. **Updated VariantEditor Component**:

   - Added extraction of `variant_name`, `color`, and `attributes_display` from initial variants
   - Implemented proper display name generation logic
   - Ensured all new fields are included in the mapped data

2. **Updated API Endpoint**:
   - Added `variant_name` and `color` to the SELECT query
   - Ensures backend returns all necessary fields for variant editing

## Testing Steps

1. Navigate to Admin → Products
2. Find a product that has variants
3. Click on the product to edit it
4. Click "Gestionar Variantes" button
5. **Expected Result**: Variant form should be pre-populated with:
   - Variant name (e.g., "11 Litros")
   - Color (if set)
   - SKU
   - Price
   - Stock
   - Active status
6. Make changes and save
7. Verify changes persist correctly

## Impact

- ✅ Fixes data loss issue when editing variants
- ✅ Improves user experience by pre-populating existing data
- ✅ Prevents need to re-enter variant information
- ✅ Maintains data consistency between database and UI

## Related Files

- `components/admin/variant-editor-simple.tsx` - Variant editor component
- `app/api/admin/products/[id]/route.ts` - Product GET endpoint
- `app/admin/products/[id]/edit/page.tsx` - Product edit page

## Notes

The simplified variant system uses three key fields:

- `variant_name`: Main variant identifier (e.g., "11 Litros", "1 Tonelada")
- `color`: Optional color specification
- `attributes_display`: Formatted display string for legacy compatibility

This fix ensures these fields are properly transmitted from the database → API → component → form.
