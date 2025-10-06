"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
}

export function ImageCarousel({
  images,
  productName,
  className,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Si no hay imágenes, mostrar placeholder
  const displayImages =
    images && images.length > 0
      ? images
      : [
          "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800",
        ];

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? displayImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === displayImages.length - 1 ? 0 : prev + 1
    );
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={cn("space-y-4 group", className)}>
      {/* Imagen principal */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={displayImages[currentIndex]}
          alt={`${productName} - imagen ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          priority={currentIndex === 0}
        />

        {/* Botones de navegación - solo mostrar si hay más de una imagen */}
        {displayImages.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
              onClick={goToPrevious}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
              onClick={goToNext}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Indicador de posición */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
              <span className="text-xs text-white">
                {currentIndex + 1} / {displayImages.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails - solo mostrar si hay más de una imagen */}
      {displayImages.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border-2 transition-all hover:opacity-75",
                currentIndex === index
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-transparent opacity-60"
              )}
              aria-label={`Ver imagen ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
