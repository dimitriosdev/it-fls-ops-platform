"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { InventoryOrderStatus } from "@/src/generated/prisma/enums";
import { requireAdmin, requireSupporter } from "@/src/lib/auth/authorization";
import { prisma } from "@/src/lib/prisma";
import { INVENTORY_ITEMS } from "@/src/server/inventory-catalog";

const requestSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(500),
  businessReason: z.string().trim().min(5).max(2000),
  notes: z.string().trim().max(2000),
});

export async function createInventoryOrder(formData: FormData): Promise<void> {
  const user = await requireSupporter();
  const parsed = requestSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
    businessReason: formData.get("businessReason"),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    redirect("/inventory/request?error=invalid");
  }

  const item = INVENTORY_ITEMS.find(({ id }) => id === parsed.data.itemId);
  if (!item) {
    redirect("/inventory/request?error=item");
  }

  await prisma.inventoryOrder.create({
    data: {
      requesterId: user.id,
      itemId: item.id,
      itemName: item.name,
      quantity: parsed.data.quantity,
      businessReason: parsed.data.businessReason,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/request");
  redirect("/inventory/request?submitted=1");
}

const reviewSchema = z.object({
  orderId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewComment: z.string().trim().max(2000),
});

export async function reviewInventoryOrder(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = reviewSchema.safeParse({
    orderId: formData.get("orderId"),
    decision: formData.get("decision"),
    reviewComment: formData.get("reviewComment") ?? "",
  });
  if (!parsed.success) {
    redirect("/inventory/request?error=invalid");
  }

  const result = await prisma.inventoryOrder.updateMany({
    where: { id: parsed.data.orderId, status: InventoryOrderStatus.PENDING },
    data: {
      status: parsed.data.decision,
      reviewComment: parsed.data.reviewComment || null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  if (result.count !== 1) {
    redirect("/inventory/request?error=reviewed");
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/request");
  redirect("/inventory/request?reviewed=1");
}
