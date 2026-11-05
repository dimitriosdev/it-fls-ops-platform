/*
  Warnings:

  - A unique constraint covering the columns `[sourceMessageId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "sourceMessageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_sourceMessageId_key" ON "Ticket"("sourceMessageId");
