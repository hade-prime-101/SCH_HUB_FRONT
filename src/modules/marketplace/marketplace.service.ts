import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/response.js';
import { auditService } from '@/modules/super-admin/audit.service.js';
import type { z } from 'zod';
import type {
  createListingSchema, updateListingSchema, listListingsSchema,
  createShopSchema, updateShopSchema, rateSellerSchema,
  createLostFoundSchema, listLostFoundSchema,
  createAccommodationSchema, updateAccommodationSchema, listAccommodationSchema,
  createRoommateSchema, updateRoommateSchema,
  createServiceSchema, updateServiceSchema, listServicesSchema,
  createJobSchema, updateJobSchema, listJobsSchema, rejectJobSchema,
  applyAgentSchema, reviewAgentSchema, reportContentSchema, moderateContentSchema,
} from './marketplace.validators.js';

type CreateListingInput   = z.infer<typeof createListingSchema>;
type UpdateListingInput   = z.infer<typeof updateListingSchema>;
type ListListingsInput    = z.infer<typeof listListingsSchema>;
type CreateShopInput      = z.infer<typeof createShopSchema>;
type UpdateShopInput      = z.infer<typeof updateShopSchema>;
type RateSellerInput      = z.infer<typeof rateSellerSchema>;
type CreateLostFoundInput = z.infer<typeof createLostFoundSchema>;
type ListLostFoundInput   = z.infer<typeof listLostFoundSchema>;
type CreateAccomInput     = z.infer<typeof createAccommodationSchema>;
type UpdateAccomInput     = z.infer<typeof updateAccommodationSchema>;
type ListAccomInput       = z.infer<typeof listAccommodationSchema>;
type CreateRoommateInput  = z.infer<typeof createRoommateSchema>;
type UpdateRoommateInput  = z.infer<typeof updateRoommateSchema>;
type CreateServiceInput   = z.infer<typeof createServiceSchema>;
type UpdateServiceInput   = z.infer<typeof updateServiceSchema>;
type ListServicesInput    = z.infer<typeof listServicesSchema>;
type CreateJobInput       = z.infer<typeof createJobSchema>;
type UpdateJobInput       = z.infer<typeof updateJobSchema>;
type ListJobsInput        = z.infer<typeof listJobsSchema>;
type RejectJobInput       = z.infer<typeof rejectJobSchema>;
type ApplyAgentInput      = z.infer<typeof applyAgentSchema>;
type ReviewAgentInput     = z.infer<typeof reviewAgentSchema>;
type ReportContentInput   = z.infer<typeof reportContentSchema>;
type ModerateContentInput = z.infer<typeof moderateContentSchema>;

// ── Constants ─────────────────────────────────────────────────────────────
const ADMIN_ROLES        = new Set(['SCHOOL_ADMIN', 'SUPER_ADMIN']);
const AGENT_ROLES        = new Set(['HOUSE_AGENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN']);
const DAILY_POST_LIMIT   = 10;   // max new posts per user per day (spam guard)
const AUTO_FLAG_THRESHOLD = 3;   // auto-flag listing after N reports

// ── Helpers ───────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

async function checkDailyPostLimit(userId: string, model: 'listing' | 'accommodation' | 'service') {
  const today = startOfToday();
  let count = 0;
  if (model === 'listing') {
    count = await prisma.listing.count({ where: { sellerId: userId, createdAt: { gte: today } } });
  } else if (model === 'accommodation') {
    count = await prisma.accommodationPost.count({ where: { postedById: userId, createdAt: { gte: today } } });
  } else {
    count = await prisma.serviceListing.count({ where: { providerId: userId, createdAt: { gte: today } } });
  }
  if (count >= DAILY_POST_LIMIT) {
    throw new AppError(`Daily posting limit reached (${DAILY_POST_LIMIT}/day). Try again tomorrow.`, 429);
  }
}

const LISTING_SELECT = {
  id: true, title: true, description: true, price: true,
  category: true, condition: true, images: true, location: true,
  whatsapp: true, isAvailable: true, viewCount: true,
  approvalStatus: true, isFlagged: true, createdAt: true,
  seller: { select: { id: true, fullName: true, profilePictureUrl: true } },
  shop: { select: { id: true, name: true, logoUrl: true } },
} as const;

export const marketplaceService = {

  // ── Listings ─────────────────────────────────────────────────────────

  async listListings(input: ListListingsInput, schoolId: string) {
    const { category, condition, minPrice, maxPrice, search, sellerId, shopId, page, limit } = input;
    const skip = (page - 1) * limit;
    const where = {
      isDeleted: false,
      isAvailable: true,
      approvalStatus: 'APPROVED' as const,
      isFlagged: false,
      seller: { schoolId },
      ...(category && { category }),
      ...(condition && { condition }),
      ...(sellerId && { sellerId }),
      ...(shopId && { shopId }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.listing.findMany({ where, select: LISTING_SELECT, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.listing.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getListing(id: string, userId: string, schoolId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id, isDeleted: false },
      include: {
        seller: { select: { id: true, fullName: true, profilePictureUrl: true, phone: true, schoolId: true } },
        shop: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    if (!listing) throw new AppError('Listing not found', 404);
    // School isolation
    if (listing.seller.schoolId !== schoolId) throw new AppError('Listing not found', 404);
    // Only seller can see non-approved listing
    if (listing.approvalStatus !== 'APPROVED' && listing.sellerId !== userId) {
      throw new AppError('Listing not available', 404);
    }
    await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    const saved = !!(await prisma.savedListing.findUnique({ where: { userId_listingId: { userId, listingId: id } } }));
    const { seller: { schoolId: _s, ...sellerRest }, ...rest } = listing;
    return { ...rest, seller: sellerRest, saved };
  },

  async createListing(input: CreateListingInput, userId: string) {
    await checkDailyPostLimit(userId, 'listing');
    if (input.shopId) {
      const shop = await prisma.shop.findUnique({ where: { id: input.shopId } });
      if (!shop || shop.ownerId !== userId) throw new AppError('Shop not found or not yours', 403);
    }
    return prisma.listing.create({
      data: {
        title: input.title, description: input.description,
        price: input.price, category: input.category, condition: input.condition ?? 'GOOD',
        images: input.images, location: input.location ?? null,
        whatsapp: input.whatsapp ?? null,
        sellerId: userId, shopId: input.shopId ?? null,
        approvalStatus: 'PENDING',
      },
      select: LISTING_SELECT,
    });
  },

  async updateListing(id: string, input: UpdateListingInput, userId: string) {
    const listing = await prisma.listing.findUnique({ where: { id, isDeleted: false } });
    if (!listing) throw new AppError('Listing not found', 404);
    if (listing.sellerId !== userId) throw new AppError('Not authorized', 403);
    return prisma.listing.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.condition !== undefined && { condition: input.condition }),
        ...(input.images !== undefined && { images: input.images }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
        approvalStatus: 'PENDING', // re-queue on edit
      },
      select: LISTING_SELECT,
    });
  },

  async deleteListing(id: string, userId: string, userRole: string) {
    const listing = await prisma.listing.findUnique({ where: { id, isDeleted: false } });
    if (!listing) throw new AppError('Listing not found', 404);
    if (!ADMIN_ROLES.has(userRole) && listing.sellerId !== userId) throw new AppError('Not authorized', 403);
    await prisma.listing.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    return { deleted: true };
  },

  async saveListing(listingId: string, userId: string) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId, isDeleted: false } });
    if (!listing) throw new AppError('Listing not found', 404);
    const existing = await prisma.savedListing.findUnique({ where: { userId_listingId: { userId, listingId } } });
    if (existing) {
      await prisma.savedListing.delete({ where: { userId_listingId: { userId, listingId } } });
      return { saved: false };
    }
    await prisma.savedListing.create({ data: { userId, listingId } });
    return { saved: true };
  },

  async getSavedListings(userId: string) {
    const saved = await prisma.savedListing.findMany({
      where: { userId },
      include: { listing: { select: LISTING_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return saved.map((s: { listing: unknown }) => s.listing);
  },

  async listPendingListings(schoolId: string) {
    return prisma.listing.findMany({
      where: { isDeleted: false, approvalStatus: 'PENDING', seller: { schoolId } },
      select: LISTING_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  },

  async moderateListing(id: string, input: ModerateContentInput, adminId: string, schoolId: string, ipAddress?: string) {
    const listing = await prisma.listing.findUnique({
      where: { id, isDeleted: false },
      include: { seller: { select: { schoolId: true } } },
    });
    if (!listing || listing.seller.schoolId !== schoolId) throw new AppError('Listing not found', 404);
    const updated = await prisma.listing.update({
      where: { id },
      data: { approvalStatus: input.decision },
      select: LISTING_SELECT,
    });
    await auditService.log({
      action: input.decision === 'APPROVED' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      performedById: adminId, targetId: id, targetType: 'Listing',
      meta: { note: input.note }, ipAddress,
    }).catch(() => null);
    return updated;
  },


  // ── Shop ─────────────────────────────────────────────────────────────

  async getShop(id: string) {
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, profilePictureUrl: true } },
        _count: { select: { followers: true, listings: true } },
      },
    });
    if (!shop) throw new AppError('Shop not found', 404);
    // Attach avgRating
    const agg = await prisma.sellerRating.aggregate({
      where: { shopId: id },
      _avg: { rating: true },
    });
    return { ...shop, followerCount: shop._count.followers, listingCount: shop._count.listings, avgRating: agg._avg.rating ?? null };
  },

  async listShops(schoolId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        where: { isActive: true, owner: { schoolId } },
        include: {
          owner: { select: { id: true, fullName: true, profilePictureUrl: true } },
          _count: { select: { followers: true, listings: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shop.count({ where: { isActive: true, owner: { schoolId } } }),
    ]);

    // Fetch avg ratings for all returned shops in one query
    const shopIds = shops.map((s) => s.id);
    const ratings = shopIds.length
      ? await prisma.sellerRating.groupBy({
          by: ['shopId'],
          where: { shopId: { in: shopIds } },
          _avg: { rating: true },
        })
      : [];

    const ratingMap = new Map(ratings.map((r) => [r.shopId, r._avg.rating ?? null]));

    const items = shops.map((s) => ({
      ...s,
      followerCount: s._count.followers,
      listingCount:  s._count.listings,
      avgRating:     ratingMap.get(s.id) ?? null,
    }));

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getMyShop(userId: string) {
    const shop = await prisma.shop.findUnique({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, fullName: true, profilePictureUrl: true } },
        _count: { select: { followers: true, listings: true } },
      },
    });
    if (!shop) throw new AppError('You do not have a shop', 404);
    const agg = await prisma.sellerRating.aggregate({
      where: { shopId: shop.id },
      _avg: { rating: true },
    });
    return { ...shop, followerCount: shop._count.followers, listingCount: shop._count.listings, avgRating: agg._avg.rating ?? null };
  },

  async createShop(input: CreateShopInput, userId: string) {
    const existing = await prisma.shop.findUnique({ where: { ownerId: userId } });
    if (existing) throw new AppError('You already have a shop', 409);
    return prisma.shop.create({ data: { name: input.name, description: input.description ?? null, ownerId: userId } });
  },

  async updateShop(input: UpdateShopInput, userId: string) {
    const shop = await prisma.shop.findUnique({ where: { ownerId: userId } });
    if (!shop) throw new AppError('Shop not found', 404);
    return prisma.shop.update({
      where: { ownerId: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  },

  async deleteShop(id: string, userId: string, userRole: string) {
    const shop = await prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new AppError('Shop not found', 404);
    if (!ADMIN_ROLES.has(userRole) && shop.ownerId !== userId) throw new AppError('Not authorized', 403);
    await prisma.$transaction([
      prisma.shop.update({ where: { id }, data: { isActive: false } }),
      prisma.listing.updateMany({ where: { shopId: id, isDeleted: false }, data: { isAvailable: false } }),
    ]);
    return { deleted: true };
  },

  async followShop(shopId: string, userId: string) {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new AppError('Shop not found', 404);
    const existing = await prisma.shopFollow.findUnique({ where: { userId_shopId: { userId, shopId } } });
    if (existing) {
      await prisma.shopFollow.delete({ where: { userId_shopId: { userId, shopId } } });
      return { following: false };
    }
    await prisma.shopFollow.create({ data: { userId, shopId } });
    return { following: true };
  },

  async rateSeller(sellerId: string, raterId: string, input: RateSellerInput) {
    if (sellerId === raterId) throw new AppError('Cannot rate yourself', 400);
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) throw new AppError('Seller not found', 404);
    return prisma.sellerRating.upsert({
      where: { raterId_sellerId: { raterId, sellerId } },
      create: { raterId, sellerId, rating: input.rating, comment: input.comment ?? null },
      update: { rating: input.rating, comment: input.comment ?? null },
    });
  },

  // ── Lost & Found ──────────────────────────────────────────────────────

  async listLostFound(input: ListLostFoundInput, schoolId: string) {
    const { type, search, page, limit } = input;
    const skip = (page - 1) * limit;
    const where = {
      isResolved: false,
      reportedBy: { schoolId },
      ...(type && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.lostFoundItem.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: { reportedBy: { select: { id: true, fullName: true } } },
      }),
      prisma.lostFoundItem.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async createLostFound(input: CreateLostFoundInput, userId: string) {
    return prisma.lostFoundItem.create({
      data: {
        type: input.type, title: input.title, description: input.description,
        location: input.location ?? null, contactInfo: input.contactInfo,
        imageUrl: input.imageUrl ?? null, reportedById: userId,
      },
    });
  },

  async markLostFoundResolved(id: string, userId: string) {
    const item = await prisma.lostFoundItem.findUnique({ where: { id } });
    if (!item) throw new AppError('Item not found', 404);
    if (item.reportedById !== userId) throw new AppError('Not authorized', 403);
    return prisma.lostFoundItem.update({ where: { id }, data: { isResolved: true } });
  },


  // ── Accommodation ─────────────────────────────────────────────────────
  // Only verified HOUSE_AGENT, SCHOOL_ADMIN, SUPER_ADMIN can post.
  // Agents post directly as APPROVED. Admins can moderate all posts.

  async listAccommodation(input: ListAccomInput, schoolId: string) {
    const { type, minPrice, maxPrice, search, page, limit } = input;
    const skip = (page - 1) * limit;
    const where = {
      schoolId, isDeleted: false, isAvailable: true,
      approvalStatus: 'APPROVED' as const, isFlagged: false,
      ...(type && { type }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { location: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.accommodationPost.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: {
          postedBy: { select: { id: true, fullName: true, profilePictureUrl: true, role: true } },
        },
      }),
      prisma.accommodationPost.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getAccommodation(id: string, schoolId: string, userId: string) {
    const item = await prisma.accommodationPost.findUnique({
      where: { id, isDeleted: false },
      include: { postedBy: { select: { id: true, fullName: true, profilePictureUrl: true, phone: true, role: true } } },
    });
    if (!item) throw new AppError('Accommodation not found', 404);
    if (item.schoolId !== schoolId) throw new AppError('Accommodation not found', 404);
    if (item.approvalStatus !== 'APPROVED' && item.postedById !== userId) throw new AppError('Accommodation not available', 404);
    return item;
  },

  async createAccommodation(input: CreateAccomInput, userId: string, userRole: string, schoolId: string) {
    // Only verified agents and admins may post accommodation
    if (!AGENT_ROLES.has(userRole)) {
      throw new AppError(
        'Only verified house agents can post accommodation. Apply for agent verification first.',
        403,
      );
    }
    await checkDailyPostLimit(userId, 'accommodation');
    return prisma.accommodationPost.create({
      data: {
        title: input.title, description: input.description,
        type: input.type, price: input.price, period: input.period,
        location: input.location, images: input.images, whatsapp: input.whatsapp,
        postedById: userId, schoolId,
        approvalStatus: 'APPROVED', // agents are pre-verified
      },
    });
  },

  async updateAccommodation(id: string, input: UpdateAccomInput, userId: string, userRole: string) {
    const item = await prisma.accommodationPost.findUnique({ where: { id, isDeleted: false } });
    if (!item) throw new AppError('Accommodation not found', 404);
    if (!ADMIN_ROLES.has(userRole) && item.postedById !== userId) throw new AppError('Not authorized', 403);
    return prisma.accommodationPost.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.period !== undefined && { period: input.period }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.images !== undefined && { images: input.images }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
      },
    });
  },

  async deleteAccommodation(id: string, userId: string, userRole: string) {
    const item = await prisma.accommodationPost.findUnique({ where: { id, isDeleted: false } });
    if (!item) throw new AppError('Accommodation not found', 404);
    if (!ADMIN_ROLES.has(userRole) && item.postedById !== userId) throw new AppError('Not authorized', 403);
    await prisma.accommodationPost.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    return { deleted: true };
  },

  async moderateAccommodation(id: string, input: ModerateContentInput, adminId: string, schoolId: string, ipAddress?: string) {
    const item = await prisma.accommodationPost.findUnique({ where: { id, isDeleted: false } });
    if (!item || item.schoolId !== schoolId) throw new AppError('Accommodation not found', 404);
    const updated = await prisma.accommodationPost.update({
      where: { id },
      data: { approvalStatus: input.decision },
    });
    await auditService.log({
      action: input.decision === 'APPROVED' ? 'ACCOMMODATION_APPROVED' : 'ACCOMMODATION_REJECTED',
      performedById: adminId, targetId: id, targetType: 'AccommodationPost',
      meta: { note: input.note }, ipAddress,
    }).catch(() => null);
    return updated;
  },

  // ── Agent Verification ────────────────────────────────────────────────

  async applyForAgent(input: ApplyAgentInput, userId: string) {
    const existing = await prisma.agentProfile.findUnique({ where: { userId } });
    if (existing) {
      if (existing.status === 'APPROVED') throw new AppError('You are already a verified agent', 409);
      if (existing.status === 'PENDING') throw new AppError('Your application is already under review', 409);
      // REJECTED — allow re-apply by updating
      return prisma.agentProfile.update({
        where: { userId },
        data: {
          businessName: input.businessName, businessAddress: input.businessAddress,
          phoneNumber: input.phoneNumber, studentIdUrl: input.studentIdUrl,
          status: 'PENDING', rejectionReason: null, reviewedById: null, reviewedAt: null,
        },
      });
    }
    return prisma.agentProfile.create({
      data: {
        userId, businessName: input.businessName, businessAddress: input.businessAddress,
        phoneNumber: input.phoneNumber, studentIdUrl: input.studentIdUrl,
      },
    });
  },

  async getMyAgentProfile(userId: string) {
    const profile = await prisma.agentProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError('No agent application found', 404);
    return profile;
  },

  async listPendingAgents(schoolId: string) {
    // Agents belong to a school via their user record
    return prisma.agentProfile.findMany({
      where: { status: 'PENDING', user: { schoolId } },
      include: { user: { select: { id: true, fullName: true, email: true, matricNumber: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async reviewAgent(agentUserId: string, input: ReviewAgentInput, adminId: string, schoolId: string, ipAddress?: string) {
    const profile = await prisma.agentProfile.findUnique({
      where: { userId: agentUserId },
      include: { user: { select: { schoolId: true } } },
    });
    if (!profile || profile.user.schoolId !== schoolId) throw new AppError('Agent application not found', 404);
    if (profile.status !== 'PENDING') throw new AppError('Application is not pending', 400);

    await prisma.$transaction(async (tx) => {
      const _tx = tx as typeof prisma;
      await _tx.agentProfile.update({
        where: { userId: agentUserId },
        data: {
          status: input.decision,
          rejectionReason: input.decision === 'REJECTED' ? (input.note ?? null) : null,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
      // Promote/demote user role based on decision
      if (input.decision === 'APPROVED') {
        await _tx.user.update({ where: { id: agentUserId }, data: { role: 'HOUSE_AGENT' } });
      }
    });

    const updated = await prisma.agentProfile.findUnique({
      where: { userId: agentUserId },
      include: {
        user: { select: { id: true, fullName: true, email: true, matricNumber: true, role: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });

    await auditService.log({
      action: input.decision === 'APPROVED' ? 'AGENT_APPROVED' : 'AGENT_REJECTED',
      performedById: adminId, targetId: agentUserId, targetType: 'User',
      meta: { note: input.note }, ipAddress,
    }).catch(() => null);

    return updated;
  },


  // ── Roommate ──────────────────────────────────────────────────────────

  async listRoommates(schoolId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { schoolId, isActive: true };
    const [items, total] = await Promise.all([
      prisma.roommateRequest.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: { user: { select: { id: true, fullName: true, profilePictureUrl: true, level: true } } },
      }),
      prisma.roommateRequest.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async createRoommateRequest(input: CreateRoommateInput, userId: string, schoolId: string) {
    // One active request per user at a time
    const existing = await prisma.roommateRequest.findFirst({ where: { userId, isActive: true } });
    if (existing) {
      throw new AppError('You already have an active roommate request. Update or deactivate it first.', 409);
    }
    return prisma.roommateRequest.create({
      data: {
        description: input.description, budget: input.budget ?? null,
        preferredArea: input.preferredArea, gender: input.gender,
        level: input.level, whatsapp: input.whatsapp,
        userId, schoolId,
      },
    });
  },

  async updateRoommateRequest(id: string, input: UpdateRoommateInput, userId: string) {
    const item = await prisma.roommateRequest.findUnique({ where: { id } });
    if (!item) throw new AppError('Request not found', 404);
    if (item.userId !== userId) throw new AppError('Not authorized', 403);
    return prisma.roommateRequest.update({
      where: { id },
      data: {
        ...(input.description !== undefined && { description: input.description }),
        ...(input.budget !== undefined && { budget: input.budget }),
        ...(input.preferredArea !== undefined && { preferredArea: input.preferredArea }),
        ...(input.gender !== undefined && { gender: input.gender }),
        ...(input.level !== undefined && { level: input.level }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  },

  async deleteRoommateRequest(id: string, userId: string) {
    const item = await prisma.roommateRequest.findUnique({ where: { id } });
    if (!item) throw new AppError('Request not found', 404);
    if (item.userId !== userId) throw new AppError('Not authorized', 403);
    await prisma.roommateRequest.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  },

  // ── Services ──────────────────────────────────────────────────────────

  async listServices(input: ListServicesInput, schoolId: string) {
    const { category, search, page, limit } = input;
    const skip = (page - 1) * limit;
    const where = {
      schoolId, isDeleted: false, isActive: true,
      approvalStatus: 'APPROVED' as const, isFlagged: false,
      ...(category && { category }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.serviceListing.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: { provider: { select: { id: true, fullName: true, profilePictureUrl: true } } },
      }),
      prisma.serviceListing.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getService(id: string, schoolId: string, userId: string) {
    const item = await prisma.serviceListing.findUnique({
      where: { id, isDeleted: false },
      include: { provider: { select: { id: true, fullName: true, profilePictureUrl: true, phone: true } } },
    });
    if (!item) throw new AppError('Service not found', 404);
    if (item.schoolId !== schoolId) throw new AppError('Service not found', 404);
    if (item.approvalStatus !== 'APPROVED' && item.providerId !== userId) throw new AppError('Service not available', 404);
    return item;
  },

  async createService(input: CreateServiceInput, userId: string, schoolId: string) {
    await checkDailyPostLimit(userId, 'service');
    return prisma.serviceListing.create({
      data: {
        title: input.title, description: input.description,
        category: input.category, price: input.price ?? null,
        priceNote: input.priceNote ?? null, images: input.images,
        whatsapp: input.whatsapp, providerId: userId, schoolId,
        approvalStatus: 'PENDING',
      },
    });
  },

  async updateService(id: string, input: UpdateServiceInput, userId: string) {
    const item = await prisma.serviceListing.findUnique({ where: { id, isDeleted: false } });
    if (!item) throw new AppError('Service not found', 404);
    if (item.providerId !== userId) throw new AppError('Not authorized', 403);
    return prisma.serviceListing.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.priceNote !== undefined && { priceNote: input.priceNote }),
        ...(input.images !== undefined && { images: input.images }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        approvalStatus: 'PENDING', // re-queue on edit
      },
    });
  },

  async deleteService(id: string, userId: string, userRole: string) {
    const item = await prisma.serviceListing.findUnique({ where: { id, isDeleted: false } });
    if (!item) throw new AppError('Service not found', 404);
    if (!ADMIN_ROLES.has(userRole) && item.providerId !== userId) throw new AppError('Not authorized', 403);
    await prisma.serviceListing.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    return { deleted: true };
  },

  async listPendingServices(schoolId: string) {
    return prisma.serviceListing.findMany({
      where: { schoolId, isDeleted: false, approvalStatus: 'PENDING' },
      include: { provider: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  async moderateService(id: string, input: ModerateContentInput, adminId: string, schoolId: string, ipAddress?: string) {
    const item = await prisma.serviceListing.findUnique({ where: { id, isDeleted: false } });
    if (!item || item.schoolId !== schoolId) throw new AppError('Service not found', 404);
    const updated = await prisma.serviceListing.update({
      where: { id },
      data: { approvalStatus: input.decision },
    });
    await auditService.log({
      action: input.decision === 'APPROVED' ? 'SERVICE_APPROVED' : 'SERVICE_REJECTED',
      performedById: adminId, targetId: id, targetType: 'ServiceListing',
      meta: { note: input.note }, ipAddress,
    }).catch(() => null);
    return updated;
  },


  // ── Jobs ──────────────────────────────────────────────────────────────

  async listJobs(input: ListJobsInput, schoolId: string) {
    const { type, search, page, limit } = input;
    const skip = (page - 1) * limit;
    const where = {
      schoolId, isDeleted: false, isActive: true, approvalStatus: 'APPROVED' as const,
      ...(type && { type }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.jobListing.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take: limit,
        include: { postedBy: { select: { id: true, fullName: true, profilePictureUrl: true } } },
      }),
      prisma.jobListing.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  },

  async getJob(id: string, schoolId: string, userId: string) {
    const item = await prisma.jobListing.findUnique({
      where: { id, isDeleted: false },
      include: { postedBy: { select: { id: true, fullName: true, profilePictureUrl: true } } },
    });
    if (!item) throw new AppError('Job listing not found', 404);
    if (item.schoolId !== schoolId) throw new AppError('Job listing not found', 404);
    if (item.approvalStatus !== 'APPROVED' && item.postedById !== userId) throw new AppError('Job listing not available', 404);
    return item;
  },

  async createJob(input: CreateJobInput, userId: string, schoolId: string) {
    return prisma.jobListing.create({
      data: {
        title: input.title, description: input.description,
        type: input.type, pay: input.pay ?? null,
        location: input.location, whatsapp: input.whatsapp,
        postedById: userId, schoolId,
      },
    });
  },

  async updateJob(id: string, input: UpdateJobInput, userId: string) {
    const item = await prisma.jobListing.findUnique({ where: { id, isDeleted: false } });
    if (!item) throw new AppError('Job listing not found', 404);
    if (item.postedById !== userId) throw new AppError('Not authorized', 403);
    return prisma.jobListing.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.pay !== undefined && { pay: input.pay }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.whatsapp !== undefined && { whatsapp: input.whatsapp }),
        approvalStatus: 'PENDING', // reset on edit
        rejectionReason: null,
      },
    });
  },

  async deleteJob(id: string, userId: string, userRole: string) {
    const item = await prisma.jobListing.findUnique({ where: { id, isDeleted: false } });
    if (!item) throw new AppError('Job listing not found', 404);
    if (!ADMIN_ROLES.has(userRole) && item.postedById !== userId) throw new AppError('Not authorized', 403);
    await prisma.jobListing.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
    return { deleted: true };
  },

  async listPendingJobs(schoolId: string) {
    return prisma.jobListing.findMany({
      where: { schoolId, isDeleted: false, approvalStatus: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: { postedBy: { select: { id: true, fullName: true, email: true } } },
    });
  },

  async approveJob(id: string, schoolId: string, adminId: string, ipAddress?: string) {
    const item = await prisma.jobListing.findUnique({ where: { id } });
    if (!item || item.schoolId !== schoolId) throw new AppError('Job listing not found', 404);
    const updated = await prisma.jobListing.update({ where: { id }, data: { approvalStatus: 'APPROVED', rejectionReason: null } });
    await auditService.log({
      action: 'JOB_APPROVED',
      performedById: adminId, targetId: id, targetType: 'JobListing',
      ipAddress,
    }).catch(() => null);
    return updated;
  },

  async rejectJob(id: string, schoolId: string, input: RejectJobInput, adminId: string, ipAddress?: string) {
    const item = await prisma.jobListing.findUnique({ where: { id } });
    if (!item || item.schoolId !== schoolId) throw new AppError('Job listing not found', 404);
    const updated = await prisma.jobListing.update({
      where: { id },
      data: { approvalStatus: 'REJECTED', rejectionReason: input.rejectionReason },
    });
    await auditService.log({
      action: 'JOB_REJECTED',
      performedById: adminId, targetId: id, targetType: 'JobListing',
      meta: { reason: input.rejectionReason }, ipAddress,
    }).catch(() => null);
    return updated;
  },

  // ── Reporting ─────────────────────────────────────────────────────────

  async reportContent(input: ReportContentInput, userId: string) {
    const { targetType, targetId, reason, details } = input;
    // Verify target exists
    if (targetType === 'listing') {
      const listing = await prisma.listing.findUnique({ where: { id: targetId, isDeleted: false } });
      if (!listing) throw new AppError('Listing not found', 404);
    } else if (targetType === 'accommodation') {
      const acc = await prisma.accommodationPost.findUnique({ where: { id: targetId, isDeleted: false } });
      if (!acc) throw new AppError('Accommodation not found', 404);
    } else if (targetType === 'service') {
      const svc = await prisma.serviceListing.findUnique({ where: { id: targetId, isDeleted: false } });
      if (!svc) throw new AppError('Service not found', 404);
    }

    await prisma.marketplaceReport.create({
      data: {
        reportedById: userId, reason, details: details ?? null,
        listingId: targetType === 'listing' ? targetId : null,
        accommodationId: targetType === 'accommodation' ? targetId : null,
        serviceId: targetType === 'service' ? targetId : null,
      },
    });

    // Increment report count and auto-flag if threshold reached — done atomically
    if (targetType === 'listing') {
      await prisma.$executeRaw`
        UPDATE listings SET report_count = report_count + 1,
          is_flagged = CASE WHEN report_count + 1 >= ${AUTO_FLAG_THRESHOLD} THEN true ELSE is_flagged END
        WHERE id = ${targetId}`;
    } else if (targetType === 'accommodation') {
      await prisma.$executeRaw`
        UPDATE accommodation_posts SET report_count = report_count + 1,
          is_flagged = CASE WHEN report_count + 1 >= ${AUTO_FLAG_THRESHOLD} THEN true ELSE is_flagged END
        WHERE id = ${targetId}`;
    } else {
      await prisma.$executeRaw`
        UPDATE service_listings SET report_count = report_count + 1,
          is_flagged = CASE WHEN report_count + 1 >= ${AUTO_FLAG_THRESHOLD} THEN true ELSE is_flagged END
        WHERE id = ${targetId}`;
    }

    return { reported: true };
  },

  async listReports(schoolId: string) {
    return prisma.marketplaceReport.findMany({
      where: {
        isResolved: false,
        OR: [
          { listing: { seller: { schoolId } } },
          { accommodation: { schoolId } },
          { service: { schoolId } },
        ],
      },
      include: {
        reportedBy: { select: { id: true, fullName: true } },
        listing: { select: { id: true, title: true, seller: { select: { fullName: true } } } },
        accommodation: { select: { id: true, title: true, postedBy: { select: { fullName: true } } } },
        service: { select: { id: true, title: true, provider: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async resolveReport(reportId: string, adminId: string, schoolId: string, ipAddress?: string) {
    const report = await prisma.marketplaceReport.findUnique({
      where: { id: reportId },
      include: {
        listing: { select: { seller: { select: { schoolId: true } } } },
        accommodation: { select: { schoolId: true } },
        service: { select: { schoolId: true } },
      },
    });
    if (!report) throw new AppError('Report not found', 404);
    const reportSchoolId =
      report.listing?.seller.schoolId ??
      report.accommodation?.schoolId ??
      report.service?.schoolId;
    if (reportSchoolId && reportSchoolId !== schoolId) throw new AppError('Report not found', 404);
    await prisma.marketplaceReport.update({
      where: { id: reportId },
      data: { isResolved: true, resolvedAt: new Date() },
    });
    await auditService.log({
      action: 'REPORT_RESOLVED',
      performedById: adminId, targetId: reportId, targetType: 'MarketplaceReport',
      ipAddress,
    }).catch(() => null);
    return { resolved: true };
  },
};
