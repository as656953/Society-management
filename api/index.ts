import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from '../server/routes';
import { serveStatic } from '../server/vite';
import session from 'express-session';
import { storage } from '../server/storage';
import { setupAuth } from '../server/auth';
import towersRouter from '../server/routes/towers';
import apartmentsRouter from '../server/routes/apartments';
import noticesRouter from '../server/routes/notices';

const app = express();

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
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
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
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

// Initialize routes
let routesInitialized = false;

async function initializeApp() {
  if (!routesInitialized) {
    await registerRoutes(app);
    serveStatic(app);
    routesInitialized = true;
  }
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initializeApp();

  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(undefined);
      }
    });
  });
}
