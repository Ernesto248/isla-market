"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Truck, Shield, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/products/product-card";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/translations";
import { DataService } from "@/lib/data-service";
import { Product, Category } from "@/lib/types";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user } = useAuth();
  const t = translations["es"]; // Solo español

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<
    "login" | "signup" | "forgot-password"
  >("login");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          DataService.getCategories(),
          DataService.getFeaturedProducts(),
        ]);
        setCategories(categoriesData);
        setFeaturedProducts(productsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950 dark:via-background dark:to-purple-950">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  🇨🇺 Conectando familias
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t.heroTitle}
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  {t.heroSubtitle}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  asChild
                >
                  <Link href="/products">
                    {t.shopNow}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                {user ? (
                  // Si el usuario está autenticado, mostrar botón de categorías
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/products">{t.categories}</Link>
                  </Button>
                ) : (
                  // Si no está autenticado, mostrar botón de iniciar sesión
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    {t.login}
                  </Button>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <img
                  src="https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Family connection"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-3xl transform scale-110" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold">{t.categories}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explora nuestras categorías de productos cuidadosamente
            seleccionadas
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href={`/products?category=${category.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-md">
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        category.image_url ||
                        category.image ||
                        "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=500"
                      }
                      alt={category.name}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm opacity-90">
                        {category.description}
                      </p>
                    </div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <ChevronRight className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold">
            {t.featuredProducts}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestros productos más populares elegidos por las familias
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" asChild>
            <Link href="/products">
              Ver Todos los Productos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-4 mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold">{t.whyChooseUs}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hacemos que sea fácil y seguro enviar amor a tu familia en Cuba
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: t.fastDelivery,
                description: t.fastDeliveryDesc,
              },
              {
                icon: Star,
                title: t.qualityProducts,
                description: t.qualityProductsDesc,
              },
              {
                icon: Shield,
                title: t.securePayment,
                description: t.securePaymentDesc,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center p-8 h-full border-0 shadow-md">
                  <CardContent className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
