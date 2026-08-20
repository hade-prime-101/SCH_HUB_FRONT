-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('FIRST', 'SECOND');

-- CreateTable
CREATE TABLE "cgpa_courses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseTitle" TEXT NOT NULL,
    "creditUnit" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "grade" TEXT,
    "gradePoint" DOUBLE PRECISION,
    "passmark" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "semester" "SemesterType" NOT NULL,
    "session" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cgpa_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cgpa_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "semester" "SemesterType" NOT NULL,
    "session" TEXT NOT NULL,
    "gpa" DOUBLE PRECISION NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cgpa_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cgpa_courses_userId_semester_session_idx" ON "cgpa_courses"("userId", "semester", "session");

-- CreateIndex
CREATE INDEX "cgpa_records_userId_idx" ON "cgpa_records"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "cgpa_records_userId_semester_session_key" ON "cgpa_records"("userId", "semester", "session");

-- AddForeignKey
ALTER TABLE "cgpa_courses" ADD CONSTRAINT "cgpa_courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cgpa_records" ADD CONSTRAINT "cgpa_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
