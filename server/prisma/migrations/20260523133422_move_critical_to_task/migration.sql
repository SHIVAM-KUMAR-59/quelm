/*
  Warnings:

  - You are about to drop the column `critical` on the `workflow_runs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "critical" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "workflow_runs" DROP COLUMN "critical";
