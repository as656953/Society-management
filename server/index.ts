import { createApp } from "./app.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupScheduledTasks } from "./tasks.js";
import { storage } from "./storage.js";
import { pool } from "./db.js";

// Last-resort safety net.
//
// Many route handlers are `async` with no try/catch, so a rejected promise
// inside one becomes an unhandled rejection. Node's default is to terminate,
// which means a single transient database error takes the whole server down and
// every other user's request with it. Logging and staying up is strictly
// better. Removing the need for this by wrapping the handlers is tracked in
// MEMORY.md.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

async function startServer() {
  const { app, server } = await createApp({
    sessionStore: storage.sessionStore,
    log,
    // The catch-all has to sit after the API routes and before the error
    // handler, so the factory mounts it for us at the right point.
    afterRoutes: async (a, s) => {
      if (a.get("env") === "development") {
        await setupVite(a, s);
      } else {
        serveStatic(a);
      }
    },
  });

  if (process.env.VERCEL !== "1") {
    await setupScheduledTasks();

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      log(`Server running on port ${port}`);
    });

    // Close the Postgres pool on shutdown so restarts do not abandon their
    // connections to the pooler.
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

  return app;
}

// Startup failures are fatal, unlike the runtime rejections handled above:
// a server that cannot build its app is not worth keeping alive, and staying
// up would mask a misconfiguration behind a stream of 500s.
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
