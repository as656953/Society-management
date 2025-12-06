// Vercel Serverless Function Entry Point
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import app dynamically after build
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // The Express app is bundled into dist/index.js
  const { default: app } = await import('../dist/index.js');
  return app(req, res);
}
