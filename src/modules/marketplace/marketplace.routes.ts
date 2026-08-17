import { Router } from 'express';
import { authenticate } from '@/middleware/authenticate.js';
import { authorize } from '@/middleware/authorize.js';
import { createImageUpload } from '@/middleware/upload.js';
import * as c from './marketplace.controller.js';

export const marketplaceRoutes = Router();
marketplaceRoutes.use(authenticate);

// ── Image upload ──────────────────────────────────────────────────────────
const [limitImgSize, uploadImage, handleImgErr] = createImageUpload({ fieldName: 'image', maxFileSizeBytes: 5 * 1024 * 1024 });
const [limitFileSize, uploadFile, handleFileErr] = createImageUpload({ fieldName: 'file', maxFileSizeBytes: 5 * 1024 * 1024 });

// ── Listings ──────────────────────────────────────────────────────────────
marketplaceRoutes.post('/images/upload', limitImgSize, uploadImage, handleImgErr, c.uploadListingImage);
marketplaceRoutes.post('/images/upload', limitFileSize, uploadFile, handleFileErr, c.uploadListingImage);
marketplaceRoutes.post('/listings/upload-image', limitImgSize, uploadImage, handleImgErr, c.uploadListingImage);
marketplaceRoutes.get('/listings', c.listListings);
marketplaceRoutes.get('/listings/saved', c.getSavedListings);
marketplaceRoutes.get('/listings/pending', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listPendingListings);
marketplaceRoutes.get('/listings/:id', c.getListing);
marketplaceRoutes.post('/listings', c.createListing);
marketplaceRoutes.patch('/listings/:id', c.updateListing);
marketplaceRoutes.delete('/listings/:id', c.deleteListing);
marketplaceRoutes.post('/listings/:id/save', c.toggleSaveListing);
marketplaceRoutes.patch('/listings/:id/moderate', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.moderateListing);

// ── Shop ──────────────────────────────────────────────────────────────────
// NOTE: /shops/me MUST be registered before /shops/:id so Express does not
// match the literal string "me" as an :id parameter.
marketplaceRoutes.get('/shops', c.listShops);
marketplaceRoutes.get('/shops/me', c.getMyShop);
marketplaceRoutes.get('/shops/:id', c.getShop);
marketplaceRoutes.post('/shops', c.createShop);
marketplaceRoutes.patch('/shops/me', c.updateShop);
marketplaceRoutes.delete('/shops/:id', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.adminDeleteShop);
marketplaceRoutes.post('/shops/:id/follow', c.followShop);
marketplaceRoutes.post('/sellers/:id/rate', c.rateSeller);

// ── Lost & Found ──────────────────────────────────────────────────────────
marketplaceRoutes.get('/lost-found', c.listLostFound);
marketplaceRoutes.post('/lost-found', c.createLostFound);
marketplaceRoutes.patch('/lost-found/:id/resolve', c.resolveLostFound);

// ── Accommodation ─────────────────────────────────────────────────────────
// Only HOUSE_AGENT / SCHOOL_ADMIN / SUPER_ADMIN can post
marketplaceRoutes.get('/accommodation', c.listAccommodation);
marketplaceRoutes.get('/accommodation/:id', c.getAccommodation);
marketplaceRoutes.post('/accommodation', authorize('HOUSE_AGENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), c.createAccommodation);
marketplaceRoutes.patch('/accommodation/:id', c.updateAccommodation);
marketplaceRoutes.delete('/accommodation/:id', c.deleteAccommodation);
marketplaceRoutes.patch('/accommodation/:id/moderate', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.moderateAccommodation);

// ── Agent Verification ────────────────────────────────────────────────────
// Any student can apply; admins review
const [limitAgentSize, uploadAgentId, handleAgentErr] = createImageUpload({ fieldName: 'studentId', maxFileSizeBytes: 5 * 1024 * 1024 });
marketplaceRoutes.post('/agents/apply', limitAgentSize, uploadAgentId, handleAgentErr, c.applyForAgent);
marketplaceRoutes.get('/agents/me', c.getMyAgentProfile);
marketplaceRoutes.get('/agents/pending', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listPendingAgents);
marketplaceRoutes.patch('/agents/:userId/review', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.reviewAgent);

// ── Roommate ──────────────────────────────────────────────────────────────
marketplaceRoutes.get('/roommates', c.listRoommates);
marketplaceRoutes.post('/roommates', c.createRoommateRequest);
marketplaceRoutes.patch('/roommates/:id', c.updateRoommateRequest);
marketplaceRoutes.delete('/roommates/:id', c.deleteRoommateRequest);

// ── Services ──────────────────────────────────────────────────────────────
marketplaceRoutes.get('/services', c.listServices);
marketplaceRoutes.get('/services/pending', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listPendingServices);
marketplaceRoutes.get('/services/:id', c.getService);
marketplaceRoutes.post('/services', c.createService);
marketplaceRoutes.patch('/services/:id', c.updateService);
marketplaceRoutes.delete('/services/:id', c.deleteService);
marketplaceRoutes.patch('/services/:id/moderate', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.moderateService);

// ── Jobs & Internships ────────────────────────────────────────────────────
marketplaceRoutes.get('/jobs', c.listJobs);
marketplaceRoutes.get('/jobs/pending', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listPendingJobs);
marketplaceRoutes.get('/jobs/:id', c.getJob);
marketplaceRoutes.post('/jobs', c.createJob);
marketplaceRoutes.patch('/jobs/:id', c.updateJob);
marketplaceRoutes.delete('/jobs/:id', c.deleteJob);
marketplaceRoutes.patch('/jobs/:id/approve', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.approveJob);
marketplaceRoutes.patch('/jobs/:id/reject', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.rejectJob);

// ── Reports ───────────────────────────────────────────────────────────────
marketplaceRoutes.post('/report', c.reportContent);
marketplaceRoutes.get('/reports', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.listReports);
marketplaceRoutes.patch('/reports/:id/resolve', authorize('SCHOOL_ADMIN', 'SUPER_ADMIN'), c.resolveReport);
