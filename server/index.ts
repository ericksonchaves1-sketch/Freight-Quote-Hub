import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

console.log("🔥 INDEX.TS CARREGOU");

// Middlewares básicos
app.use(express.json());

// ✅ Porta dinâmica (Render usa process.env.PORT). Local continua 5001.
const PORT = Number(process.env.PORT) || 5001;

// Register routes + start server
(async () => {
  try {
    console.log("✅ Registrando rotas...");
    await registerRoutes(app);
    console.log("✅ Rotas registradas");

    // ✅ Importante: no Render precisa escutar em 0.0.0.0 e na porta do env PORT
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
  }
})();
