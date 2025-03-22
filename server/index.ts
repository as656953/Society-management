import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupScheduledTasks } from "./tasks";
import towersRouter from "./routes/towers";
import apartmentsRouter from "./routes/apartments";
import session from "express-session";
import { storage } from "./storage";
import { setupAuth } from "./auth";

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

(async () => {
  const server = await registerRoutes(app);
  await setupScheduledTasks();

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

  // ALWAYS serve the app on port 3000
  // this serves both the API and the client
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    log(`Server running on port ${port}`);
  });
})();
