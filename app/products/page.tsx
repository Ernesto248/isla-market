"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { DataService } from "@/lib/data-service";
import { Product } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";

export default function ProductsPage() {
  const t = translations["es"]; // Solo español
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Aplicar debounce a la búsqueda (300ms de retraso)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Indicar si se está procesando la búsqueda
  const isSearching = searchQuery !== debouncedSearchQuery;

  // Leer parámetros de URL al cargar la página
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");
    const sortParam = searchParams.get("sort");

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (sortParam) {
      setSortBy(sortParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsData = await DataService.getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Función para actualizar la URL con los filtros actuales
  const updateURL = (newParams: {
    category?: string;
    search?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams(searchParams);

    if (newParams.category !== undefined) {
      if (newParams.category === "all") {
        params.delete("category");
      } else {
        params.set("category", newParams.category);
      }
    }

    if (newParams.search !== undefined) {
      if (newParams.search === "") {
        params.delete("search");
      } else {
        params.set("search", newParams.search);
      }
    }

    if (newParams.sort !== undefined) {
      if (newParams.sort === "name") {
        params.delete("sort");
      } else {
        params.set("sort", newParams.sort);
      }
    }

    const newURL = params.toString() ? `?${params.toString()}` : "/products";
    router.push(newURL, { scroll: false });
  };

  // Actualizar URL cuando cambie el valor debounced de la búsqueda
  useEffect(() => {
    if (searchQuery !== "" || searchParams.get("search")) {
      updateURL({ search: debouncedSearchQuery });
    }
  }, [debouncedSearchQuery, searchQuery, searchParams]);

  // Funciones para manejar cambios en los filtros
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateURL({ category });
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    // No actualizamos la URL inmediatamente, esperamos al debounce
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateURL({ sort });
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query (usando el valor con debounce)
    if (debouncedSearchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase()) ||
          (product.description &&
            product.description
              .toLowerCase()
              .includes(debouncedSearchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category_id === selectedCategory
      );
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [products, debouncedSearchQuery, selectedCategory, sortBy]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">{t.products}</h1>
          <p className="text-xl text-muted-foreground">
            {`Descubre ${products.length} productos para enviar a tus seres queridos en Cuba`}
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ProductFilters
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              isSearching={isSearching}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {`Mostrando ${filteredAndSortedProducts.length} productos`}
            </p>
          </div>

          {filteredAndSortedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-lg text-muted-foreground mb-4">
                No se encontraron productos que coincidan con tus criterios
              </p>
              <p className="text-sm text-muted-foreground">
                Intenta ajustar tus filtros o términos de búsqueda
              </p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
