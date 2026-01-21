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

  // Companies CRUD
  app.get(api.companies.list.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);
    const type = req.query.type as "client" | "carrier" | undefined;
    const items = await storage.getCompanies(type);
    res.json(items);
  });

  app.post(api.companies.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);
    try {
      const input = api.companies.create.input.parse(req.body);
      const item = await storage.createCompany(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch(api.companies.update.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'admin') return res.sendStatus(401);
    const item = await storage.updateCompany(Number(req.params.id), req.body);
    res.json(item);
  });

  // Addresses CRUD
  app.get(api.addresses.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const items = await storage.getAddresses(Number(req.params.companyId));
    res.json(items);
  });

  app.post(api.addresses.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.createAddress(req.body);
    res.status(201).json(item);
  });

  app.delete(api.addresses.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteAddress(Number(req.params.id));
    res.sendStatus(204);
  });

  // Existing routes
  app.get(api.quotes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const quotes = await storage.getQuotes();
    if (req.user!.role === 'client') {
      return res.json(quotes.filter(q => q.clientId === req.user!.id));
    } else if (req.user!.role === 'carrier') {
      return res.json(quotes.filter(q => q.status !== 'closed'));
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
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
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
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post(api.bids.accept.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== 'client') return res.sendStatus(401);
    const bid = await storage.updateBidStatus(Number(req.params.id), 'accepted');
    res.json(bid);
  });

  return httpServer;
}
