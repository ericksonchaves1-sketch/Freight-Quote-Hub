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
} catch (err) {
  console.log("🧪 DB HOST: (invalid or missing DATABASE_URL)");
}

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

// ✅ Render fornece a porta automaticamente
const PORT = Number(process.env.PORT) || 3000;

// Register routes + start server
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
