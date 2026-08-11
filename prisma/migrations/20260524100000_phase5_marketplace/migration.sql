-- Add whatsapp to listings
ALTER TABLE "listings" ADD COLUMN "whatsapp" TEXT;

-- SavedListing
CREATE TABLE "saved_listings" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_listings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "saved_listings_userId_listingId_key" ON "saved_listings"("userId", "listingId");
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saved_listings" ADD CONSTRAINT "saved_listings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enums
CREATE TYPE "AccommodationType" AS ENUM ('SELF_CONTAIN','ROOM_AND_PARLOUR','SINGLE_ROOM','SHARED_ROOM','HOSTEL','FLAT','OTHER');
CREATE TYPE "ServiceCategory" AS ENUM ('TUTORING','GRAPHICS','CODING','PHOTOGRAPHY','PRINTING','LAUNDRY','FOOD','DELIVERY','OTHER');

-- AccommodationPost
CREATE TABLE "accommodation_posts" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type"        "AccommodationType" NOT NULL,
  "price"       DECIMAL(10,2) NOT NULL,
  "period"      TEXT NOT NULL DEFAULT 'year',
  "location"    TEXT NOT NULL,
  "images"      JSONB NOT NULL DEFAULT '[]',
  "whatsapp"    TEXT NOT NULL,
  "isAvailable" BOOLEAN NOT NULL DEFAULT true,
  "isDeleted"   BOOLEAN NOT NULL DEFAULT false,
  "postedById"  TEXT NOT NULL,
  "schoolId"    TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "accommodation_posts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accommodation_posts_schoolId_isAvailable_idx" ON "accommodation_posts"("schoolId", "isAvailable");
ALTER TABLE "accommodation_posts" ADD CONSTRAINT "accommodation_posts_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accommodation_posts" ADD CONSTRAINT "accommodation_posts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RoommateRequest
CREATE TABLE "roommate_requests" (
  "id"            TEXT NOT NULL,
  "description"   TEXT NOT NULL,
  "budget"        DECIMAL(10,2),
  "preferredArea" TEXT,
  "gender"        TEXT,
  "level"         TEXT,
  "whatsapp"      TEXT NOT NULL,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "userId"        TEXT NOT NULL,
  "schoolId"      TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roommate_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "roommate_requests_schoolId_isActive_idx" ON "roommate_requests"("schoolId", "isActive");
ALTER TABLE "roommate_requests" ADD CONSTRAINT "roommate_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roommate_requests" ADD CONSTRAINT "roommate_requests_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ServiceListing
CREATE TABLE "service_listings" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category"    "ServiceCategory" NOT NULL,
  "price"       DECIMAL(10,2),
  "priceNote"   TEXT,
  "images"      JSONB NOT NULL DEFAULT '[]',
  "whatsapp"    TEXT NOT NULL,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "isDeleted"   BOOLEAN NOT NULL DEFAULT false,
  "providerId"  TEXT NOT NULL,
  "schoolId"    TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_listings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_listings_schoolId_category_isActive_idx" ON "service_listings"("schoolId", "category", "isActive");
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_listings" ADD CONSTRAINT "service_listings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
