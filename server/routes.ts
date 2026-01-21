import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import { users } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get(api.quotes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const quotes = await storage.getQuotes();
    
    // Filter based on role
    if (req.user!.role === 'client') {
      return res.json(quotes.filter(q => q.clientId === req.user!.id));
    } else if (req.user!.role === 'carrier') {
      return res.json(quotes.filter(q => q.status !== 'closed')); // Carriers see open/responded quotes
    }
    
    res.json(quotes);
  });

  app.post(api.quotes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.quotes.create.input.parse(req.body);
      const quote = await storage.createQuote(req.user!.id, input);
      res.status(201).json(quote);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.quotes.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const quote = await storage.getQuote(Number(req.params.id));
    if (!quote) return res.status(404).json({ message: "Not found" });
    res.json(quote);
  });

  app.post(api.bids.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'carrier') return res.sendStatus(401);
    try {
      const input = api.bids.create.input.parse(req.body);
      const bid = await storage.createBid(req.user!.id, Number(req.params.quoteId), input);
      res.status(201).json(bid);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.bids.accept.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'client') return res.sendStatus(401);
    const bid = await storage.updateBidStatus(Number(req.params.id), 'accepted');
    res.json(bid);
  });

  // Helper to seed some data
  app.post("/api/seed", async (req, res) => {
    if (process.env.NODE_ENV === "production") return res.sendStatus(404);
    
    // Create initial companies
    const clientCo = await storage.createCompany({ 
      name: "Acme Corp", 
      cnpj: "12345678000199", 
      address: "123 Main St", 
      type: "client",
      contactInfo: "contact@acme.com"
    });
    
    const carrierCo = await storage.createCompany({ 
      name: "Fast Logistics", 
      cnpj: "98765432000100", 
      address: "456 Transport Rd", 
      type: "carrier",
      contactInfo: "dispatch@fastlogistics.com"
    });

    // Create users
    await storage.createUser({ 
      username: "client@acme.com", 
      password: "password123", 
      role: "client", 
      name: "John Client", 
      companyId: clientCo.id 
    });
    
    await storage.createUser({ 
      username: "carrier@fast.com", 
      password: "password123", 
      role: "carrier", 
      name: "Jane Carrier", 
      companyId: carrierCo.id 
    });
    
    res.json({ message: "Seeded" });
  });

  return httpServer;
}
