import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import { type User } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Companies CRUD
  app.get(api.companies.list.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    const type = req.query.type as "client" | "carrier" | undefined;
    const items = await storage.getCompanies(type);
    res.json(items);
  });

  app.post(api.companies.create.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
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
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    const item = await storage.updateCompany(Number(req.params.id), req.body);
    res.json(item);
  });

  app.get(api.companies.get.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    const item = await storage.getCompany(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.companies.delete.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    await storage.updateCompany(Number(req.params.id), { status: "deleted" });
    res.sendStatus(204);
  });

  // Carriers CRUD
  app.get(api.carriers.list.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    const items = await storage.getCompanies("carrier");
    res.json(items);
  });

  app.post(api.carriers.create.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    try {
      const input = api.carriers.create.input.parse({ ...req.body, type: "carrier" });
      const item = await storage.createCompany(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch(api.carriers.update.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    const item = await storage.updateCompany(Number(req.params.id), req.body);
    res.json(item);
  });

  app.get(api.carriers.get.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    const item = await storage.getCompany(Number(req.params.id));
    if (!item || item.type !== 'carrier') return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.carriers.delete.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== 'admin') return res.sendStatus(401);
    await storage.updateCompany(Number(req.params.id), { status: "deleted" });
    res.sendStatus(204);
  });

  // Addresses CRUD
  app.get("/api/companies/:companyId/addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId) || companyId <= 0) return res.status(400).json({ message: "Invalid company ID" });
    const items = await storage.getAddresses(companyId);
    res.json(items);
  });

  app.post("/api/companies/:companyId/addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const companyId = Number(req.params.companyId);
    if (isNaN(companyId) || companyId <= 0) return res.status(400).json({ message: "Invalid company ID" });
    
    const { street, city, state, zipCode, number, neighborhood } = req.body;
    if (!street || !city || !state || !zipCode || !number || !neighborhood) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    try {
      const item = await storage.createAddress({
        ...req.body,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        country: req.body.country?.trim() || "BR",
        companyId: companyId,
        carrierId: null
      });
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating company address:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/carriers/:carrierId/addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const carrierId = Number(req.params.carrierId);
    if (isNaN(carrierId) || carrierId <= 0) return res.status(400).json({ message: "Invalid carrier ID" });
    const items = await storage.getCarrierAddresses(carrierId);
    res.json(items);
  });

  app.post("/api/carriers/:carrierId/addresses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const carrierId = Number(req.params.carrierId);
    if (isNaN(carrierId) || carrierId <= 0) return res.status(400).json({ message: "Invalid carrier ID" });

    const { street, city, state, zipCode, number, neighborhood } = req.body;
    if (!street || !city || !state || !zipCode || !number || !neighborhood) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    try {
      const item = await storage.createAddress({
        ...req.body,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        country: req.body.country?.trim() || "BR",
        carrierId: carrierId,
        companyId: null
      });
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating carrier address:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/addresses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const item = await storage.updateAddress(Number(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/addresses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.deleteAddress(Number(req.params.id));
    res.sendStatus(204);
  });

  // Existing routes
  app.get(api.quotes.list.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || !user) return res.sendStatus(401);
    const quotes = await storage.getQuotes();
    if (user.role === 'client') {
      return res.json(quotes.filter(q => q.clientId === user.id));
    } else if (user.role === 'carrier') {
      return res.json(quotes.filter(q => q.status !== 'closed'));
    }
    res.json(quotes);
  });

  app.post(api.quotes.create.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || !user) return res.sendStatus(401);
    try {
      const input = api.quotes.create.input.parse(req.body);
      const quote = await storage.createQuote(user.id, input);
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
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || !user || user.role !== 'carrier') return res.sendStatus(401);
    try {
      const input = api.bids.create.input.parse(req.body);
      const bid = await storage.createBid(user.id, Number(req.params.quoteId), input);
      res.status(201).json(bid);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post(api.bids.accept.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || !user || user.role !== 'client') return res.sendStatus(401);
    const bid = await storage.updateBidStatus(Number(req.params.id), 'accepted');
    res.json(bid);
  });

  return httpServer;
}
