import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

console.log("🔥 API starting...");

// Middlewares
app.use(express.json());

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
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
  }
})();
