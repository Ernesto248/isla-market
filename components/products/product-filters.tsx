'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/translations';
import { mockCategories } from '@/lib/mock-data';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: ProductFiltersProps) {
  const { language } = useAppStore();
  const t = translations[language];
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    onSortChange('name');
  };

  const hasActiveFilters = searchQuery || selectedCategory || sortBy !== 'name';

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.searchProducts}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchProducts}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.filterByCategory}</label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder={t.filterByCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {mockCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {language === 'en' ? category.name : t[category.name.toLowerCase().replace(' & ', '') as keyof typeof t] || category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t.sortBy}</label>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t.sortByName}</SelectItem>
            <SelectItem value="price-low">{t.sortByPrice} (Low to High)</SelectItem>
            <SelectItem value="price-high">{t.sortByPrice} (High to Low)</SelectItem>
            <SelectItem value="newest">{t.sortByNewest}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchProducts}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Search: {searchQuery}</span>
                <button onClick={() => onSearchChange('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>
                  Category: {mockCategories.find(c => c.id === selectedCategory)?.name}
                </span>
                <button onClick={() => onCategoryChange('')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {sortBy !== 'name' && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Sort: {sortBy}</span>
                <button onClick={() => onSortChange('name')}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}