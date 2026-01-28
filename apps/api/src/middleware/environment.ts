import { Request, Response, NextFunction } from 'express';
import { Environment } from '@prisma/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      environment: Environment;
    }
  }
}

export const environmentMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Default to PRODUCTION if called without context (though typical scans require auth)
  let env: Environment = 'PRODUCTION';

  // 2. Check Authorization header for "Bearer v_test_..." or "Bearer v_live_..."
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token.startsWith('v_test_')) {
      env = 'SANDBOX';
    } else if (token.startsWith('v_live_')) {
      env = 'PRODUCTION';
    }
  }

  // 3. Allow manual override via header (useful for dashboard actions simulating an env)
  const envHeader = req.headers['x-vulx-environment'];
  if (envHeader === 'SANDBOX') env = 'SANDBOX';
  if (envHeader === 'PRODUCTION') env = 'PRODUCTION';

  req.environment = env;
  next();
};
