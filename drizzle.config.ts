import "dotenv/config";
import { defineConfig } from "drizzle-kit";

console.log("DRIZZLE CONFIG DATABASE_URL =", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não encontrada. Verifique seu arquivo .env");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
