'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/products/product-card';
import { ProductFilters } from '@/components/products/product-filters';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { mockProducts } from '@/lib/mock-data';

export default function ProductsPage() {
  const { language } = useAppStore();
  const t = translations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = mockProducts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [searchQuery, selectedCategory, sortBy]);

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
            {language === 'en' 
              ? `Discover ${mockProducts.length} products to send to your loved ones in Cuba`
              : `Descubre ${mockProducts.length} productos para enviar a tus seres queridos en Cuba`
            }
          </p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ProductFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {language === 'en' 
                ? `Showing ${filteredAndSortedProducts.length} products`
                : `Mostrando ${filteredAndSortedProducts.length} productos`
              }
            </p>
          </div>

          {filteredAndSortedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-lg text-muted-foreground mb-4">
                {language === 'en' 
                  ? 'No products found matching your criteria'
                  : 'No se encontraron productos que coincidan con tus criterios'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Intenta ajustar tus filtros o términos de búsqueda'
                }
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