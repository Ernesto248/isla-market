import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  onClick,
  isSelected = false,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
        isSelected && "ring-2 ring-primary shadow-lg scale-[1.02] bg-primary/5",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            isSelected ? "text-primary" : "text-muted-foreground"
          )}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {trend && (
              <span
                className={cn(
                  "font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
