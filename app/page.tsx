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
      {/* Hero Section - Diseño Premium */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Image con Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30 z-10" />
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            src="https://images.pexels.com/photos/6214383/pexels-photo-6214383.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Shopping Background"
            className="w-full h-full object-cover object-bottom"
          />
        </div>

        {/* Partículas Flotantes */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * -100 - 50],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Contenido */}
        <div className="container mx-auto px-4 py-20 relative z-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Título Principal con Gradiente Animado - Tamaño Reducido */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                <motion.span
                  className="inline-block bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{
                    backgroundSize: "200% auto",
                  }}
                >
                  Envía Amor
                </motion.span>
                <br />
                <motion.span
                  className="inline-block text-white"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Más Allá de las
                </motion.span>
                <br />
                <motion.span
                  className="inline-block bg-gradient-to-r from-amber-300 via-orange-400 to-pink-400 bg-clip-text text-transparent"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Fronteras
                </motion.span>
              </h1>

              {/* Subtítulo Elegante - Tamaño Reducido */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-lg sm:text-xl md:text-2xl text-gray-200 font-light max-w-2xl mx-auto leading-relaxed px-4"
              >
                Miles de productos seleccionados especialmente&nbsp;
                <br className="hidden sm:block" />
                <span className="text-cyan-300 font-medium">
                  para tus seres queridos en Cuba
                </span>
              </motion.p>
            </motion.div>

            {/* Botones CTA con Animaciones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-8 py-5 text-base shadow-2xl shadow-cyan-500/50 border-0 rounded-full font-aleo"
                  asChild
                >
                  <Link href="/products">
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="flex items-center"
                    >
                      Explorar Productos
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>

              {user ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-white bg-white/90 text-gray-900 hover:bg-white hover:text-black backdrop-blur-sm font-semibold px-8 py-5 text-base rounded-full shadow-xl font-aleo"
                    asChild
                  >
                    <Link href="/products">Ver Categorías</Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-white bg-white/90 text-gray-900 hover:bg-white hover:text-black backdrop-blur-sm font-semibold px-8 py-5 text-base rounded-full shadow-xl font-aleo"
                    onClick={() => setAuthModalOpen(true)}
                  >
                    Iniciar Sesión
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator - Posicionado al fondo del hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/70 text-sm flex flex-col items-center gap-2"
          >
            <span className="text-xs tracking-wider">Desliza para ver más</span>
            <ChevronRight className="h-6 w-6 transform rotate-90" />
          </motion.div>
        </motion.div>
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
