import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertQuote, type InsertBid } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useQuotes() {
  return useQuery({
    queryKey: [api.quotes.list.path],
    queryFn: async () => {
      const res = await fetch(api.quotes.list.path);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return api.quotes.list.responses[200].parse(await res.json());
    },
  });
}

export function useQuote(id: number) {
  return useQuery({
    queryKey: [api.quotes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.quotes.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch quote details");
      return api.quotes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertQuote) => {
      const res = await fetch(api.quotes.create.path, {
        method: api.quotes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create quote");
      }
      return api.quotes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quotes.list.path] });
      toast({ title: "Success", description: "Quote request created successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });
}

export function useCreateBid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ quoteId, data }: { quoteId: number, data: InsertBid }) => {
      const url = buildUrl(api.bids.create.path, { quoteId });
      const res = await fetch(url, {
        method: api.bids.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) throw new Error("Failed to submit bid");
      return api.bids.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.quotes.get.path, variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: [api.quotes.list.path] });
      toast({ title: "Bid Submitted", description: "Your proposal has been sent to the client" });
    },
  });
}

export function useAcceptBid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ bidId, quoteId }: { bidId: number, quoteId: number }) => {
      const url = buildUrl(api.bids.accept.path, { id: bidId });
      const res = await fetch(url, { method: api.bids.accept.method });
      
      if (!res.ok) throw new Error("Failed to accept bid");
      return api.bids.accept.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.quotes.get.path, variables.quoteId] });
      queryClient.invalidateQueries({ queryKey: [api.quotes.list.path] });
      toast({ title: "Bid Accepted", description: "The quote is now in negotiation phase" });
    },
  });
}
