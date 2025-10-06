"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm", className)}
    >
      {/* Home icon */}
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Inicio"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />

            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px] sm:max-w-[200px]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[150px] sm:max-w-[200px]",
                  isLast
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
