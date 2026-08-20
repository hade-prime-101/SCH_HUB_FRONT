import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import * as controller from './campus-map.controller.js';

export const campusMapRoutes = Router();

campusMapRoutes.use(authenticate);

// ── Campus Features (advanced routing) ──────────────────────
campusMapRoutes.get('/features', controller.listFeatures);
campusMapRoutes.get('/features/:id/entrances', controller.getFeatureEntrances);
campusMapRoutes.get('/features/:id', controller.getFeature);
campusMapRoutes.get('/tiles/metadata', controller.tilesMetadata);
campusMapRoutes.get('/search', controller.search);
campusMapRoutes.get('/nearest', controller.nearest);
campusMapRoutes.post('/route', controller.route);
campusMapRoutes.post('/route/progress', controller.progress);
campusMapRoutes.get('/categories', controller.categories);

// ── Map Config ─────────────────────────────────────────────
campusMapRoutes.get('/config', controller.mapConfig);

// ── Map Locations (simple POI management) ───────────────────
campusMapRoutes.get('/locations', controller.listMapLocations);
campusMapRoutes.get('/locations/:id', controller.getMapLocation);
campusMapRoutes.post('/locations', authorize('SUPER_ADMIN'), controller.createMapLocation);
campusMapRoutes.patch('/locations/:id', authorize('SUPER_ADMIN'), controller.updateMapLocation);
campusMapRoutes.patch('/locations/bulk', authorize('SUPER_ADMIN'), controller.bulkUpdateMapLocations);
campusMapRoutes.delete('/locations/:id', authorize('SUPER_ADMIN'), controller.deleteMapLocation);

// ── Simple Routing (direct ORS wrapper) ─────────────────────
campusMapRoutes.get('/simple-route', controller.simpleRoute);
