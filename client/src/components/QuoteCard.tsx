import { Link } from "wouter";
import { type Quote, type Bid } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MapPin, Calendar, Scale, Box, DollarSign } from "lucide-react";

interface QuoteCardProps {
  quote: Quote & { client?: { name: string }, bids: Bid[] };
  isCarrier?: boolean;
}

export function QuoteCard({ quote, isCarrier }: QuoteCardProps) {
  const statusColors = {
    open: "bg-green-100 text-green-700 border-green-200",
    responded: "bg-blue-100 text-blue-700 border-blue-200",
    negotiation: "bg-amber-100 text-amber-700 border-amber-200",
    closed: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const bidCount = quote.bids?.length || 0;
  
  return (
    <Link href={`/quotes/${quote.id}`}>
      <div className="group cursor-pointer">
        <Card className="p-5 border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white/50 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">#{quote.id.toString().padStart(4, '0')}</span>
                <Badge variant="outline" className={statusColors[quote.status as keyof typeof statusColors]}>
                  {quote.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {quote.cargoType}
              </h3>
              {isCarrier && quote.client && (
                <p className="text-sm text-muted-foreground mt-0.5">By {quote.client.name}</p>
              )}
            </div>
            
            <div className="text-right">
              <span className="text-sm font-medium text-muted-foreground block">
                {bidCount} {bidCount === 1 ? 'Bid' : 'Bids'}
              </span>
              {quote.deadline && (
                <span className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(quote.deadline), "MMM d")}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 my-4 py-4 border-y border-border/50 border-dashed">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Origin</p>
              <div className="flex items-start gap-1.5 text-sm font-medium">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{quote.origin}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Destination</p>
              <div className="flex items-start gap-1.5 text-sm font-medium">
                <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{quote.destination}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              <Scale className="w-4 h-4" />
              <span>{Number(quote.weight)}kg</span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
              <Box className="w-4 h-4" />
              <span>{Number(quote.volume)}m³</span>
            </div>
          </div>
        </Card>
      </div>
    </Link>
  );
}
