"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  TicketHistoryAction,
  TicketStatus,
  UserRole,
} from "@/src/generated/prisma/enums";
import {
  getCurrentUser,
  requireSupporter,
  requireUser,
} from "@/src/lib/auth/authorization";
import { prisma } from "@/src/lib/prisma";

export type TicketResult =
  { ok: true; ticketId: string; ticketNumber?: number } | { ok: false; error: string };

const id = z.string().min(1);
const optionalText = z.string().trim().max(5000).optional();

const createSchema = z.object({
  workplace: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(120),
  description: z.string().trim().min(5).max(5000),
  reporterId: id.optional(),
});
const assignSchema = z.object({ ticketId: id, supporterId: id });
const startSchema = z.object({ ticketId: id });
const resolveSchema = z.object({
  ticketId: id,
  resolutionType: z.string().trim().min(1).max(120),
  resolutionText: z.string().trim().min(1).max(5000),
  timeSpentMinutes: z.number().int().min(0).max(100000).optional(),
  externalFollowup: z.boolean().default(false),
  externalPerson: z.string().trim().max(120).optional(),
  externalNotes: optionalText,
});
const closeSchema = z.object({ ticketId: id });
const attachmentSchema = z.object({
  ticketId: id,
  filename: z.string().trim().min(1).max(255),
  url: z.url({ protocol: /^https$/ }).max(2048),
});

const fail = (error: string): TicketResult => ({ ok: false, error });
const done = (ticketId: string, ticketNumber?: number): TicketResult => {
  revalidatePath("/dashboard");
  revalidatePath("/tickets");
  revalidatePath("/stats");
  return { ok: true, ticketId, ticketNumber };
};

const isStaff = (role: UserRole) =>
  role === UserRole.ADMIN || role === UserRole.SUPPORTER;

export async function createTicket(input: unknown): Promise<TicketResult> {
  const user = await requireUser();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const data = parsed.data;

  // Only staff may file on behalf of another reporter.
  const reporterId = data.reporterId && isStaff(user.role) ? data.reporterId : user.id;

  const reporter = await prisma.user.findFirst({
    where: { id: reporterId, isActive: true },
    select: { id: true },
  });
  if (!reporter) return fail("Invalid reporter.");

  // Free-text workplace/category: reuse the lookup row or create it.
  const [workplace, category] = await Promise.all([
    prisma.workplace.upsert({
      where: { name: data.workplace },
      update: {},
      create: { name: data.workplace },
    }),
    prisma.category.upsert({
      where: { name: data.category },
      update: {},
      create: { name: data.category },
    }),
  ]);

  const ticket = await prisma.ticket.create({
    data: {
      reporterId,
      workplaceId: workplace.id,
      categoryId: category.id,
      description: data.description,
      history: {
        create: {
          actorId: user.id,
          action: TicketHistoryAction.CREATED,
          toStatus: TicketStatus.NEW,
        },
      },
    },
    select: { id: true, ticketNumber: true },
  });
  return done(ticket.id, ticket.ticketNumber);
}

export async function assignTicket(input: unknown): Promise<TicketResult> {
  const user = await requireSupporter();
  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { ticketId, supporterId } = parsed.data;

  const supporter = await prisma.user.findFirst({
    where: {
      id: supporterId,
      isActive: true,
      role: { in: [UserRole.ADMIN, UserRole.SUPPORTER] },
    },
    select: { id: true, name: true },
  });
  if (!supporter) return fail("Assignee must be an active supporter.");

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true, assignedSupporterId: true },
    });
    if (!ticket) return fail("Ticket not found.");
    if (
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CLOSED
    ) {
      return fail("Resolved or closed tickets cannot be reassigned.");
    }

    const moveToInProgress = ticket.status === TicketStatus.NEW;
    await tx.ticket.update({
      where: { id: ticketId },
      data: {
        assignedSupporterId: supporter.id,
        ...(moveToInProgress && { status: TicketStatus.IN_PROGRESS }),
      },
    });
    await tx.ticketHistory.create({
      data: {
        ticketId,
        actorId: user.id,
        action: TicketHistoryAction.ASSIGNED,
        details: `Assigned to ${supporter.name}`,
      },
    });
    if (moveToInProgress) {
      await tx.ticketHistory.create({
        data: {
          ticketId,
          actorId: user.id,
          action: TicketHistoryAction.STATUS_CHANGED,
          fromStatus: TicketStatus.NEW,
          toStatus: TicketStatus.IN_PROGRESS,
        },
      });
    }
    return done(ticketId);
  });
}

// Moves NEW -> IN_PROGRESS and assigns the caller if nobody is assigned yet.
export async function startTicket(input: unknown): Promise<TicketResult> {
  const user = await requireSupporter();
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { ticketId } = parsed.data;

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { assignedSupporterId: true },
    });
    if (!ticket) return fail("Ticket not found.");

    // Conditional update guards against concurrent status changes.
    const { count } = await tx.ticket.updateMany({
      where: { id: ticketId, status: TicketStatus.NEW },
      data: {
        status: TicketStatus.IN_PROGRESS,
        ...(!ticket.assignedSupporterId && { assignedSupporterId: user.id }),
      },
    });
    if (count === 0) return fail("Ticket is not in NEW status.");

    await tx.ticketHistory.create({
      data: {
        ticketId,
        actorId: user.id,
        action: TicketHistoryAction.STATUS_CHANGED,
        fromStatus: TicketStatus.NEW,
        toStatus: TicketStatus.IN_PROGRESS,
      },
    });
    return done(ticketId);
  });
}

export async function resolveTicket(input: unknown): Promise<TicketResult> {
  const user = await requireSupporter();
  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { ticketId, ...data } = parsed.data;

  return prisma.$transaction(async (tx) => {
    const before = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { status: true, assignedSupporterId: true },
    });
    if (!before) return fail("Ticket not found.");

    const { count } = await tx.ticket.updateMany({
      where: {
        id: ticketId,
        status: { in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS] },
      },
      data: {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
        assignedSupporterId: before.assignedSupporterId ?? user.id,
        resolutionType: data.resolutionType,
        resolutionText: data.resolutionText,
        timeSpentMinutes: data.timeSpentMinutes ?? null,
        externalFollowup: data.externalFollowup,
        externalPerson: data.externalFollowup ? (data.externalPerson ?? null) : null,
        externalNotes: data.externalFollowup ? (data.externalNotes ?? null) : null,
      },
    });
    if (count === 0) return fail("Ticket is already resolved or closed.");

    await tx.ticketHistory.create({
      data: {
        ticketId,
        actorId: user.id,
        action: TicketHistoryAction.RESOLVED,
        fromStatus: before.status,
        toStatus: TicketStatus.RESOLVED,
        details: data.resolutionType,
      },
    });
    return done(ticketId);
  });
}

export async function closeTicket(input: unknown): Promise<TicketResult> {
  const user = await requireUser();
  const parsed = closeSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { ticketId } = parsed.data;

  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { reporterId: true },
    });
    if (!ticket) return fail("Ticket not found.");

    // Staff or the reporter confirming the resolution may close.
    if (!isStaff(user.role) && ticket.reporterId !== user.id) {
      return fail("You are not allowed to close this ticket.");
    }

    const { count } = await tx.ticket.updateMany({
      where: { id: ticketId, status: TicketStatus.RESOLVED },
      data: { status: TicketStatus.CLOSED, closedAt: new Date() },
    });
    if (count === 0) return fail("Only resolved tickets can be closed.");

    await tx.ticketHistory.create({
      data: {
        ticketId,
        actorId: user.id,
        action: TicketHistoryAction.CLOSED,
        fromStatus: TicketStatus.RESOLVED,
        toStatus: TicketStatus.CLOSED,
      },
    });
    return done(ticketId);
  });
}

// Stores only metadata; the file itself lives in external object storage (e.g. Vercel Blob).
export async function addAttachment(input: unknown): Promise<TicketResult> {
  const user = await getCurrentUser();
  if (!user) return fail("Not authenticated.");
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { ticketId, filename, url } = parsed.data;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { reporterId: true },
  });
  if (!ticket) return fail("Ticket not found.");
  if (!isStaff(user.role) && ticket.reporterId !== user.id) {
    return fail("You are not allowed to attach files to this ticket.");
  }

  await prisma.attachment.create({
    data: { ticketId, uploadedById: user.id, filename, url },
  });
  return done(ticketId);
}

const ticketIdSchema = z.object({ ticketId: id });

// The reporter marks their own open ticket as resolved (no supporter involved).
export async function reporterResolveTicket(input: unknown): Promise<TicketResult> {
  const user = await requireUser();
  const parsed = ticketIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { ticketId } = parsed.data;

  return prisma.$transaction(async (tx) => {
    const before = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { reporterId: true, status: true },
    });
    if (!before) return fail("Ticket not found.");
    if (before.reporterId !== user.id) return fail("Only the reporter can do this.");

    const { count } = await tx.ticket.updateMany({
      where: {
        id: ticketId,
        status: { in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS] },
      },
      data: {
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
        resolutionType: "REPORTER",
      },
    });
    if (count === 0) return fail("Ticket is already resolved or closed.");

    await tx.ticketHistory.create({
      data: {
        ticketId,
        actorId: user.id,
        action: TicketHistoryAction.RESOLVED,
        fromStatus: before.status,
        toStatus: TicketStatus.RESOLVED,
        details: "Marked as resolved by reporter",
      },
    });
    return done(ticketId);
  });
}

// Staff or the reporter may reopen a resolved/closed ticket.
export async function reopenTicket(input: unknown): Promise<TicketResult> {
  const user = await requireUser();
  const parsed = ticketIdSchema.safeParse(input);
  if (!parsed.success) return fail("Invalid input.");
  const { ticketId } = parsed.data;

  return prisma.$transaction(async (tx) => {
    const before = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { reporterId: true, status: true, assignedSupporterId: true },
    });
    if (!before) return fail("Ticket not found.");
    if (!isStaff(user.role) && before.reporterId !== user.id) {
      return fail("You are not allowed to reopen this ticket.");
    }

    const next = before.assignedSupporterId ? TicketStatus.IN_PROGRESS : TicketStatus.NEW;
    const { count } = await tx.ticket.updateMany({
      where: {
        id: ticketId,
        status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
      data: { status: next, resolvedAt: null, closedAt: null },
    });
    if (count === 0) return fail("Only resolved or closed tickets can be reopened.");

    await tx.ticketHistory.create({
      data: {
        ticketId,
        actorId: user.id,
        action: TicketHistoryAction.REOPENED,
        fromStatus: before.status,
        toStatus: next,
      },
    });
    return done(ticketId);
  });
}
