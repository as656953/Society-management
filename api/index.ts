import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import session from 'express-session';
import createMemoryStore from 'memorystore';

// Track initialization
let app: express.Express | null = null;

async function getApp(): Promise<express.Express> {
  if (app) return app;

  // Dynamic imports for all server code
  const { registerRoutes } = await import('../server/routes.js');
  const { setupAuth } = await import('../server/auth.js');
  const { storage } = await import('../server/storage.js');
  const towersRouter = (await import('../server/routes/towers.js')).default;
  const apartmentsRouter = (await import('../server/routes/apartments.js')).default;
  const noticesRouter = (await import('../server/routes/notices.js')).default;

  app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Session middleware with memory store for serverless
  const MemoryStore = createMemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: '/',
      },
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      name: 'ssync.sid',
    })
  );

  // Setup authentication after session middleware
  setupAuth(app);

  // Request logging middleware
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json.bind(res);
    res.json = function (bodyJson: unknown) {
      capturedJsonResponse = bodyJson as Record<string, unknown>;
      return originalResJson(bodyJson);
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (path.startsWith('/api')) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + '…';
        }

        console.log(logLine);
      }
    });

    next();
  });

  app.use('/api/towers', towersRouter);
  app.use('/api/apartments', apartmentsRouter);
  app.use('/api/notices', noticesRouter);

  // Error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Express error:', err);
    const status = (err as any).status || (err as any).statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message, error: err.toString() });
  });

  // Register routes
  await registerRoutes(app);

  return app;
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const expressApp = await getApp();

    // Handle the request
    return new Promise<void>((resolve, reject) => {
      expressApp(req as any, res as any, (err: Error | null) => {
        if (err) {
          console.error('Handler error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Initialization error:', err);
    res.status(500).json({
      error: 'Server initialization failed',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
