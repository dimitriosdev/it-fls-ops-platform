-- AlterEnum
ALTER TYPE "TicketHistoryAction" ADD VALUE 'REOPENED';

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "timeSpentMinutes" INTEGER;
