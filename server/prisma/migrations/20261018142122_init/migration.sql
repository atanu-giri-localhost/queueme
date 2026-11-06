-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('movie', 'video', 'article', 'book', 'course', 'audio');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('queued', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "ItemPriority" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "creator" TEXT NOT NULL DEFAULT '',
    "platform" TEXT NOT NULL DEFAULT '',
    "duration" TEXT NOT NULL DEFAULT '',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "progressLabel" TEXT NOT NULL DEFAULT 'Not started',
    "status" "ItemStatus" NOT NULL DEFAULT 'queued',
    "priority" "ItemPriority" NOT NULL DEFAULT 'medium',
    "releaseYear" TEXT,
    "rating" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImage" TEXT,
    "url" TEXT,
    "sourceUrl" TEXT,
    "notes" TEXT,
    "addedDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "items_type_idx" ON "items"("type");

-- CreateIndex
CREATE INDEX "items_priority_idx" ON "items"("priority");
