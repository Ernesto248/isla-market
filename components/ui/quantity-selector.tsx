"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);

    if (isNaN(newValue)) {
      onChange(min);
      return;
    }

    if (newValue < min) {
      onChange(min);
    } else if (newValue > max) {
      onChange(max);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={handleDecrement}
        disabled={value <= min}
        aria-label="Disminuir cantidad"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        className="h-10 w-16 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Cantidad"
      />

      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10"
        onClick={handleIncrement}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
