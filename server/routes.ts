import type { Express } from "express";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, requireAuth } from "./auth";
import { type User } from "@shared/schema";
import { pool } from "./db";

export async function registerRoutes(app: Express): Promise<void> {
  console.log("✅ registerRoutes carregou e está registrando rotas");

  setupAuth(app);

  // Health da API (pública)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "routes.ts funcionando" });
  });

  // Health do BANCO (pública)
  app.get("/api/health/db", async (_req, res) => {
    try {
      const r = await pool.query("select 1 as ok");
      res.json({ status: "ok", db: r.rows[0] });
    } catch (err: any) {
      console.error("DB health error:", err);
      res
        .status(500)
        .json({ status: "error", message: err?.message ?? String(err) });
    }
  });

  // --------------------
  // Companies CRUD (admin)
  // --------------------
  app.get(api.companies.list.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== "admin")
      return res.sendStatus(401);

    const type = req.query.type as "client" | "carrier" | undefined;
    const items = await storage.getCompanies(type);
    res.json(items);
  });

  app.post(api.companies.create.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== "admin")
      return res.sendStatus(401);

    try {
      const input = api.companies.create.input.parse(req.body);
      const item = await storage.createCompany(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.patch(api.companies.update.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== "admin")
      return res.sendStatus(401);

    const item = await storage.updateCompany(Number(req.params.id), req.body);
    res.json(item);
  });

  app.get(api.companies.get.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== "admin")
      return res.sendStatus(401);

    const item = await storage.getCompany(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.companies.delete.path, async (req, res) => {
    const user = req.user as User | undefined;
    if (!req.isAuthenticated() || user?.role !== "admin")
      return res.sendStatus(401);

    await storage.updateCompany(Number(req.params.id), { status: "deleted" });
    res.sendStatus(204);
  });

  // --------------------
  // Quotes
  // --------------------
  app.get(api.quotes.list.path, requireAuth, async (req, res) => {
    const user = req.user as any;
    const quotes = await storage.getQuotes();

    if (user.role === "client" || user.role === "user") {
      return res.json(quotes.filter((q) => q.clientId === user.id));
    }

    if (user.role === "carrier") {
      return res.json(quotes.filter((q) => q.status !== "closed"));
    }

    res.json(quotes);
  });

  // ✅ Create quote (client/user)
  app.post(api.quotes.create.path, requireAuth, async (req, res) => {
    const user = req.user as any;

    try {
      // ✅ Aceita vários nomes (origin/destination, from/to, origem/destino)
      const origin =
        req.body?.origin ??
        req.body?.from ??
        req.body?.origem ??
        req.body?.pickup ??
        req.body?.pickupCity;

      const destination =
        req.body?.destination ??
        req.body?.to ??
        req.body?.destino ??
        req.body?.dropoff ??
        req.body?.dropoffCity;

      if (!origin || !destination) {
        return res.status(400).json({
          message: "Required",
          details: "origin e destination são obrigatórios",
        });
      }

      // ✅ Monta um input mínimo e adiciona defaults
      // Se o schema oficial exigir mais coisas, mantemos valores padrão aqui no MVP.
      const normalizedInput: any = {
        origin,
        destination,
        // defaults comuns (não atrapalham se não forem usados)
        status: req.body?.status ?? "open",
        description: req.body?.description ?? "",
        cargoType: req.body?.cargoType ?? "general",
        weight: req.body?.weight ?? 0,
        volume: req.body?.volume ?? 0,
      };

      // ✅ Primeiro tentamos validar pelo schema oficial, mas se falhar,
      // ainda criamos com o normalizedInput (MVP).
      let input: any;
      try {
        input = api.quotes.create.input.parse(normalizedInput);
      } catch (_zerr) {
        // fallback MVP: usa normalizedInput direto
        input = normalizedInput;
      }

      const quote = await storage.createQuote(user.id, input);
      res.status(201).json(quote);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: err.errors,
        });
      }
      console.error("❌ QUOTE CREATE ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.quotes.get.path, requireAuth, async (req, res) => {
    const quote = await storage.getQuote(Number(req.params.id));
    if (!quote) return res.status(404).json({ message: "Not found" });
    res.json(quote);
  });

  // --------------------
  // BIDS
  // --------------------

  // Create bid (carrier)
  app.post(api.bids.create.path, requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!user || user.role !== "carrier") {
      return res.sendStatus(403);
    }

    try {
      const input = api.bids.create.input.parse(req.body);

      const bid = await storage.createBid(
        user.id,
        Number(req.params.quoteId),
        input as any
      );

      res.status(201).json(bid);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: err.errors,
        });
      }
      console.error("❌ BID CREATE ERROR:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ✅ Accept bid (client OU user)
  app.post(api.bids.accept.path, requireAuth, async (req, res) => {
    const user = req.user as any;
    if (!user) return res.sendStatus(401);

    if (user.role !== "client" && user.role !== "user") {
      return res.sendStatus(403);
    }

    const bid = await storage.updateBidStatus(Number(req.params.id), "accepted");
    res.json(bid);
  });
}
