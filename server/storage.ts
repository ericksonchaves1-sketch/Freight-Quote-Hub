import { db } from "./db";
import { users, companies, quotes, bids, auditLogs, addresses, type User, type InsertUser, type Quote, type InsertQuote, type Bid, type InsertBid, type Company, type InsertCompany, type Address, type InsertAddress } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanies(type?: "client" | "carrier"): Promise<Company[]>;

  createAddress(address: InsertAddress): Promise<Address>;
  getAddresses(companyId: number): Promise<Address[]>;
  deleteAddress(id: number): Promise<void>;

  createQuote(userId: number, quote: InsertQuote): Promise<Quote>;
  getQuotes(): Promise<(Quote & { client: User, bids: Bid[] })[]>;
  getQuote(id: number): Promise<(Quote & { client: User, bids: (Bid & { carrier: User })[] }) | undefined>;
  
  createBid(carrierId: number, quoteId: number, bid: InsertBid): Promise<Bid>;
  getBidsForQuote(quoteId: number): Promise<Bid[]>;
  updateBidStatus(id: number, status: string): Promise<Bid>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values({ ...company, status: company.status || 'active' }).returning();
    await this.createAuditLog(null, "CREATE_COMPANY", `Created company ${newCompany.name} (ID: ${newCompany.id})`);
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updated] = await db.update(companies).set(company).where(eq(companies.id, id)).returning();
    await this.createAuditLog(null, "UPDATE_COMPANY", `Updated company ${updated.name} (ID: ${id})`);
    return updated;
  }

  async createAuditLog(userId: number | null, action: string, details: string): Promise<void> {
    await db.insert(auditLogs).values({ userId, action, details });
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanies(type?: "client" | "carrier"): Promise<Company[]> {
    if (type) {
      return db.select().from(companies).where(eq(companies.type, type));
    }
    return db.select().from(companies);
  }

  async createAddress(address: InsertAddress): Promise<Address> {
    const [newAddress] = await db.insert(addresses).values(address).returning();
    return newAddress;
  }

  async getAddresses(companyId: number): Promise<Address[]> {
    return db.select().from(addresses).where(eq(addresses.companyId, companyId));
  }

  async deleteAddress(id: number): Promise<void> {
    await db.delete(addresses).where(eq(addresses.id, id));
  }

  async createQuote(userId: number, quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(quotes).values({ ...quote, clientId: userId }).returning();
    return newQuote;
  }

  async getQuotes(): Promise<(Quote & { client: User, bids: Bid[] })[]> {
    const rows = await db.query.quotes.findMany({
      orderBy: [desc(quotes.createdAt)],
      with: {
        client: true,
        bids: true
      }
    });
    return rows;
  }

  async getQuote(id: number): Promise<(Quote & { client: User, bids: (Bid & { carrier: User })[] }) | undefined> {
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, id),
      with: {
        client: true,
        bids: {
          with: {
            carrier: true
          }
        }
      }
    });
    return quote;
  }

  async createBid(carrierId: number, quoteId: number, bid: InsertBid): Promise<Bid> {
    const [newBid] = await db.insert(bids).values({ ...bid, carrierId, quoteId }).returning();
    await db.update(quotes).set({ status: 'responded' }).where(eq(quotes.id, quoteId));
    return newBid;
  }

  async getBidsForQuote(quoteId: number): Promise<Bid[]> {
    return db.select().from(bids).where(eq(bids.quoteId, quoteId));
  }

  async updateBidStatus(id: number, status: string): Promise<Bid> {
    const [updated] = await db.update(bids).set({ status: status as any }).where(eq(bids.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
