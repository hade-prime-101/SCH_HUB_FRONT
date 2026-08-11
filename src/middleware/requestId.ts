import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length <= 128 ? incoming : randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
}
