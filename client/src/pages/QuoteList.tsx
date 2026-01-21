import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuotes, useCreateQuote } from "@/hooks/use-quotes";
import { Layout } from "@/components/Layout";
import { QuoteCard } from "@/components/QuoteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuoteSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

// Client-side schema extending the base schema for form handling
const createQuoteFormSchema = insertQuoteSchema.extend({
  weight: z.coerce.number().min(1, "Weight is required"),
  volume: z.coerce.number().optional(),
  deadline: z.coerce.date().optional(),
});

export default function QuoteList() {
  const { user } = useAuth();
  const { data: quotes, isLoading } = useQuotes();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const isClient = user?.role === "client";

  const filteredQuotes = quotes?.filter(q => 
    q.cargoType.toLowerCase().includes(search.toLowerCase()) ||
    q.origin.toLowerCase().includes(search.toLowerCase()) ||
    q.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Quotes</h1>
            <p className="text-muted-foreground">Manage and track your freight requests</p>
          </div>
          
          {isClient && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> New Quote
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Freight Quote</DialogTitle>
                </DialogHeader>
                <CreateQuoteForm onSuccess={() => setIsCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search origin, destination, or cargo type..." 
              className="pl-9 bg-muted/30 border-none focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))
          ) : filteredQuotes?.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No quotes found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms</p>
            </div>
          ) : (
            filteredQuotes?.map((quote) => (
              <QuoteCard 
                key={quote.id} 
                quote={quote} 
                isCarrier={user?.role === "carrier"} 
              />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

function CreateQuoteForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateQuote();
  
  const form = useForm<z.infer<typeof createQuoteFormSchema>>({
    resolver: zodResolver(createQuoteFormSchema),
    defaultValues: {
      origin: "",
      destination: "",
      cargoType: "",
      notes: "",
      weight: 0,
      volume: 0,
    }
  });

  const onSubmit = (data: z.infer<typeof createQuoteFormSchema>) => {
    // @ts-ignore - types mismatch slightly due to decimals/strings from form vs schema
    mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="origin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origin City/Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. New York, NY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination City/Address</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Los Angeles, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="cargoType"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>Cargo Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Perishable">Perishable</SelectItem>
                    <SelectItem value="Hazardous">Hazardous</SelectItem>
                    <SelectItem value="Fragile">Fragile</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="volume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volume (m³)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Delivery Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(new Date(e.target.value))} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Special handling instructions, gate codes, etc." 
                  className="min-h-[100px]"
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Quote Request
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
