-- AlterTable: passwordHash becomes optional (Google-only accounts have no password)
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable: new columns, nullable for now so we can backfill existing rows
ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- Backfill username from the email local-part for pre-existing rows, de-duplicating collisions
WITH base AS (
  SELECT
    id,
    NULLIF(regexp_replace(split_part(email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'), '') AS base_username,
    "createdAt"
  FROM "User"
),
ranked AS (
  SELECT
    id,
    COALESCE(base_username, 'user') AS base_username,
    row_number() OVER (PARTITION BY COALESCE(base_username, 'user') ORDER BY "createdAt") AS rn
  FROM base
)
UPDATE "User" u
SET "username" = CASE WHEN r.rn = 1 THEN r.base_username ELSE r.base_username || r.rn::text END
FROM ranked r
WHERE u.id = r.id;

-- Enforce NOT NULL + uniqueness now that every row has a username
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
