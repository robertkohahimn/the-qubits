-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Hardware', 'Algorithms', 'Theory', 'Cryptography');

-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('Entry', 'Mid', 'High');

-- CreateEnum
CREATE TYPE "Accent" AS ENUM ('purple', 'teal', 'yellow', 'orange', 'pink', 'blueLight', 'blueVibrant');

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "readMinutes" INTEGER NOT NULL,
    "complexity" "Complexity" NOT NULL,
    "category" "Category" NOT NULL,
    "accent" "Accent" NOT NULL,
    "heroImage" TEXT NOT NULL,
    "codeNumber" INTEGER NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_publishedAt_id_idx" ON "Post"("publishedAt", "id");
