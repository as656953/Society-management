import type { IncomingMessage, ServerResponse } from 'http';

// Track initialization
let app: any = null;

async function getApp() {
  if (app) return app;

  // Lazy import everything inside this function
  const express = (await import('express')).default;
  const session = (await import('express-session')).default;
  const { registerRoutes } = await import('../routes');
  const { serveStatic } = await import('../vite');
  const { storage } = await import('../storage');
  const { setupAuth } = await import('../auth');
  const towersRouter = (await import('../routes/towers')).default;
  const apartmentsRouter = (await import('../routes/apartments')).default;
  const noticesRouter = (await import('../routes/notices')).default;

  app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Session middleware setup
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
      store: storage.sessionStore,
      name: 'ssync.sid',
    })
  );

  // Setup authentication after session middleware
  setupAuth(app);

  // Request logging middleware
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson: any) {
      capturedJsonResponse = bodyJson;
      return originalResJson.call(res, bodyJson);
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
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Express error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message, error: err.toString() });
  });

  // Register routes
  await registerRoutes(app);
  serveStatic(app);

  return app;
}

// Vercel serverless handler
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const expressApp = await getApp();

    // Handle the request
    return new Promise<void>((resolve, reject) => {
      expressApp(req as any, res as any, (err: any) => {
        if (err) {
          console.error('Handler error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error: any) {
    console.error('Initialization error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }));
  }
}
