-- AlterTable: add optional Google and GitHub OAuth ID columns to users
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN "githubId" TEXT;

-- CreateIndex: unique constraint on googleId
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex: unique constraint on githubId
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
