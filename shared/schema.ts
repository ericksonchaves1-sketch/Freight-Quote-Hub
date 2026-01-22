import { pgTable, text, serial, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === Enums ===
export const userRoles = ["admin", "client", "carrier", "auditor"] as const;
export const quoteStatus = ["open", "responded", "negotiation", "closed"] as const;
export const bidStatus = ["pending", "accepted", "rejected"] as const;

// === TABLES ===

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tradeName: text("trade_name"),
  cnpj: text("cnpj").notNull().unique(),
  contactInfo: text("contact_info"),
  address: text("address"), // Legacy field
  type: text("type", { enum: ["client", "carrier"] }).notNull(),
  status: text("status").default("active").notNull(),
  email: text("email"),
  phone: text("phone"),
  cargoTypes: text("cargo_types"), // comma separated or JSON
  freightTypes: text("freight_types"), // Standardized field for carrier freight types
  regioesAtendidas: text("regioes_atendidas"), // Field for carrier served regions
  regions: text("regions"), // Legacy/other field
  createdAt: timestamp("created_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").default("Brasil").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // email
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: userRoles }).notNull(),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => users.id).notNull(),
  originAddressId: integer("origin_address_id").references(() => addresses.id),
  destinationAddressId: integer("destination_address_id").references(() => addresses.id),
  origin: text("origin").notNull(), 
  destination: text("destination").notNull(),
  weight: decimal("weight").notNull(),
  volume: decimal("volume"),
  cargoType: text("cargo_type").notNull(),
  deadline: timestamp("deadline"),
  notes: text("notes"),
  status: text("status", { enum: quoteStatus }).default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quotes.id).notNull(),
  carrierId: integer("carrier_id").references(() => users.id).notNull(),
  amount: decimal("amount").notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  conditions: text("conditions"),
  status: text("status", { enum: bidStatus }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  quotes: many(quotes),
  bids: many(bids),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  addresses: many(addresses),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  company: one(companies, {
    fields: [addresses.companyId],
    references: [companies.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(users, {
    fields: [quotes.clientId],
    references: [users.id],
  }),
  originAddress: one(addresses, {
    fields: [quotes.originAddressId],
    references: [addresses.id],
  }),
  destinationAddress: one(addresses, {
    fields: [quotes.destinationAddressId],
    references: [addresses.id],
  }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  quote: one(quotes, {
    fields: [bids.quoteId],
    references: [quotes.id],
  }),
  carrier: one(users, {
    fields: [bids.carrierId],
    references: [users.id],
  }),
}));

// === SCHEMAS ===

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertAddressSchema = createInsertSchema(addresses).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, clientId: true, status: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true, carrierId: true, status: true });

// === TYPES ===

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
