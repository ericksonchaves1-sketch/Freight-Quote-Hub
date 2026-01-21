import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, className }: StatsCardProps) {
  return (
    <Card className={cn("p-6 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="text-2xl font-bold font-display tracking-tight">{value}</h2>
        </div>
        <div className={cn("p-3 rounded-xl", "bg-primary/10 text-primary")}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs">
          <span className={cn(
            "font-medium px-1.5 py-0.5 rounded text-[10px] mr-2", 
            trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend}
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </Card>
  );
}
