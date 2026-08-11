import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { sendSuccess } from '@/utils/response.js';

export const moduleStubRoutes = (moduleName: string) => {
  const router = Router();

  router.get('/', authenticate, (_req, res) => {
    sendSuccess(res, {
      module: moduleName,
      status: 'planned',
      message: `${moduleName} endpoints are scaffolded and ready for implementation.`
    });
  });

  return router;
};
