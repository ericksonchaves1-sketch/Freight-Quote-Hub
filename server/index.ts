import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

console.log("🔥 INDEX.TS CARREGOU");

// Middlewares básicos
app.use(express.json());

// ✅ Porta alterada para fugir do conflito da 5000
const PORT = 5001;

// Register routes + start server
(async () => {
  try {
    console.log("✅ Registrando rotas...");
    await registerRoutes(app);
    console.log("✅ Rotas registradas");

    app.listen(PORT, "127.0.0.1", () => {
      console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
  }
})();
