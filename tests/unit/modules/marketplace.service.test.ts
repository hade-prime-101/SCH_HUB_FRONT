import { randomUUID } from 'crypto';
import { prismaMock } from '../../helpers/mock-factories';
import { marketplaceService } from '@/modules/marketplace/marketplace.service';

const userId   = 'u-1';
const schoolId = 'sch-1';
const adminRole = 'SCHOOL_ADMIN';
const studentRole = 'STUDENT';

const mockListing = (overrides: Record<string, unknown> = {}) => ({
  id: 'lst-1', title: 'Laptop', sellerId: userId, isDeleted: false,
  approvalStatus: 'APPROVED', isFlagged: false, isAvailable: true,
  seller: { schoolId }, ...overrides,
});

// ── Listings ───────────────────────────────────────────────────────────────

describe('marketplaceService.getListing', () => {
  it('throws 404 when listing not found', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.getListing('lst-1', userId, schoolId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 404 when listing belongs to different school', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(
      mockListing({ seller: { schoolId: 'other-school', id: userId, fullName: 'X', profilePictureUrl: null, phone: null } }) as any
    );
    await expect(marketplaceService.getListing('lst-1', userId, schoolId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns listing and increments view count', async () => {
    const listing = {
      ...mockListing(),
      seller: { id: userId, fullName: 'John', profilePictureUrl: null, phone: null, schoolId },
      shop: null,
    };
    prismaMock.listing.findUnique.mockResolvedValue(listing as any);
    prismaMock.listing.update.mockResolvedValue(listing as any);
    prismaMock.savedListing.findUnique.mockResolvedValue(null);
    const result = await marketplaceService.getListing('lst-1', userId, schoolId);
    expect(result).toMatchObject({ id: 'lst-1' });
    expect(prismaMock.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { viewCount: { increment: 1 } } })
    );
  });
});

describe('marketplaceService.updateListing', () => {
  it('throws 404 when listing not found', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.updateListing('lst-1', { title: 'New' } as any, userId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner tries to update', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(mockListing({ sellerId: 'other' }) as any);
    await expect(marketplaceService.updateListing('lst-1', { title: 'New' } as any, userId)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('updates listing and resets approval status', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(mockListing() as any);
    prismaMock.listing.update.mockResolvedValue({ ...mockListing(), approvalStatus: 'PENDING' } as any);
    const result = await marketplaceService.updateListing('lst-1', { title: 'Updated' } as any, userId);
    expect(result).toMatchObject({ approvalStatus: 'PENDING' });
  });
});

describe('marketplaceService.deleteListing', () => {
  it('throws 404 when not found', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.deleteListing('lst-1', userId, studentRole)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner non-admin tries to delete', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(mockListing({ sellerId: 'other' }) as any);
    await expect(marketplaceService.deleteListing('lst-1', userId, studentRole)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('soft-deletes own listing', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(mockListing() as any);
    prismaMock.listing.update.mockResolvedValue({} as any);
    expect(await marketplaceService.deleteListing('lst-1', userId, studentRole)).toEqual({ deleted: true });
  });
});

describe('marketplaceService.saveListing', () => {
  it('throws 404 when listing not found', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.saveListing('lst-1', userId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('saves listing when not already saved', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(mockListing() as any);
    prismaMock.savedListing.findUnique.mockResolvedValue(null);
    prismaMock.savedListing.create.mockResolvedValue({} as any);
    expect(await marketplaceService.saveListing('lst-1', userId)).toEqual({ saved: true });
  });

  it('unsaves listing when already saved', async () => {
    prismaMock.listing.findUnique.mockResolvedValue(mockListing() as any);
    prismaMock.savedListing.findUnique.mockResolvedValue({ id: 's-1' } as any);
    prismaMock.savedListing.delete.mockResolvedValue({} as any);
    expect(await marketplaceService.saveListing('lst-1', userId)).toEqual({ saved: false });
  });
});

// ── Shop ───────────────────────────────────────────────────────────────────

describe('marketplaceService.getShop', () => {
  it('throws 404 when shop not found', async () => {
    prismaMock.shop.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.getShop('shop-1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns shop', async () => {
    prismaMock.shop.findUnique.mockResolvedValue({ id: 'shop-1', name: 'My Shop', _count: { followers: 0, listings: 0 } } as any);
    expect(await marketplaceService.getShop('shop-1')).toMatchObject({ id: 'shop-1' });
  });
});

describe('marketplaceService.createShop', () => {
  it('throws 409 when user already has a shop', async () => {
    prismaMock.shop.findUnique.mockResolvedValue({ id: 'shop-1' } as any);
    await expect(marketplaceService.createShop({ name: 'New Shop' } as any, userId)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates shop', async () => {
    prismaMock.shop.findUnique.mockResolvedValue(null);
    prismaMock.shop.create.mockResolvedValue({ id: 'shop-new', name: 'New Shop' } as any);
    expect(await marketplaceService.createShop({ name: 'New Shop' } as any, userId)).toMatchObject({ id: 'shop-new' });
  });
});

describe('marketplaceService.rateSeller', () => {
  it('throws 400 when rating self', async () => {
    await expect(marketplaceService.rateSeller(userId, userId, { rating: 5 } as any)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('throws 404 when seller not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.rateSeller('seller-1', userId, { rating: 5 } as any)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('upserts seller rating', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'seller-1' } as any);
    prismaMock.sellerRating.upsert.mockResolvedValue({ rating: 5 } as any);
    const result = await marketplaceService.rateSeller('seller-1', userId, { rating: 5 } as any);
    expect(result).toMatchObject({ rating: 5 });
  });
});

// ── Lost & Found ───────────────────────────────────────────────────────────

describe('marketplaceService.markLostFoundResolved', () => {
  it('throws 404 when item not found', async () => {
    prismaMock.lostFoundItem.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.markLostFoundResolved('item-1', userId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-reporter tries to resolve', async () => {
    prismaMock.lostFoundItem.findUnique.mockResolvedValue({ id: 'item-1', reportedById: 'other' } as any);
    await expect(marketplaceService.markLostFoundResolved('item-1', userId)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('marks item resolved', async () => {
    prismaMock.lostFoundItem.findUnique.mockResolvedValue({ id: 'item-1', reportedById: userId } as any);
    prismaMock.lostFoundItem.update.mockResolvedValue({ id: 'item-1', isResolved: true } as any);
    const result = await marketplaceService.markLostFoundResolved('item-1', userId);
    expect(result).toMatchObject({ isResolved: true });
  });
});

// ── Accommodation ──────────────────────────────────────────────────────────

describe('marketplaceService.createAccommodation', () => {
  it('throws 403 when student tries to post accommodation', async () => {
    await expect(
      marketplaceService.createAccommodation({} as any, userId, studentRole, schoolId)
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('creates accommodation for house agent', async () => {
    prismaMock.accommodationPost.count.mockResolvedValue(0);
    prismaMock.accommodationPost.create.mockResolvedValue({ id: 'acc-1' } as any);
    const result = await marketplaceService.createAccommodation(
      { title: 'Room', description: 'Nice room', type: 'SELF_CONTAIN', price: 50000, period: 'YEARLY', location: 'Campus', images: [], whatsapp: '+234...' } as any,
      userId, 'HOUSE_AGENT', schoolId
    );
    expect(result).toMatchObject({ id: 'acc-1' });
  });
});

describe('marketplaceService.deleteAccommodation', () => {
  it('throws 404 when not found', async () => {
    prismaMock.accommodationPost.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.deleteAccommodation('acc-1', userId, studentRole)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner non-admin tries to delete', async () => {
    prismaMock.accommodationPost.findUnique.mockResolvedValue({ id: 'acc-1', postedById: 'other' } as any);
    await expect(marketplaceService.deleteAccommodation('acc-1', userId, studentRole)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('soft-deletes accommodation', async () => {
    prismaMock.accommodationPost.findUnique.mockResolvedValue({ id: 'acc-1', postedById: userId } as any);
    prismaMock.accommodationPost.update.mockResolvedValue({} as any);
    expect(await marketplaceService.deleteAccommodation('acc-1', userId, studentRole)).toEqual({ deleted: true });
  });
});

// ── Jobs ───────────────────────────────────────────────────────────────────

describe('marketplaceService.deleteJob', () => {
  it('throws 404 when not found', async () => {
    prismaMock.jobListing.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.deleteJob('job-1', userId, studentRole)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner non-admin tries to delete', async () => {
    prismaMock.jobListing.findUnique.mockResolvedValue({ id: 'job-1', postedById: 'other' } as any);
    await expect(marketplaceService.deleteJob('job-1', userId, studentRole)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('soft-deletes own job', async () => {
    prismaMock.jobListing.findUnique.mockResolvedValue({ id: 'job-1', postedById: userId } as any);
    prismaMock.jobListing.update.mockResolvedValue({} as any);
    expect(await marketplaceService.deleteJob('job-1', userId, studentRole)).toEqual({ deleted: true });
  });
});

// ── Roommate ───────────────────────────────────────────────────────────────

describe('marketplaceService.createRoommateRequest', () => {
  it('throws 409 when active request already exists', async () => {
    prismaMock.roommateRequest.findFirst.mockResolvedValue({ id: 'r-1' } as any);
    await expect(
      marketplaceService.createRoommateRequest({} as any, userId, schoolId)
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('creates roommate request', async () => {
    prismaMock.roommateRequest.findFirst.mockResolvedValue(null);
    prismaMock.roommateRequest.create.mockResolvedValue({ id: 'r-new' } as any);
    const result = await marketplaceService.createRoommateRequest(
      { description: 'Looking for roommate', preferredArea: 'Campus', gender: 'MALE', level: '300', whatsapp: '+234...' } as any,
      userId, schoolId
    );
    expect(result).toMatchObject({ id: 'r-new' });
  });
});

describe('marketplaceService.deleteRoommateRequest', () => {
  it('throws 404 when not found', async () => {
    prismaMock.roommateRequest.findUnique.mockResolvedValue(null);
    await expect(marketplaceService.deleteRoommateRequest('r-1', userId)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when non-owner tries to delete', async () => {
    prismaMock.roommateRequest.findUnique.mockResolvedValue({ id: 'r-1', userId: 'other' } as any);
    await expect(marketplaceService.deleteRoommateRequest('r-1', userId)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('deactivates own request', async () => {
    prismaMock.roommateRequest.findUnique.mockResolvedValue({ id: 'r-1', userId } as any);
    prismaMock.roommateRequest.update.mockResolvedValue({} as any);
    expect(await marketplaceService.deleteRoommateRequest('r-1', userId)).toEqual({ deleted: true });
  });
});
