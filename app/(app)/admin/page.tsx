import { UserRole } from "@/src/generated/prisma/enums";
import { requireAdmin } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { prisma } from "@/src/lib/prisma";
import { PageHead } from "../_components/ui";
import {
  addLookupAction,
  changeRoleAction,
  createUserAction,
  resetPasswordAction,
  setActiveAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const sp = await searchParams;
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return (
    <main className="content">
      <PageHead
        title={t("Einstellungen", "Settings")}
        sub={t(
          "Benutzer, Kategorien und Arbeitsplätze verwalten.",
          "Manage users, categories and workplaces.",
        )}
      />
      {sp.ok && <div className="notice">{t("Gespeichert.", "Saved.")}</div>}
      {sp.error && (
        <div className="notice" role="alert">
          {sp.error}
        </div>
      )}

      <div className="card">
        <h3>{t("Benutzer erstellen", "Create user")}</h3>
        <form action={createUserAction}>
          <div className="formgrid">
            <div className="field">
              <label>Name</label>
              <input name="name" required maxLength={100} />
            </div>
            <div className="field">
              <label>E-Mail</label>
              <input name="email" type="email" required />
            </div>
            <div className="field">
              <label>
                {t("Initiales Passwort (min. 12)", "Initial password (min. 12)")}
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label>{t("Rolle", "Role")}</label>
              <select name="role" defaultValue={UserRole.REPORTER}>
                {Object.values(UserRole).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="formactions">
            <button className="btn primary" type="submit">
              {t("Erstellen", "Create")}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>
          {t("Benutzer", "Users")} ({users.length})
        </h3>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>E-Mail</th>
                <th>{t("Rolle", "Role")}</th>
                <th>{t("Aktiv", "Active")}</th>
                <th>{t("Passwort zurücksetzen", "Reset password")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <form action={changeRoleAction} className="filters">
                      <input type="hidden" name="userId" value={u.id} />
                      <select name="role" defaultValue={u.role}>
                        {Object.values(UserRole).map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                      <button className="btn" type="submit">
                        OK
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={setActiveAction}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="isActive" value={String(!u.isActive)} />
                      <button className="btn" type="submit" disabled={u.id === admin.id}>
                        {u.isActive
                          ? t("Deaktivieren", "Disable")
                          : t("Aktivieren", "Enable")}
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={resetPasswordAction} className="filters">
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        name="password"
                        type="password"
                        minLength={12}
                        maxLength={128}
                        required
                        autoComplete="new-password"
                      />
                      <button className="btn" type="submit">
                        OK
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="cards">
        {(["category", "workplace"] as const).map((kind) => (
          <div className="card" key={kind}>
            <h3>
              {kind === "category"
                ? t("Kategorie hinzufügen", "Add category")
                : t("Arbeitsplatz hinzufügen", "Add workplace")}
            </h3>
            <form action={addLookupAction} className="filters">
              <input type="hidden" name="kind" value={kind} />
              <input name="name" required maxLength={80} />
              <button className="btn primary" type="submit">
                {t("Hinzufügen", "Add")}
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
