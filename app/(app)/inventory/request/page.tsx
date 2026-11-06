import Link from "next/link";
import { InventoryOrderStatus, UserRole } from "@/src/generated/prisma/enums";
import { requireSupporter } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { prisma } from "@/src/lib/prisma";
import { INVENTORY_ITEMS } from "@/src/server/inventory-catalog";
import { PageHead } from "../../_components/ui";
import { createInventoryOrder, reviewInventoryOrder } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  item?: string;
  submitted?: string;
  reviewed?: string;
  error?: string;
};

function orderStatusLabel(status: InventoryOrderStatus, lang: "de" | "en") {
  const labels: Record<InventoryOrderStatus, { de: string; en: string }> = {
    PENDING: { de: "Ausstehend", en: "Pending" },
    APPROVED: { de: "Genehmigt", en: "Approved" },
    REJECTED: { de: "Abgelehnt", en: "Rejected" },
  };
  return labels[status][lang];
}

export default async function InventoryRequestPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireSupporter();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const params = await searchParams;
  const selectedItem = INVENTORY_ITEMS.some((item) => item.id === params.item)
    ? params.item
    : "";
  const orders = await prisma.inventoryOrder.findMany({
    where: user.role === UserRole.ADMIN ? undefined : { requesterId: user.id },
    include: {
      requester: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const hasPending = orders.some(
    (order) => order.status === InventoryOrderStatus.PENDING,
  );

  return (
    <main className="content inventory-request-page">
      <PageHead
        title={t("Bestellung anfragen", "Request an order")}
        sub={t(
          "Deine Anfrage wird vor der Bestellung von einem Admin geprüft.",
          "An admin reviews your request before an order is placed.",
        )}
        back={{ href: "/inventory", label: t("Inventar", "Inventory") }}
      />
      {params.submitted && (
        <div className="notice" role="status">
          {t(
            "Anfrage gesendet. Ein Admin wird sie prüfen.",
            "Request submitted. An admin will review it.",
          )}
        </div>
      )}
      {params.reviewed && (
        <div className="notice" role="status">
          {t("Entscheidung gespeichert.", "Review decision saved.")}
        </div>
      )}
      {params.error && (
        <div className="notice" role="alert">
          {params.error === "item"
            ? t("Artikel nicht gefunden.", "Item not found.")
            : params.error === "reviewed"
              ? t(
                  "Diese Anfrage wurde bereits geprüft.",
                  "This request was already reviewed.",
                )
              : t("Bitte prüfe deine Eingaben.", "Please check your entries.")}
        </div>
      )}

      <section className="card inventory-order-form-card">
        <h2>{t("Neue Anfrage", "New request")}</h2>
        <form action={createInventoryOrder} className="inventory-order-form">
          <label>
            {t("Artikel", "Item")}
            <select name="itemId" defaultValue={selectedItem} required>
              <option value="" disabled>
                {t("Artikel auswählen", "Select an item")}
              </option>
              {INVENTORY_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {t("Bestand", "Stock")}: {item.stock}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Menge", "Quantity")}
            <input
              name="quantity"
              type="number"
              min={1}
              max={500}
              defaultValue={1}
              required
            />
          </label>
          <label className="inventory-order-wide">
            {t("Geschäftlicher Grund", "Business reason")}
            <textarea name="businessReason" minLength={5} maxLength={2000} required />
          </label>
          <label className="inventory-order-wide">
            {t("Zusätzliche Hinweise (optional)", "Additional notes (optional)")}
            <textarea name="notes" maxLength={2000} rows={3} />
          </label>
          <div className="inventory-order-wide inventory-order-submit">
            <button className="btn primary" type="submit">
              {t("Anfrage zur Prüfung senden", "Submit for review")}
            </button>
          </div>
        </form>
      </section>

      <section className="inventory-orders-section">
        <div className="inventory-orders-heading">
          <div>
            <h2>
              {user.role === UserRole.ADMIN
                ? t("Bestellanfragen", "Order requests")
                : t("Meine Anfragen", "My requests")}
            </h2>
            <p className="sub">
              {user.role === UserRole.ADMIN && hasPending
                ? t(
                    "Ausstehende Anfragen benötigen eine Entscheidung.",
                    "Pending requests need a decision.",
                  )
                : t(
                    "Status und Rückmeldung zu den Anfragen.",
                    "Status and feedback for your requests.",
                  )}
            </p>
          </div>
          {user.role === UserRole.ADMIN && hasPending && (
            <span className="inventory-pending-count">
              {
                orders.filter((order) => order.status === InventoryOrderStatus.PENDING)
                  .length
              }{" "}
              {t("ausstehend", "pending")}
            </span>
          )}
        </div>
        {orders.length === 0 ? (
          <div className="empty">
            {t("Noch keine Anfragen vorhanden.", "No requests yet.")}
          </div>
        ) : (
          <div className="inventory-orders">
            {orders.map((order) => (
              <article className="card inventory-order" key={order.id}>
                <div className="inventory-order-header">
                  <div>
                    <span className="inventory-order-item">{order.itemName}</span>
                    <span
                      className={`inventory-order-status ${order.status.toLowerCase()}`}
                    >
                      {orderStatusLabel(order.status, lang)}
                    </span>
                  </div>
                  <time dateTime={order.createdAt.toISOString()}>
                    {order.createdAt.toLocaleDateString(
                      lang === "de" ? "de-CH" : "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )}
                  </time>
                </div>
                {user.role === UserRole.ADMIN && (
                  <p className="inventory-order-requester">
                    {order.requester.name} · {order.requester.email}
                  </p>
                )}
                <dl className="inventory-order-facts">
                  <div>
                    <dt>{t("Menge", "Quantity")}</dt>
                    <dd>{order.quantity}</dd>
                  </div>
                  <div>
                    <dt>{t("Geschäftlicher Grund", "Business reason")}</dt>
                    <dd>{order.businessReason}</dd>
                  </div>
                  {order.notes && (
                    <div>
                      <dt>{t("Hinweise", "Notes")}</dt>
                      <dd>{order.notes}</dd>
                    </div>
                  )}
                  {order.reviewComment && (
                    <div>
                      <dt>{t("Admin-Rückmeldung", "Admin feedback")}</dt>
                      <dd>{order.reviewComment}</dd>
                    </div>
                  )}
                </dl>
                {order.reviewedBy && (
                  <p className="inventory-reviewer">
                    {t("Geprüft von", "Reviewed by")} {order.reviewedBy.name}
                  </p>
                )}
                {user.role === UserRole.ADMIN &&
                  order.status === InventoryOrderStatus.PENDING && (
                    <form action={reviewInventoryOrder} className="inventory-review-form">
                      <input type="hidden" name="orderId" value={order.id} />
                      <textarea
                        name="reviewComment"
                        aria-label={t(
                          "Kommentar zur Entscheidung (optional)",
                          "Decision comment (optional)",
                        )}
                        placeholder={t("Kommentar (optional)", "Comment (optional)")}
                        maxLength={2000}
                        rows={2}
                      />
                      <div>
                        <button
                          className="btn primary"
                          name="decision"
                          value="APPROVED"
                          type="submit"
                        >
                          {t("Genehmigen", "Approve")}
                        </button>
                        <button
                          className="btn"
                          name="decision"
                          value="REJECTED"
                          type="submit"
                        >
                          {t("Ablehnen", "Reject")}
                        </button>
                      </div>
                    </form>
                  )}
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="inventory-back-link">
        <Link href="/inventory">{t("Zurück zum Inventar", "Back to inventory")}</Link>
      </div>
    </main>
  );
}
