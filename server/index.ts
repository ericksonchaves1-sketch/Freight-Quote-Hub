import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();

console.log("🔥 API starting... BUILD=LOGIN_DEBUG_V1");

// ✅ parsers ANTES das rotas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ debug temporário só no login
app.use((req, _res, next) => {
  if (req.method === "POST" && req.path === "/api/login") {
    console.log("🧪 /api/login content-type:", req.headers["content-type"]);
    console.log("🧪 /api/login body:", req.body);
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
