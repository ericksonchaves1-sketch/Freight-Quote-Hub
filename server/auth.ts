import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import jwt from "jsonwebtoken"; // ✅ JWT

const scryptAsync = promisify(scrypt);

// --------------------
// PASSWORD HELPERS
// --------------------

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// --------------------
// JWT HELPERS
// --------------------

function signToken(user: any) {
  const secret = process.env.JWT_SECRET || "dev_jwt_secret";
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    secret,
    { expiresIn: "7d" }
  );
}

// Middleware que aceita:
// ✅ sessão (passport)
// ✅ OU Bearer Token (JWT)
export function requireAuth(req: any, res: any, next: any) {
  // 1) Se estiver autenticado por sessão
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // 2) Se vier token no header
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");

  if (!token) return res.sendStatus(401);

  try {
    const secret = process.env.JWT_SECRET || "dev_jwt_secret";
    const payload = jwt.verify(token, secret) as any;
    req.user = payload;
    return next();
  } catch {
    return res.sendStatus(401);
  }
}

// --------------------
// AUTH SETUP
// --------------------

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        // compat com seed "password123"
        if (user.password === "password123" && password === "password123") {
          return done(null, user);
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // --------------------
  // REGISTER
  // --------------------
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("🧾 REGISTER body:", req.body);

      const username = String(req.body?.username ?? "").trim();
      const password = String(req.body?.password ?? "");

      if (!username) return res.status(400).send("username is required");
      if (!password) return res.status(400).send("password is required");

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(password);

      const displayName =
        String(
          req.body?.nome ??
            req.body?.name ??
            req.body?.fullName ??
            req.body?.displayName ??
            username
        ).trim() || username;

      const role =
        String(
          req.body?.role ??
            req.body?.papel ??
            req.body?.tipo ??
            req.body?.perfil ??
            "user"
        ).trim() || "user";

      const normalizedRole =
        role.toLowerCase() === "secretário" ||
        role.toLowerCase() === "secretario"
          ? "secretary"
          : role.toLowerCase();

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        nome: displayName,
        name: displayName,
        role: normalizedRole,
      } as any);

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      next(err);
    }
  });

  // --------------------
  // LOGIN (JWT + assinatura p/ confirmar backend certo)
  // --------------------
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("✅ LOGIN JWT NOVO ATIVO");

    const user = req.user as any;
    const token = signToken(user);

    // ✅ nunca devolver password no JSON
    const { password, ...safeUser } = user;

    // ✅ “assinatura” na resposta para confirmar que é este backend
    res.json({ ok: true, user: safeUser, token, using: "JWT_LOGIN_V2" });
  });

  // --------------------
  // LOGOUT
  // --------------------
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // --------------------
  // ME (session OU token)
  // --------------------
  app.get("/api/user", requireAuth, (req: any, res) => {
    res.json(req.user);
  });
}
