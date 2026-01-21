import { storage } from "../server/storage";
import { db } from "../server/db";
import { users, companies, quotes, bids } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // Check if data exists
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded.");
    return;
  }

  // Create Companies
  const clientCo = await storage.createCompany({
    name: "Tech Solutions Ltd",
    cnpj: "12345678000100",
    address: "123 Innovation Dr, Tech City",
    type: "client",
    contactInfo: "contact@techsolutions.com"
  });

  const carrierCo1 = await storage.createCompany({
    name: "Fast Logistics Inc",
    cnpj: "98765432000199",
    address: "456 Transport Way, Logistics City",
    type: "carrier",
    contactInfo: "dispatch@fastlogistics.com"
  });

  const carrierCo2 = await storage.createCompany({
    name: "Global Freight",
    cnpj: "11223344000155",
    address: "789 Shipping Ln, Port City",
    type: "carrier",
    contactInfo: "info@globalfreight.com"
  });

  // Create Users (Passwords are hashed in real app, but for seed we rely on the specific password check in auth.ts or manual hash if needed.
  // My auth.ts has a hardcoded check for 'password123' to make seeding easier without hashing in the seed script)
  
  const clientUser = await storage.createUser({
    username: "client@tech.com",
    password: "password123", // Matches the hardcoded check in auth.ts
    role: "client",
    name: "Alice Client",
    companyId: clientCo.id
  });

  const carrierUser1 = await storage.createUser({
    username: "driver@fast.com",
    password: "password123",
    role: "carrier",
    name: "Bob Driver",
    companyId: carrierCo1.id
  });

  const carrierUser2 = await storage.createUser({
    username: "manager@global.com",
    password: "password123",
    role: "carrier",
    name: "Charlie Manager",
    companyId: carrierCo2.id
  });

  const adminUser = await storage.createUser({
    username: "admin@platform.com",
    password: "password123",
    role: "admin",
    name: "Admin User",
    companyId: null
  });

  // Create Quotes
  const quote1 = await storage.createQuote(clientUser.id, {
    origin: "São Paulo, SP",
    destination: "Rio de Janeiro, RJ",
    weight: "1500.50",
    volume: "10.5",
    cargoType: "Electronics",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    notes: "Fragile items, handle with care."
  });

  const quote2 = await storage.createQuote(clientUser.id, {
    origin: "Curitiba, PR",
    destination: "Porto Alegre, RS",
    weight: "5000.00",
    volume: "25.0",
    cargoType: "Furniture",
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    notes: "Requires large truck."
  });

  // Create Bids
  await storage.createBid(carrierUser1.id, quote1.id, {
    amount: "2500.00",
    estimatedDays: 2,
    conditions: "Insurance included."
  });

  await storage.createBid(carrierUser2.id, quote1.id, {
    amount: "2400.00",
    estimatedDays: 3,
    conditions: "Standard shipping."
  });

  console.log("Seeding complete!");
}

seed().catch(console.error);
