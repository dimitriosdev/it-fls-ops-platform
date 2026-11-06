import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { TicketStatus, UserRole } from "@/src/generated/prisma/enums";
import { prisma } from "@/src/lib/prisma";

export type SessionUser = { id: string; role: UserRole };

export const PAGE_SIZE = 50;

export const LIST_MODES = ["all", "open", "new", "resolved", "closed"] as const;
export type ListMode = (typeof LIST_MODES)[number];

const MODE_STATUS: Record<ListMode, TicketStatus[] | undefined> = {
  all: undefined,
  open: [TicketStatus.NEW, TicketStatus.IN_PROGRESS],
  new: [TicketStatus.NEW],
  resolved: [TicketStatus.RESOLVED],
  closed: [TicketStatus.CLOSED],
};

export const isStaff = (role: UserRole) =>
  role === UserRole.ADMIN || role === UserRole.SUPPORTER;

// Reporters only ever see their own tickets; staff see everything.
const scope = (user: SessionUser): Prisma.TicketWhereInput =>
  isStaff(user.role) ? {} : { reporterId: user.id };

const zurichParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Shapes tickets for the statistics dashboard; staff only (callers must gate).
export async function statsPayload() {
  const rows = await prisma.ticket.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      status: true,
      timeSpentMinutes: true,
      resolutionType: true,
      workplace: { select: { name: true } },
      category: { select: { name: true } },
      reporter: { select: { name: true } },
      assignedSupporter: { select: { name: true } },
    },
  });

  const tickets = rows.map((r) => {
    const p = Object.fromEntries(
      zurichParts.formatToParts(r.createdAt).map((x) => [x.type, x.value]),
    );
    const device =
      r.resolutionType &&
      !["ACTION_TAKEN", "EXTERNAL", "SELF_RESOLVED", "REPORTER"].includes(
        r.resolutionType,
      )
        ? [r.resolutionType]
        : [];
    return {
      date: `${p.year}-${p.month}-${p.day}`,
      wd: WEEKDAYS.indexOf(p.weekday),
      hr: Number(p.hour),
      cats: [r.category.name],
      names: device,
      dept: null,
      line: null,
      lean: null,
      role: null,
      from: r.reporter.name,
      sup: r.assignedSupporter?.name ?? null,
      resolved: r.status === TicketStatus.RESOLVED || r.status === TicketStatus.CLOSED,
      min: r.timeSpentMinutes ?? 0,
      estCat: null,
      estimated: false,
      loc: r.workplace.name,
      match: null,
    };
  });

  const supporters = [
    ...new Set(tickets.map((t) => t.sup).filter((s): s is string => !!s)),
  ].sort();
  return { generatedAt: new Date().toISOString(), supporters, tickets };
}

export const ticketListSelect = {
  id: true,
  ticketNumber: true,
  description: true,
  status: true,
  createdAt: true,
  workplace: { select: { name: true } },
  category: { select: { name: true } },
  reporter: { select: { name: true } },
  assignedSupporter: { select: { id: true, name: true } },
} satisfies Prisma.TicketSelect;

export type TicketListItem = Prisma.TicketGetPayload<{ select: typeof ticketListSelect }>;

export interface TicketFilters {
  mode: ListMode;
  q?: string;
  status?: TicketStatus;
  workplace?: string;
  category?: string;
  assignee?: string; // supporter id or "none"
  sort: "createdAt" | "ticketNumber" | "status";
  dir: "asc" | "desc";
  page: number;
}

function buildWhere(user: SessionUser, f: Omit<TicketFilters, "sort" | "dir" | "page">) {
  const and: Prisma.TicketWhereInput[] = [scope(user)];
  const statuses = MODE_STATUS[f.mode];
  if (statuses) and.push({ status: { in: statuses } });
  if (f.status) and.push({ status: f.status });
  if (f.workplace) and.push({ workplace: { name: f.workplace } });
  if (f.category) and.push({ category: { name: f.category } });
  if (f.assignee === "none") and.push({ assignedSupporterId: null });
  else if (f.assignee) and.push({ assignedSupporterId: f.assignee });
  if (f.q) {
    const num = Number.parseInt(f.q.replace(/\D/g, ""), 10);
    and.push({
      OR: [
        { description: { contains: f.q, mode: "insensitive" } },
        { reporter: { name: { contains: f.q, mode: "insensitive" } } },
        { assignedSupporter: { name: { contains: f.q, mode: "insensitive" } } },
        ...(Number.isFinite(num) ? [{ ticketNumber: num }] : []),
      ],
    });
  }
  return { AND: and } satisfies Prisma.TicketWhereInput;
}

export async function listTickets(user: SessionUser, f: TicketFilters) {
  const where = buildWhere(user, f);
  const [items, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: ticketListSelect,
      orderBy: { [f.sort]: f.dir },
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ]);
  return { items, total };
}

export async function modeCounts(user: SessionUser, assignee?: string) {
  const base = {
    AND: [scope(user), assigneeWhere(assignee)],
  } satisfies Prisma.TicketWhereInput;
  const entries = await Promise.all(
    LIST_MODES.map(async (mode) => {
      const statuses = MODE_STATUS[mode];
      const count = await prisma.ticket.count({
        where: statuses ? { AND: [base, { status: { in: statuses } }] } : base,
      });
      return [mode, count] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<ListMode, number>;
}

function assigneeWhere(assignee?: string): Prisma.TicketWhereInput {
  if (!assignee) return {};
  return assignee === "none"
    ? { assignedSupporterId: null }
    : { assignedSupporterId: assignee };
}

export async function getTicketByNumber(user: SessionUser, ticketNumber: number) {
  return prisma.ticket.findFirst({
    where: { ticketNumber, ...scope(user) },
    include: {
      workplace: { select: { name: true } },
      category: { select: { name: true } },
      reporter: { select: { id: true, name: true } },
      assignedSupporter: { select: { id: true, name: true } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      history: {
        orderBy: { occurredAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });
}

export async function lookups() {
  const [workplaces, categories, supporters] = await Promise.all([
    prisma.workplace.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: [UserRole.ADMIN, UserRole.SUPPORTER] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { workplaces, categories, supporters };
}

export async function countNewTickets() {
  return prisma.ticket.count({ where: { status: TicketStatus.NEW } });
}

export async function reporterTicketReports(reporterId: string) {
  const where = { reporterId };
  const [total, categories, workplaces] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({
      by: ["categoryId"],
      where,
      _count: { _all: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 5,
    }),
    prisma.ticket.groupBy({
      by: ["workplaceId"],
      where,
      _count: { _all: true },
      orderBy: { _count: { workplaceId: "desc" } },
      take: 5,
    }),
  ]);
  const [categoryNames, workplaceNames] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: categories.map((item) => item.categoryId) } },
      select: { id: true, name: true },
    }),
    prisma.workplace.findMany({
      where: { id: { in: workplaces.map((item) => item.workplaceId) } },
      select: { id: true, name: true },
    }),
  ]);
  const categoryNameById = new Map(categoryNames.map((item) => [item.id, item.name]));
  const workplaceNameById = new Map(workplaceNames.map((item) => [item.id, item.name]));

  return {
    total,
    topCategories: categories.map((item) => ({
      label: categoryNameById.get(item.categoryId) ?? "–",
      value: item._count._all,
    })),
    topWorkplaces: workplaces.map((item) => ({
      label: workplaceNameById.get(item.workplaceId) ?? "–",
      value: item._count._all,
    })),
  };
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function staffDashboard() {
  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const [newTickets, open, unassigned, resolvedToday, resolvedWeek] = await Promise.all([
    prisma.ticket.findMany({
      where: { status: TicketStatus.NEW },
      select: ticketListSelect,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.ticket.count({
      where: { status: { in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS] } },
    }),
    prisma.ticket.count({
      where: {
        assignedSupporterId: null,
        status: { in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS] },
      },
    }),
    prisma.ticket.count({
      where: { resolvedAt: { gte: today }, resolutionType: { not: "REPORTER" } },
    }),
    prisma.ticket.count({
      where: { resolvedAt: { gte: weekStart }, resolutionType: { not: "REPORTER" } },
    }),
  ]);
  return { newTickets, open, unassigned, resolvedToday, resolvedWeek };
}

export async function adminOverview() {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [workplaces, categories, perSupporter, recent] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["workplaceId"],
      _count: { _all: true },
      orderBy: { _count: { workplaceId: "desc" } },
      take: 8,
    }),
    prisma.ticket.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 10,
    }),
    prisma.ticket.groupBy({
      by: ["assignedSupporterId"],
      where: { status: { in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS] } },
      _count: { _all: true },
    }),
    prisma.ticket.findMany({
      where: { createdAt: { gte: since } },
      select: ticketListSelect,
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const [wps, cats, users] = await Promise.all([
    prisma.workplace.findMany({
      where: { id: { in: workplaces.map((w) => w.workplaceId) } },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { id: { in: categories.map((c) => c.categoryId) } },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: {
        id: {
          in: perSupporter.flatMap((s) =>
            s.assignedSupporterId ? [s.assignedSupporterId] : [],
          ),
        },
      },
      select: { id: true, name: true },
    }),
  ]);
  const name = (
    list: { id: string; name: string }[],
    id: string | null,
    fallback: string,
  ) => list.find((x) => x.id === id)?.name ?? fallback;
  return {
    topWorkplaces: workplaces.map((w) => ({
      label: name(wps, w.workplaceId, "?"),
      value: w._count._all,
    })),
    topCategories: categories.map((c) => ({
      label: name(cats, c.categoryId, "?"),
      value: c._count._all,
    })),
    openBySupporter: perSupporter
      .map((s) => ({
        label: name(users, s.assignedSupporterId, ""),
        value: s._count._all,
        unassigned: !s.assignedSupporterId,
      }))
      .sort((a, b) => b.value - a.value),
    recent,
  };
}
