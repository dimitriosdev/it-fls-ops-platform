"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  assignTicket,
  closeTicket,
  createTicket,
  reopenTicket,
  reporterResolveTicket,
  resolveTicket,
  type TicketResult,
} from "@/src/server/tickets";
import { requireUser } from "@/src/lib/auth/authorization";
import { prisma } from "@/src/lib/prisma";

export type FormState = { error?: string };

const numberSchema = z.coerce.number().int().positive();

async function idForNumber(raw: FormDataEntryValue | null) {
  const parsed = numberSchema.safeParse(raw);
  if (!parsed.success) return null;
  const ticket = await prisma.ticket.findUnique({
    where: { ticketNumber: parsed.data },
    select: { id: true, ticketNumber: true },
  });
  return ticket;
}

function back(ticketNumber: number, result: TicketResult): never {
  const suffix = result.ok ? "" : `?error=${encodeURIComponent(result.error)}`;
  redirect(`/tickets/${ticketNumber}${suffix}`);
}

export async function createTicketAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await createTicket({
    workplace: formData.get("workplace"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!result.ok) return { error: result.error };
  redirect(`/tickets/${result.ticketNumber}`);
}

// Simple one-button actions: take over, reporter resolve, close, reopen.
export async function ticketQuickAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const ticket = await idForNumber(formData.get("ticketNumber"));
  if (!ticket) redirect("/tickets");
  const kind = formData.get("kind");

  let result: TicketResult;
  switch (kind) {
    case "takeover":
      result = await assignTicket({ ticketId: ticket.id, supporterId: user.id });
      break;
    case "reporter-resolve":
      result = await reporterResolveTicket({ ticketId: ticket.id });
      break;
    case "close":
      result = await closeTicket({ ticketId: ticket.id });
      break;
    case "reopen":
      result = await reopenTicket({ ticketId: ticket.id });
      break;
    default:
      result = { ok: false, error: "Unknown action." };
  }
  back(ticket.ticketNumber, result);
}

export async function assignAction(formData: FormData): Promise<void> {
  const ticket = await idForNumber(formData.get("ticketNumber"));
  if (!ticket) redirect("/tickets");
  back(
    ticket.ticketNumber,
    await assignTicket({ ticketId: ticket.id, supporterId: formData.get("supporterId") }),
  );
}

export async function resolveTicketAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ticket = await idForNumber(formData.get("ticketNumber"));
  if (!ticket) return { error: "Ticket not found." };

  const outcome = String(formData.get("outcome"));
  const minutesRaw = String(formData.get("minutes") ?? "").trim();
  const timeSpentMinutes = minutesRaw ? Number.parseInt(minutesRaw, 10) : undefined;
  const target = String(formData.get("target") ?? "").trim();
  const info = String(formData.get("info") ?? "").trim();
  const description = String(formData.get("resolution") ?? "").trim();

  let input: Record<string, unknown>;
  if (outcome === "external") {
    if (!target || !info) return { error: "Person/team and information are required." };
    input = {
      resolutionType: "EXTERNAL",
      resolutionText: `External person/team informed: ${target} — ${info}`,
      externalFollowup: true,
      externalPerson: target,
      externalNotes: info,
    };
  } else if (outcome === "self_resolved") {
    input = {
      resolutionType: "SELF_RESOLVED",
      resolutionText: "The problem resolved itself; no action was needed.",
    };
  } else {
    if (!description) return { error: "Resolution description is required." };
    input = { resolutionType: "ACTION_TAKEN", resolutionText: description };
  }

  const result = await resolveTicket({ ticketId: ticket.id, timeSpentMinutes, ...input });
  if (!result.ok) return { error: result.error };
  redirect(`/tickets/${ticket.ticketNumber}`);
}
