CREATE TYPE "InventoryOrderStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "inventory_orders" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "itemId" VARCHAR(100) NOT NULL,
    "itemName" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "businessReason" TEXT NOT NULL,
    "notes" TEXT,
    "status" "InventoryOrderStatus" NOT NULL DEFAULT 'PENDING',
    "reviewComment" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "inventory_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_orders_requesterId_createdAt_idx" ON "inventory_orders"("requesterId", "createdAt");
CREATE INDEX "inventory_orders_status_createdAt_idx" ON "inventory_orders"("status", "createdAt");

ALTER TABLE "inventory_orders" ADD CONSTRAINT "inventory_orders_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_orders" ADD CONSTRAINT "inventory_orders_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
