import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/config/env.js';
import { apiRateLimiter } from '@/middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import { requestId } from '@/middleware/requestId.js';
import { routes } from '@/routes.js';
import { logger } from '@/utils/logger.js';
import { buildOpenApiSpec } from '@/config/openapi.js';

export const app = express();

// Always trust exactly one proxy hop — required for Render/Railway/Heroku
// where X-Forwarded-For is injected by the platform's edge proxy.
app.set('trust proxy', 1);

app.use(requestId);

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  exposedHeaders: ['x-request-id'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Custom error handler for JSON parsing errors
const jsonErrorHandler: ErrorRequestHandler = (err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON: ' + err.message,
      hint: 'Ensure the request body is valid JSON and Content-Type header is set to application/json',
    });
  }
  next(err);
};
app.use(jsonErrorHandler);

if (env.NODE_ENV === 'production') {
  morgan.token('id', (req) => (req as express.Request).id ?? '-');
  app.use(morgan(':id :remote-addr :method :url :status :res[content-length] - :response-time ms', {
    stream: { write: (msg) => logger.info('http_request', { line: msg.trim() }) },
    skip: (req) => req.url === '/api/v1/health',
  }));
} else {
  app.use(morgan('dev'));
}

if (env.NODE_ENV !== 'test') app.use(apiRateLimiter);

app.use('/api/v1', routes);

if (env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.resolve('uploads')));
}

// ── API Docs (non-production only) ────────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  const spec = buildOpenApiSpec();
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'SCH_HUB API Docs',
    swaggerOptions: { persistAuthorization: true },
  }));
  app.get('/api/docs.json', (_req, res) => res.json(spec));
  logger.info('API docs available at /api/docs');
}

app.use(notFoundHandler);
app.use(errorHandler);
