import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";

// Cached across warm invocations of the same instance.
let appPromise: Promise<Express> | null = null;

async function buildApp(): Promise<Express> {
  // Imported dynamically so a cold start does not pay for the whole server
  // graph before the handler is even invoked.
  const { createApp } = await import("../server/app.js");
  const { serveStatic } = await import("../server/vite.js");

  const MemoryStore = createMemoryStore(session);

  const { app } = await createApp({
    // NOTE: an in-memory store does not survive between serverless instances,
    // so a user can be logged in on one invocation and logged out on the next.
    // Moving this to the Postgres session store is tracked in MEMORY.md; it is
    // the reason logins drop on the deployed app.
    sessionStore: new MemoryStore({ checkPeriod: 86400000 }),
    afterRoutes: (a) => {
      // vercel.json rewrites every non-API path here, so this entry has to be
      // able to serve the built client itself.
      serveStatic(a);
    },
  });

  return app;
}

function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = buildApp().catch((err) => {
      // Don't cache a failed build, or the instance is poisoned until it is
      // recycled.
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    await new Promise<void>((resolve, reject) => {
      app(req as never, res as never, (err?: unknown) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      });
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Serverless handler error:", err);
    if (res.headersSent) return;
    res.status(500).json({
      message: "Internal Server Error",
      // Detail only outside production; this used to leak err.toString()
      // unconditionally.
      ...(process.env.NODE_ENV === "production"
        ? {}
        : { error: err.message, stack: err.stack }),
    });
  }
}
