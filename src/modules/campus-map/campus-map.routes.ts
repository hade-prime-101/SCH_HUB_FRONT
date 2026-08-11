import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import * as controller from './campus-map.controller.js';

export const campusMapRoutes = Router();

campusMapRoutes.use(authenticate);

campusMapRoutes.get('/features', controller.listFeatures);
campusMapRoutes.get('/features/:id/entrances', controller.getFeatureEntrances);
campusMapRoutes.get('/features/:id', controller.getFeature);
campusMapRoutes.get('/tiles/metadata', controller.tilesMetadata);
campusMapRoutes.get('/search', controller.search);
campusMapRoutes.get('/nearest', controller.nearest);
campusMapRoutes.post('/route', controller.route);
campusMapRoutes.post('/route/progress', controller.progress);
campusMapRoutes.get('/categories', controller.categories);
