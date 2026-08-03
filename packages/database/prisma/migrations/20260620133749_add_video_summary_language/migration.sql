-- CreateEnum
CREATE TYPE "SummaryLanguage" AS ENUM ('es', 'en', 'de');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "summaryLanguage" "SummaryLanguage" NOT NULL DEFAULT 'es';
