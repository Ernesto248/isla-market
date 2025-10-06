"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { ProductFilters } from "@/components/products/product-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { DataService } from "@/lib/data-service";
import { Product, Category } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const t = translations["es"]; // Solo español
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          DataService.getProducts(),
          DataService.getCategories(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para actualizar la URL con los filtros actuales
  const updateURL = (newParams: {
    category?: string;
    search?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, searchQuery]);

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
    <div className="min-h-screen bg-background">
      {/* Header fijo con buscador */}
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          {/* Buscador */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 h-11 bg-muted/50"
            />
          </div>

          {/* Categorías con imágenes circulares scrolleables */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Categoría "Todos" */}
            <button
              onClick={() => handleCategoryChange("all")}
              className="flex flex-col items-center gap-2 flex-shrink-0 group"
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedCategory === "all"
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/20 hover:border-primary/50"
                )}
              >
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <span
                className={cn(
                  "text-xs text-center transition-colors",
                  selectedCategory === "all"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Todos
              </span>
            </button>

            {/* Categorías con imágenes */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0 group"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full border-2 overflow-hidden transition-all relative bg-muted",
                    selectedCategory === category.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-muted-foreground/20 hover:border-primary/50"
                  )}
                >
                  <Image
                    src={
                      category.image_url ||
                      category.image ||
                      "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=200"
                    }
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <span
                  className={cn(
                    "text-xs text-center max-w-[64px] line-clamp-2 transition-colors",
                    selectedCategory === category.id
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-4">
        {/* Barra de filtros y resultados */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedProducts.length} productos
          </p>

          {/* Botón de filtros/ordenamiento */}
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Ordenar
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto rounded-t-xl">
              <SheetHeader>
                <SheetTitle>Ordenar por</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => {
                    handleSortChange("name");
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors",
                    sortBy === "name"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  Nombre (A-Z)
                </button>
                <button
                  onClick={() => {
                    handleSortChange("price-low");
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors",
                    sortBy === "price-low"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  Precio: Menor a Mayor
                </button>
                <button
                  onClick={() => {
                    handleSortChange("price-high");
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors",
                    sortBy === "price-high"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  Precio: Mayor a Menor
                </button>
                <button
                  onClick={() => {
                    handleSortChange("newest");
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-lg transition-colors",
                    sortBy === "newest"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  Más Recientes
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Grid de productos - 2 columnas en móvil, más en desktop */}
        {filteredAndSortedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-lg text-muted-foreground mb-4">
              No se encontraron productos
            </p>
            <p className="text-sm text-muted-foreground">
              Intenta ajustar tus filtros o términos de búsqueda
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAndSortedProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
