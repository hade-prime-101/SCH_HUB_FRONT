import type { NextFunction, Request, Response } from 'express';
import { marketplaceService } from './marketplace.service.js';
import { sendSuccess } from '@/utils/response.js';
import { AppError } from '@/utils/response.js';
import { r2 } from '@/config/r2.js';
import crypto from 'node:crypto';
import {
  createListingSchema, updateListingSchema, listListingsSchema,
  createShopSchema, updateShopSchema, rateSellerSchema,
  createLostFoundSchema, listLostFoundSchema,
  createAccommodationSchema, updateAccommodationSchema, listAccommodationSchema,
  createRoommateSchema, updateRoommateSchema,
  createServiceSchema, updateServiceSchema, listServicesSchema,
  createJobSchema, updateJobSchema, listJobsSchema, rejectJobSchema,
  applyAgentFieldsSchema, applyAgentSchema, reviewAgentSchema,
  reportContentSchema, moderateContentSchema,
} from './marketplace.validators.js';

const h = (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try { await fn(req, res); } catch (e) { next(e); }
  };

// ── Listings ──────────────────────────────────────────────────────────────

export const uploadListingImage = h(async (req, res) => {
  if (!req.file) throw new AppError('No image file provided', 400);
  const key = `marketplace/images/${req.user!.id}/${crypto.randomUUID()}-${req.file.originalname}`;
  const { url } = await r2.upload(req.file.buffer, key, req.file.mimetype);
  sendSuccess(res, { url }, 201);
});

export const listListings = h(async (req, res) => {
  const input = listListingsSchema.parse(req.query);
  sendSuccess(res, await marketplaceService.listListings(input, req.user!.schoolId));
});

export const getListing = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getListing(req.params.id, req.user!.id, req.user!.schoolId));
});

export const createListing = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.createListing(createListingSchema.parse(req.body), req.user!.id), 201);
});

export const updateListing = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.updateListing(req.params.id, updateListingSchema.parse(req.body), req.user!.id));
});

export const deleteListing = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.deleteListing(req.params.id, req.user!.id, req.user!.role));
});

export const toggleSaveListing = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.saveListing(req.params.id, req.user!.id));
});

export const getSavedListings = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getSavedListings(req.user!.id));
});

export const listPendingListings = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listPendingListings(req.user!.schoolId));
});

export const moderateListing = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.moderateListing(
    req.params.id, moderateContentSchema.parse(req.body),
    req.user!.id, req.user!.schoolId, req.ip,
  ));
});

// ── Shop ──────────────────────────────────────────────────────────────────

export const listShops = h(async (req, res) => {
  const page  = Math.max(1, Number(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  sendSuccess(res, await marketplaceService.listShops(req.user!.schoolId, page, limit));
});

export const getMyShop = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getMyShop(req.user!.id));
});

export const getShop = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getShop(req.params.id));
});

export const createShop = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.createShop(createShopSchema.parse(req.body), req.user!.id), 201);
});

export const updateShop = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.updateShop(updateShopSchema.parse(req.body), req.user!.id));
});

export const adminDeleteShop = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.deleteShop(req.params.id, req.user!.id, req.user!.role));
});

export const followShop = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.followShop(req.params.id, req.user!.id));
});

export const rateSeller = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.rateSeller(req.params.id, req.user!.id, rateSellerSchema.parse(req.body)), 201);
});

// ── Lost & Found ──────────────────────────────────────────────────────────

export const listLostFound = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listLostFound(listLostFoundSchema.parse(req.query), req.user!.schoolId));
});

export const createLostFound = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.createLostFound(createLostFoundSchema.parse(req.body), req.user!.id), 201);
});

export const resolveLostFound = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.markLostFoundResolved(req.params.id, req.user!.id));
});

// ── Accommodation ─────────────────────────────────────────────────────────

export const listAccommodation = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listAccommodation(listAccommodationSchema.parse(req.query), req.user!.schoolId));
});

export const getAccommodation = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getAccommodation(req.params.id, req.user!.schoolId, req.user!.id));
});

export const createAccommodation = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.createAccommodation(
    createAccommodationSchema.parse(req.body), req.user!.id, req.user!.role, req.user!.schoolId,
  ), 201);
});

export const updateAccommodation = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.updateAccommodation(
    req.params.id, updateAccommodationSchema.parse(req.body), req.user!.id, req.user!.role,
  ));
});

export const deleteAccommodation = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.deleteAccommodation(req.params.id, req.user!.id, req.user!.role));
});

export const moderateAccommodation = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.moderateAccommodation(
    req.params.id, moderateContentSchema.parse(req.body),
    req.user!.id, req.user!.schoolId, req.ip,
  ));
});

// ── Agent Verification ────────────────────────────────────────────────────

export const applyForAgent = h(async (req, res) => {
  if (!req.file) throw new AppError('Student ID image is required', 400);

  // Upload student ID image to storage
  const key = `agents/student-ids/${req.user!.id}/${crypto.randomUUID()}-${req.file.originalname}`;
  const { url: studentIdUrl } = await r2.upload(req.file.buffer, key, req.file.mimetype);

  // Parse and validate the text fields, then attach the uploaded URL
  const fields = applyAgentFieldsSchema.parse(req.body);
  const input  = applyAgentSchema.parse({ ...fields, studentIdUrl });

  sendSuccess(res, await marketplaceService.applyForAgent(input, req.user!.id), 201);
});

export const getMyAgentProfile = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getMyAgentProfile(req.user!.id));
});

export const listPendingAgents = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listPendingAgents(req.user!.schoolId));
});

export const reviewAgent = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.reviewAgent(
    req.params.userId, reviewAgentSchema.parse(req.body),
    req.user!.id, req.user!.schoolId, req.ip,
  ));
});

// ── Roommate ──────────────────────────────────────────────────────────────

export const listRoommates = h(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  sendSuccess(res, await marketplaceService.listRoommates(req.user!.schoolId, page, limit));
});

export const createRoommateRequest = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.createRoommateRequest(
    createRoommateSchema.parse(req.body), req.user!.id, req.user!.schoolId,
  ), 201);
});

export const updateRoommateRequest = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.updateRoommateRequest(
    req.params.id, updateRoommateSchema.parse(req.body), req.user!.id,
  ));
});

export const deleteRoommateRequest = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.deleteRoommateRequest(req.params.id, req.user!.id));
});

// ── Services ──────────────────────────────────────────────────────────────

export const listServices = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listServices(listServicesSchema.parse(req.query), req.user!.schoolId));
});

export const getService = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getService(req.params.id, req.user!.schoolId, req.user!.id));
});

export const createService = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.createService(
    createServiceSchema.parse(req.body), req.user!.id, req.user!.schoolId,
  ), 201);
});

export const updateService = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.updateService(
    req.params.id, updateServiceSchema.parse(req.body), req.user!.id,
  ));
});

export const deleteService = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.deleteService(req.params.id, req.user!.id, req.user!.role));
});

export const listPendingServices = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listPendingServices(req.user!.schoolId));
});

export const moderateService = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.moderateService(
    req.params.id, moderateContentSchema.parse(req.body),
    req.user!.id, req.user!.schoolId, req.ip,
  ));
});

// ── Jobs ──────────────────────────────────────────────────────────────────

export const listJobs = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listJobs(listJobsSchema.parse(req.query), req.user!.schoolId));
});

export const getJob = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.getJob(req.params.id, req.user!.schoolId, req.user!.id));
});

export const createJob = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.createJob(createJobSchema.parse(req.body), req.user!.id, req.user!.schoolId), 201);
});

export const updateJob = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.updateJob(req.params.id, updateJobSchema.parse(req.body), req.user!.id));
});

export const deleteJob = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.deleteJob(req.params.id, req.user!.id, req.user!.role));
});

export const listPendingJobs = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listPendingJobs(req.user!.schoolId));
});

export const approveJob = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.approveJob(req.params.id, req.user!.schoolId, req.user!.id, req.ip));
});

export const rejectJob = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.rejectJob(req.params.id, req.user!.schoolId, rejectJobSchema.parse(req.body), req.user!.id, req.ip));
});

// ── Reports ───────────────────────────────────────────────────────────────

export const reportContent = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.reportContent(reportContentSchema.parse(req.body), req.user!.id), 201);
});

export const listReports = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.listReports(req.user!.schoolId));
});

export const resolveReport = h(async (req, res) => {
  sendSuccess(res, await marketplaceService.resolveReport(req.params.id, req.user!.id, req.user!.schoolId, req.ip));
});
