import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TicketHistoryAction,
  TicketStatus,
  UserRole,
} from "../src/generated/prisma/enums";
import { prisma } from "../src/lib/prisma";

interface SourceTicket {
  messageId: string;
  created: string;
  reporter: string;
  subject: string;
  body: string;
  resolvedBy: string;
  resolvedAt: string;
  workplace: string | null;
  category: string | null;
  device: string | null;
  problem: string;
  resolution: string | null;
  minutes: number | null;
}

const UNKNOWN_WORKPLACE = "Unknown";
const UNKNOWN_CATEGORY = "Other";
const EMAIL_DOMAIN = "digitecgalaxus.ch";
const dryRun = process.argv.includes("--dry");

// Email is derived as first.last@digitecgalaxus.ch because the source data has no addresses.
function nameToEmail(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.-]/g, "");
  return `${slug}@${EMAIL_DOMAIN}`;
}

async function main() {
  const rows: SourceTicket[] = JSON.parse(
    readFileSync(
      join(process.cwd(), "prisma", "data", "tickets-since-2026-09.json"),
      "utf8",
    ),
  );
  rows.sort((a, b) => a.created.localeCompare(b.created));

  const supporters = new Set(rows.map((r) => r.resolvedBy.trim()));
  const reporters = new Set(rows.map((r) => r.reporter.trim()));
  const workplaces = new Set(rows.map((r) => r.workplace?.trim() || UNKNOWN_WORKPLACE));
  const categories = new Set(rows.map((r) => r.category?.trim() || UNKNOWN_CATEGORY));

  console.log(
    `${rows.length} tickets, ${reporters.size} reporters, ${supporters.size} supporters, ` +
      `${workplaces.size} workplaces, ${categories.size} categories`,
  );
  if (dryRun) {
    console.log("Dry run: nothing written.");
    return;
  }

  // Existing users (e.g. the seeded admin) are matched by name and never modified.
  const existing = await prisma.user.findMany({ select: { id: true, name: true } });
  const idByName = new Map(existing.map((u) => [u.name, u.id]));

  const newUsers = [...new Set([...supporters, ...reporters])]
    .filter((name) => !idByName.has(name))
    .map((name) => ({
      name,
      email: nameToEmail(name),
      role: supporters.has(name) ? UserRole.SUPPORTER : UserRole.REPORTER,
    }));
  await prisma.user.createMany({ data: newUsers, skipDuplicates: true });
  await prisma.workplace.createMany({
    data: [...workplaces].map((name) => ({ name })),
    skipDuplicates: true,
  });
  await prisma.category.createMany({
    data: [...categories].map((name) => ({ name })),
    skipDuplicates: true,
  });

  const [users, wps, cats, imported] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true } }),
    prisma.workplace.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.ticket.findMany({
      where: { sourceMessageId: { not: null } },
      select: { sourceMessageId: true },
    }),
  ]);
  const userId = new Map(users.map((u) => [u.name, u.id]));
  // Also match by derived email so the seeded admin ("Dimitrios") owns "Dimitrios Metozis" rows.
  const idByEmail = new Map(users.map((u) => [u.email, u.id]));
  for (const name of [...supporters, ...reporters]) {
    const byEmail = idByEmail.get(nameToEmail(name));
    if (!userId.has(name) && byEmail) userId.set(name, byEmail);
  }
  const workplaceId = new Map(wps.map((w) => [w.name, w.id]));
  const categoryId = new Map(cats.map((c) => [c.name, c.id]));
  const alreadyImported = new Set(imported.map((t) => t.sourceMessageId));

  // Backfill time spent on tickets imported before the column existed.
  const withMinutes = rows.filter(
    (r) => alreadyImported.has(r.messageId) && r.minutes !== null,
  );
  for (const r of withMinutes) {
    await prisma.ticket.updateMany({
      where: { sourceMessageId: r.messageId, timeSpentMinutes: null },
      data: { timeSpentMinutes: r.minutes },
    });
  }

  // Backfill assignee on tickets imported before the name/email matching existed.
  for (const r of rows.filter((r) => alreadyImported.has(r.messageId))) {
    const supporterId = userId.get(r.resolvedBy.trim());
    if (!supporterId) continue;
    const t = await prisma.ticket.findFirst({
      where: { sourceMessageId: r.messageId, assignedSupporterId: null },
      select: { id: true },
    });
    if (!t) continue;
    await prisma.ticket.update({
      where: { id: t.id },
      data: { assignedSupporterId: supporterId },
    });
    await prisma.ticketHistory.updateMany({
      where: {
        ticketId: t.id,
        actorId: null,
        action: { in: ["ASSIGNED", "RESOLVED", "CLOSED"] },
      },
      data: { actorId: supporterId },
    });
  }

  const todo = rows.filter((r) => !alreadyImported.has(r.messageId));
  const data = todo.map((r) => {
    const resolved = new Date(r.resolvedAt);
    return {
      sourceMessageId: r.messageId,
      reporterId: userId.get(r.reporter.trim())!,
      assignedSupporterId: userId.get(r.resolvedBy.trim())!,
      workplaceId: workplaceId.get(r.workplace?.trim() || UNKNOWN_WORKPLACE)!,
      categoryId: categoryId.get(r.category?.trim() || UNKNOWN_CATEGORY)!,
      description: [r.subject, r.body].filter(Boolean).join("\n\n").slice(0, 5000),
      status: TicketStatus.CLOSED,
      resolutionType: r.device ? r.device.slice(0, 120) : "Imported",
      resolutionText: r.resolution,
      timeSpentMinutes: r.minutes,
      createdAt: new Date(r.created),
      resolvedAt: resolved,
      closedAt: resolved,
    };
  });

  // Inserted in chronological order so autoincrement ticket numbers follow creation time.
  await prisma.ticket.createMany({ data, skipDuplicates: true });

  const created = await prisma.ticket.findMany({
    where: { sourceMessageId: { in: todo.map((r) => r.messageId) } },
    select: {
      id: true,
      sourceMessageId: true,
      reporterId: true,
      assignedSupporterId: true,
    },
  });
  const byMessage = new Map(created.map((t) => [t.sourceMessageId, t]));

  const history = todo.flatMap((r) => {
    const t = byMessage.get(r.messageId);
    if (!t) return [];
    const createdAt = new Date(r.created);
    const resolvedAt = new Date(r.resolvedAt);
    return [
      {
        ticketId: t.id,
        actorId: t.reporterId,
        action: TicketHistoryAction.CREATED,
        toStatus: TicketStatus.NEW,
        occurredAt: createdAt,
      },
      {
        ticketId: t.id,
        actorId: t.assignedSupporterId,
        action: TicketHistoryAction.ASSIGNED,
        details: `Assigned to ${r.resolvedBy}`,
        occurredAt: createdAt,
      },
      {
        ticketId: t.id,
        actorId: t.assignedSupporterId,
        action: TicketHistoryAction.RESOLVED,
        fromStatus: TicketStatus.NEW,
        toStatus: TicketStatus.RESOLVED,
        occurredAt: resolvedAt,
      },
      {
        ticketId: t.id,
        actorId: t.assignedSupporterId,
        action: TicketHistoryAction.CLOSED,
        fromStatus: TicketStatus.RESOLVED,
        toStatus: TicketStatus.CLOSED,
        occurredAt: resolvedAt,
      },
    ];
  });
  await prisma.ticketHistory.createMany({ data: history });

  console.log(
    `Imported ${created.length} tickets (${rows.length - todo.length} already present), ${history.length} history entries.`,
  );
}

main()
  .catch((error) => {
    console.error(
      "Ticket import failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
