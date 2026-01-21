import { useRoute } from "wouter";
import { useQuote, useCreateBid, useAcceptBid } from "@/hooks/use-quotes";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, MapPin, Calendar, Scale, Box, DollarSign, Clock, Truck, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBidSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

// Schema for bid form
const bidFormSchema = insertBidSchema.extend({
  amount: z.coerce.number().min(1),
  estimatedDays: z.coerce.number().min(1),
});

export default function QuoteDetail() {
  const [, params] = useRoute("/quotes/:id");
  const id = parseInt(params?.id || "0");
  const { data: quote, isLoading } = useQuote(id);
  const { user } = useAuth();
  const { mutate: acceptBid, isPending: isAccepting } = useAcceptBid();
  const [isBidOpen, setIsBidOpen] = useState(false);

  const isClient = user?.role === "client";
  const isCarrier = user?.role === "carrier";
  const isOwner = quote?.clientId === user?.id;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!quote) {
    return (
      <Layout>
        <div className="text-center py-12">Quote not found</div>
      </Layout>
    );
  }

  const hasMyBid = isCarrier && quote.bids.some(b => b.carrierId === user?.id);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-border">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  #{quote.id.toString().padStart(4, '0')}
                </Badge>
                <Badge className={cn(
                  quote.status === 'open' ? 'bg-green-100 text-green-700' : 
                  quote.status === 'negotiation' ? 'bg-amber-100 text-amber-700' : 
                  'bg-slate-100 text-slate-700'
                )}>
                  {quote.status.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {quote.cargoType} Shipment
              </h1>
              
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide">Weight</p>
                    <p className="font-medium text-foreground">{Number(quote.weight)} kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide">Volume</p>
                    <p className="font-medium text-foreground">{Number(quote.volume)} m³</p>
                  </div>
                </div>
                {quote.deadline && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide">Deadline</p>
                      <p className="font-medium text-foreground">{format(new Date(quote.deadline), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isCarrier && quote.status === 'open' && !hasMyBid && (
              <Dialog open={isBidOpen} onOpenChange={setIsBidOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="shadow-lg shadow-primary/20">
                    <DollarSign className="mr-2 h-4 w-4" /> Submit Bid
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Proposal</DialogTitle>
                  </DialogHeader>
                  <SubmitBidForm quoteId={quote.id} onSuccess={() => setIsBidOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
            
            {hasMyBid && (
              <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Bid Submitted
              </div>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Visual connector line */}
            <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-border/60 -translate-x-1/2 border-dashed border-l" />
            
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span> Origin
              </p>
              <p className="text-lg font-medium">{quote.origin}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Destination
              </p>
              <p className="text-lg font-medium">{quote.destination}</p>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm font-medium mb-2">Additional Notes</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Bids Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            Proposals <Badge variant="secondary">{quote.bids.length}</Badge>
          </h2>
          
          {quote.bids.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No bids received yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {quote.bids.map((bid) => (
                <Card key={bid.id} className={cn(
                  "overflow-hidden transition-all",
                  bid.status === 'accepted' ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'
                )}>
                  <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-lg">{bid.carrier?.name || 'Unknown Carrier'}</span>
                        {bid.status === 'accepted' && (
                          <Badge className="bg-primary text-primary-foreground">Accepted</Badge>
                        )}
                        {bid.status === 'rejected' && (
                          <Badge variant="destructive">Rejected</Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {bid.estimatedDays} Days estimated
                        </span>
                        {bid.conditions && (
                          <span className="text-muted-foreground border-l pl-4 border-border">
                            {bid.conditions}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-6">
                      <div>
                        <p className="text-2xl font-bold font-display text-primary">
                          ${Number(bid.amount).toLocaleString()}
                        </p>
                      </div>

                      {isClient && isOwner && quote.status === 'open' && (
                        <Button 
                          onClick={() => acceptBid({ bidId: bid.id, quoteId: quote.id })}
                          disabled={isAccepting}
                          size="sm"
                        >
                          {isAccepting ? "Processing..." : "Accept Proposal"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SubmitBidForm({ quoteId, onSuccess }: { quoteId: number, onSuccess: () => void }) {
  const { mutate, isPending } = useCreateBid();
  
  const form = useForm<z.infer<typeof bidFormSchema>>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: 0,
      estimatedDays: 0,
      conditions: "",
      quoteId: quoteId, // Will be ignored by schema but needed for types
    }
  });

  const onSubmit = (data: z.infer<typeof bidFormSchema>) => {
    // @ts-ignore
    mutate({ quoteId, data }, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bid Amount ($)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="estimatedDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Days</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conditions / Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Payment terms, validity, exclusions..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Bid
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
