import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

console.log("🔥 API starting... BUILD=REQ_LOG_V1");

// 🧪 LOG DO HOST DO BANCO (sem expor senha)
try {
  const raw = process.env.DATABASE_URL || "";
  const url = new URL(raw);
  console.log("🧪 DB HOST:", url.hostname);
} catch {
  console.log("🧪 DB HOST: (invalid or missing DATABASE_URL)");
}

// Parsers ANTES das rotas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ LOG GLOBAL TEMPORÁRIO: mostra toda requisição que chega
app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  console.log("   content-type:", req.headers["content-type"]);
  if (req.method !== "GET") console.log("   body:", req.body);
  next();
});

const PORT = Number(process.env.PORT) || 3000;

process.on("unhandledRejection", (reason) => {
  console.error("⛔ unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("⛔ uncaughtException:", err);
});

(async () => {
  try {
    console.log("✅ Registrando rotas...");
    await registerRoutes(app);
    console.log("✅ Rotas registradas");

    // ✅ ERROR HANDLER GLOBAL: transforma 500 em JSON com detalhe
    app.use((err: any, _req: any, res: any, _next: any) => {
      console.error("⛔ express error:", err);
      res.status(500).json({
        ok: false,
        error: "internal_server_error",
        detail: String(err?.message || err),
      });
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("⛔ Erro ao iniciar servidor:", err);
    process.exit(1);
  }
})();
