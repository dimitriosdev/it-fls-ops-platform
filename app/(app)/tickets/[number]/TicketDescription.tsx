"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { updateReporterTicketDetailsAction, type FormState } from "../actions";

export default function TicketDescription({
  ticketNumber,
  description,
  workplace,
  category,
  lang,
  editable,
  children,
}: {
  ticketNumber: number;
  description: string;
  workplace: string;
  category: string;
  lang: "de" | "en";
  editable: boolean;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateReporterTicketDetailsAction,
    {},
  );
  const t = (de: string, en: string) => (lang === "en" ? en : de);

  return (
    <>
      <div className="ticket-description-heading">
        <h2>{t("Beschreibung & Ticketdetails", "Description & ticket details")}</h2>
        {editable && !editing && (
          <button
            className="btn ticket-edit-button"
            type="button"
            onClick={() => setEditing(true)}
          >
            {t("Bearbeiten", "Edit")}
          </button>
        )}
      </div>
      {editing ? (
        <form action={action} className="ticket-description-form">
          <input type="hidden" name="ticketNumber" value={ticketNumber} />
          <label className="ticket-edit-field">
            {t("Beschreibung", "Description")}
            <textarea
              key={description}
              name="description"
              defaultValue={description}
              minLength={5}
              maxLength={5000}
              required
            />
          </label>
          <div className="ticket-edit-grid">
            <label className="ticket-edit-field">
              {t("Arbeitsplatz", "Workplace")}
              <input name="workplace" defaultValue={workplace} maxLength={200} required />
            </label>
            <label className="ticket-edit-field">
              {t("Kategorie", "Category")}
              <input name="category" defaultValue={category} maxLength={120} required />
            </label>
          </div>
          {state.error && (
            <p className="ticket-edit-error" role="alert">
              {state.error}
            </p>
          )}
          <div className="ticket-edit-actions">
            <button
              className="btn"
              type="button"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              {t("Abbrechen", "Cancel")}
            </button>
            <button className="btn primary" type="submit" disabled={pending}>
              {pending ? t("Speichern …", "Saving …") : t("Speichern", "Save")}
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="ticket-description">{description}</p>
          {children}
        </>
      )}
    </>
  );
}
