"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { Category } from "@/lib/types";

export function Footer() {
  const t = translations["es"];
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Cargar categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          // Limitar a 6 categorías para mantener el diseño limpio
          setCategories(data.categories?.slice(0, 6) || []);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Isla Market
            </div>
            <p className="text-sm text-muted-foreground">
              Conectando familias a través de fronteras con amor y cuidado.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Enlaces Rápidos</h3>
            <div className="space-y-2 text-sm">
              <Link
                href="/"
                className="block hover:text-primary transition-colors"
              >
                {t.home}
              </Link>
              <Link
                href="/products"
                className="block hover:text-primary transition-colors"
              >
                {t.products}
              </Link>
              <Link
                href="/orders"
                className="block hover:text-primary transition-colors"
              >
                {t.myOrders}
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t.categories}</h3>
            <div className="space-y-2 text-sm">
              {loadingCategories ? (
                // Skeleton loading mientras cargan las categorías
                <>
                  <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-28"></div>
                </>
              ) : categories.length > 0 ? (
                // Renderizar categorías dinámicamente desde la DB
                categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                    className="block hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                // Fallback si no hay categorías
                <Link
                  href="/products"
                  className="block hover:text-primary transition-colors"
                >
                  Ver todos los productos
                </Link>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contáctanos</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>info@islamarketusa.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Miami, FL, USA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center space-x-1">
            <span>© 2024 Isla Market.</span>
            <span>Hecho con</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>para familias cubanas</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
