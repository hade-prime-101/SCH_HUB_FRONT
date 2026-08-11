import type { NextFunction, Request, Response } from 'express';
import { AppError, sendSuccess } from '@/utils/response.js';
import { campusMapService } from './campus-map.service.js';
import {
  listFeaturesQuerySchema,
  nearestQuerySchema,
  parseBbox,
  parseNear,
  routeProgressSchema,
  routeRequestSchema,
  searchQuerySchema,
} from './campus-map.validators.js';

function schoolIdFromRequest(req: Request) {
  const schoolId = req.user?.schoolId;
  if (!schoolId) throw new AppError('Authenticated school context is required', 401);
  return schoolId;
}

export const listFeatures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listFeaturesQuerySchema.parse(req.query);
    const features = await campusMapService.listFeatures(schoolIdFromRequest(req), {
      bbox: parseBbox(query.bbox),
      category: query.category,
      limit: query.limit,
    });
    return sendSuccess(res, features);
  } catch (error) { return next(error); }
};

export const getFeature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const feature = await campusMapService.getFeature(schoolIdFromRequest(req), req.params.id);
    return sendSuccess(res, feature);
  } catch (error) { return next(error); }
};

export const getFeatureEntrances = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entrances = await campusMapService.getEntrancesForFeature(schoolIdFromRequest(req), req.params.id);
    return sendSuccess(res, entrances);
  } catch (error) { return next(error); }
};

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = searchQuerySchema.parse(req.query);
    const near = parseNear(query.near);
    const results = await campusMapService.search(schoolIdFromRequest(req), {
      q: query.q,
      category: query.category,
      near: near ? { lat: near.lat, lng: near.lng } : undefined,
      limit: query.limit,
    });
    return sendSuccess(res, results);
  } catch (error) { return next(error); }
};

export const nearest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = nearestQuerySchema.parse(req.query);
    const results = await campusMapService.nearest(schoolIdFromRequest(req), {
      point: { lat: query.lat, lng: query.lng },
      category: query.category,
      limit: query.limit,
    });
    return sendSuccess(res, results);
  } catch (error) { return next(error); }
};

export const route = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = routeRequestSchema.parse(req.body);
    const result = await campusMapService.route(schoolIdFromRequest(req), input);
    return sendSuccess(res, result);
  } catch (error) { return next(error); }
};

export const progress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = routeProgressSchema.parse(req.body);
    const result = campusMapService.progress(input);
    return sendSuccess(res, result);
  } catch (error) { return next(error); }
};

export const categories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await campusMapService.categories(schoolIdFromRequest(req));
    return sendSuccess(res, results);
  } catch (error) { return next(error); }
};

export const tilesMetadata = (_req: Request, res: Response) => {
  return sendSuccess(res, campusMapService.tilesMetadata());
};
