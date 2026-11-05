"use client";

import { useActionState } from "react";
import { createTicketAction, type FormState } from "../actions";

export default function NewTicketForm({
  workplaces,
  categories,
  lang,
}: {
  workplaces: string[];
  categories: string[];
  lang: "de" | "en";
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createTicketAction,
    {},
  );
  const t = (de: string, en: string) => (lang === "en" ? en : de);

  return (
    <form action={action}>
      <div className="formgrid">
        <div className="field">
          <label>
            {t("Arbeitsplatz / Ort", "Workplace / location")}{" "}
            <span className="required">*</span>
          </label>
          <input
            name="workplace"
            list="workplaceList"
            required
            autoComplete="off"
            maxLength={80}
          />
          <datalist id="workplaceList">
            {workplaces.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>
            {t("Kategorie", "Category")} <span className="required">*</span>
          </label>
          <input
            name="category"
            list="categoryList"
            required
            autoComplete="off"
            maxLength={80}
          />
          <datalist id="categoryList">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="field">
        <label>
          {t("Problembeschreibung", "Problem description")}{" "}
          <span className="required">*</span>
        </label>
        <textarea
          name="description"
          required
          minLength={5}
          maxLength={500}
          placeholder={t(
            "Bitte beschreibe das Problem so genau wie möglich …",
            "Please describe the problem as precisely as possible …",
          )}
        />
      </div>
      {state.error && (
        <div className="notice" role="alert">
          {state.error}
        </div>
      )}
      <div className="formactions">
        <button className="btn primary" type="submit" disabled={pending}>
          {t("Ereignis erstellen", "Create incident")}
        </button>
      </div>
    </form>
  );
}
