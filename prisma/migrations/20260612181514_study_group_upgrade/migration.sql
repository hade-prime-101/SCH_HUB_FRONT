-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'EXPIRED', 'DECLINED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'GROUP_MEMBER_KICKED';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_ROLE_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_CHALLENGE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'GROUP_CHALLENGE_COMPLETED';

-- AlterTable
ALTER TABLE "study_group_messages" ADD COLUMN     "aiContext" TEXT,
ADD COLUMN     "isAiReply" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "group_invites" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_challenges" (
    "id" TEXT NOT NULL,
    "initiatorGroupId" TEXT NOT NULL,
    "receiverGroupId" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "initiatorAvgScore" DOUBLE PRECISION,
    "receiverAvgScore" DOUBLE PRECISION,
    "winnerGroupId" TEXT,
    "initiatorBadgeAwarded" BOOLEAN NOT NULL DEFAULT false,
    "receiverBadgeAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_invites_token_key" ON "group_invites"("token");

-- CreateIndex
CREATE INDEX "group_invites_groupId_idx" ON "group_invites"("groupId");

-- CreateIndex
CREATE INDEX "group_challenges_initiatorGroupId_idx" ON "group_challenges"("initiatorGroupId");

-- CreateIndex
CREATE INDEX "group_challenges_receiverGroupId_idx" ON "group_challenges"("receiverGroupId");

-- AddForeignKey
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "study_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_invites" ADD CONSTRAINT "group_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_challenges" ADD CONSTRAINT "group_challenges_initiatorGroupId_fkey" FOREIGN KEY ("initiatorGroupId") REFERENCES "study_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_challenges" ADD CONSTRAINT "group_challenges_receiverGroupId_fkey" FOREIGN KEY ("receiverGroupId") REFERENCES "study_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
