import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

console.log("🔥 API starting... BUILD=REQ_LOG_V1");

// Parsers ANTES das rotas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ LOG GLOBAL TEMPORÁRIO: mostra toda requisição que chega
app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  console.log("   content-type:", req.headers["content-type"]);
  if (req.method !== "GET") {
    console.log("   body:", req.body);
  }
  next();
});

const PORT = Number(process.env.PORT) || 3000;

(async () => {
  try {
    console.log("✅ Registrando rotas...");
    await registerRoutes(app);
    console.log("✅ Rotas registradas");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("⛔ Erro ao iniciar servidor:", err);
    process.exit(1);
  }
})();
