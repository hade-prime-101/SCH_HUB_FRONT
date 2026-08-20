-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN     "isMentorQuestion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentorCourseCode" TEXT,
ADD COLUMN     "targetLevel" TEXT;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "isMentorQuestion" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "academicPostCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "course_mentors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mentorPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_mentors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freshers_faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "schoolId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freshers_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_mentors_departmentId_courseCode_idx" ON "course_mentors"("departmentId", "courseCode");

-- CreateIndex
CREATE UNIQUE INDEX "course_mentors_userId_courseCode_key" ON "course_mentors"("userId", "courseCode");

-- CreateIndex
CREATE INDEX "freshers_faqs_schoolId_category_idx" ON "freshers_faqs"("schoolId", "category");

-- AddForeignKey
ALTER TABLE "course_mentors" ADD CONSTRAINT "course_mentors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_mentors" ADD CONSTRAINT "course_mentors_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freshers_faqs" ADD CONSTRAINT "freshers_faqs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
