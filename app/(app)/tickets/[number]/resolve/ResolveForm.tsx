"use client";

import { useActionState, useState } from "react";
import { resolveTicketAction, type FormState } from "../../actions";

export default function ResolveForm({
  ticketNumber,
  lang,
}: {
  ticketNumber: number;
  lang: "de" | "en";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resolveTicketAction,
    {},
  );
  const [outcome, setOutcome] = useState("action_taken");
  const t = (de: string, en: string) => (lang === "en" ? en : de);

  const radio = (value: string, label: string) => (
    <label style={{ fontWeight: 500, display: "flex", gap: 9, alignItems: "flex-start" }}>
      <input
        type="radio"
        name="outcome"
        value={value}
        checked={outcome === value}
        onChange={() => setOutcome(value)}
        style={{ width: "auto", marginTop: 3 }}
      />
      <span>{label}</span>
    </label>
  );

  return (
    <form action={action}>
      <input type="hidden" name="ticketNumber" value={ticketNumber} />
      <div className="field">
        <label>
          {t("Was ist passiert?", "What happened?")} <span className="required">*</span>
        </label>
        {radio(
          "action_taken",
          t(
            "Ich habe eine Massnahme zur Lösung des Problems durchgeführt.",
            "I took action to resolve the problem.",
          ),
        )}
        {radio(
          "external",
          t(
            "Ich habe eine externe Person oder ein anderes Team informiert.",
            "I informed an external person or team.",
          ),
        )}
        {radio(
          "self_resolved",
          t(
            "Das Problem hat sich von selbst gelöst; es war keine Massnahme nötig.",
            "The problem resolved itself; no action was needed.",
          ),
        )}
      </div>
      {outcome === "action_taken" && (
        <div className="field">
          <label>
            {t("Beschreibung der Lösung", "Resolution description")}{" "}
            <span className="required">*</span>
          </label>
          <textarea name="resolution" maxLength={700} required />
        </div>
      )}
      {outcome === "external" && (
        <>
          <div className="field">
            <label>
              {t("Informierte Person oder Team", "Person or team informed")}{" "}
              <span className="required">*</span>
            </label>
            <input name="target" maxLength={120} required />
          </div>
          <div className="field">
            <label>
              {t(
                "Welche Information hast du weitergegeben?",
                "What information did you pass on?",
              )}{" "}
              <span className="required">*</span>
            </label>
            <textarea name="info" maxLength={500} required />
          </div>
        </>
      )}
      <div className="field">
        <label>
          {t("Aufwand (Minuten, optional)", "Time spent (minutes, optional)")}
        </label>
        <input name="minutes" type="number" min={0} max={100000} />
      </div>
      <div className="notice">
        {t(
          "Beim Speichern wird das Ereignis als gelöst markiert. Es bleibt gelöst, bis es explizit geschlossen wird.",
          "The incident will be marked resolved when saved. It stays resolved until it is explicitly closed.",
        )}
      </div>
      {state.error && (
        <div className="notice" role="alert">
          {state.error}
        </div>
      )}
      <div className="formactions">
        <button className="btn primary" type="submit" disabled={pending}>
          {t("Lösung speichern", "Save resolution")}
        </button>
      </div>
    </form>
  );
}
