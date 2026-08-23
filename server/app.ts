import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import session from "express-session";
import type { Server } from "http";
import { registerRoutes } from "./routes.js";
import { setupAuth } from "./auth.js";
import towersRouter from "./routes/towers.js";
import apartmentsRouter from "./routes/apartments.js";
import noticesRouter from "./routes/notices.js";

export interface CreateAppOptions {
  /**
   * Where sessions live. Injected rather than imported so tests can pass a
   * memory store and the serverless entry can differ from the local one.
   */
  sessionStore: session.Store;
  /** Line logger. Defaults to console.log; the local server passes Vite's. */
  log?: (message: string) => void;
  /**
   * Mounted after all routes but before the error handler. This is where the
   * catch-all belongs: Vite's dev middleware locally, static files in
   * production. Ordering matters, so the factory owns it rather than leaving
   * each entry point to get it right.
   */
  afterRoutes?: (app: Express, server: Server) => void | Promise<void>;
}

/**
 * Builds the Express app.
 *
 * This exists because `server/index.ts` and `api/index.ts` were two separate
 * bootstraps that had drifted apart in five ways: session store, cookie
 * sameSite, error-handler position, error body shape, and static serving. Every
 * fix had to be applied twice or it landed on only one runtime, and neither was
 * importable by a test, because `server/index.ts` binds a port at module scope.
 */
export async function createApp(
  opts: CreateAppOptions
): Promise<{ app: Express; server: Server }> {
  const { sessionStore, afterRoutes } = opts;
  const log = opts.log ?? ((message: string) => console.log(message));

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret === "your-secret-key") {
    // Previously this silently fell back to the literal "your-secret-key",
    // which signs every session cookie with a value published in the source.
    throw new Error(
      "SESSION_SECRET must be set to a non-default value. Generate one with:\n" +
        `  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }

  const app = express();
  const isProduction = process.env.NODE_ENV === "production";

  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        // 'lax' rather than 'strict': the Google OAuth callback is a top-level
        // cross-site navigation back into the app, and 'strict' drops the
        // cookie on it. Both entry points now agree on this.
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: "/",
      },
      store: sessionStore,
      name: "ssync.sid",
    })
  );

  setupAuth(app);

  // Request logging. Deliberately does NOT log response bodies: it used to,
  // which meant /api/user and /api/users wrote scrypt password hashes into the
  // logs on every request.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    res.on("finish", () => {
      if (!path.startsWith("/api")) return;
      log(
        `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`
      );
    });
    next();
  });

  app.use("/api/towers", towersRouter);
  app.use("/api/apartments", apartmentsRouter);
  app.use("/api/notices", noticesRouter);

  const server = await registerRoutes(app);

  if (afterRoutes) await afterRoutes(app, server);

  // Must be last. api/index.ts previously registered this BEFORE calling
  // registerRoutes, so in production every route error bypassed it and fell
  // through to Express's default HTML handler, breaking the {message} contract
  // the client parses.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const e = err as { status?: number; statusCode?: number; message?: string };
    const status = e.status || e.statusCode || 500;
    console.error("Unhandled error:", err);
    // Only the message crosses the wire. api/index.ts used to attach
    // err.toString() unconditionally, leaking internals to any caller.
    res.status(status).json({ message: e.message || "Internal Server Error" });
    // Note: no `throw err` here. server/index.ts used to rethrow after
    // responding, producing an unhandled exception on every 500.
  });

  return { app, server };
}
