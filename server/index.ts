import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupScheduledTasks } from "./tasks.js";
import towersRouter from "./routes/towers.js";
import apartmentsRouter from "./routes/apartments.js";
import noticesRouter from "./routes/notices.js";
import session from "express-session";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { pool } from "./db.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key", // In production, use an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      path: "/",
    },
    store: storage.sessionStore,
    name: "ssync.sid", // Custom name to avoid conflicts
  })
);

// Setup authentication after session middleware
setupAuth(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.use("/api/towers", towersRouter);
app.use("/api/apartments", apartmentsRouter);
app.use("/api/notices", noticesRouter);

// Initialize and start server
async function startServer() {
  const server = await registerRoutes(app);

  // Only run scheduled tasks if not in serverless environment
  if (process.env.VERCEL !== "1") {
    await setupScheduledTasks();
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Only start server if not in Vercel environment
  if (process.env.VERCEL !== "1") {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      log(`Server running on port ${port}`);
    });

    // Close the Postgres pool on shutdown. Without this every restart leaks its
    // connections: they sit `idle` on the server until it times them out, and a
    // pooled provider will start refusing new ones long before that. Symptom is
    // "timeout exceeded when trying to connect" on requests that were fine
    // moments earlier.
    let shuttingDown = false;
    const shutdown = async (signal: string) => {
      if (shuttingDown) return;
      shuttingDown = true;
      log(`${signal} received, shutting down`);
      server.close();
      try {
        await pool.end();
      } catch (err) {
        console.error("Error closing the database pool:", err);
      }
      process.exit(0);
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  }
}

// Start server
startServer();

// Export for Vercel serverless
export default app;
