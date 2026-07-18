import { Router } from 'express';
import { prisma } from '../database/prisma';
import { getStorage } from '../adapters/storage/storage';
import { getAIProvider } from '../adapters/ai';

export const healthRouter: Router = Router();

// Liveness: process is up. Cheap, never touches dependencies.
healthRouter.get('/live', (_req, res) => {
  res.json({ status: 'ok' });
});

// Readiness: can we actually serve traffic? Touches the database.
healthRouter.get('/ready', async (_req, res) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'down';
    healthy = false;
  }

  checks.storage = getStorage().kind;
  checks.aiProvider = getAIProvider().name;

  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});
