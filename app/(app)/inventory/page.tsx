import Link from "next/link";
import { requireSupporter } from "@/src/lib/auth/authorization";
import { getLang, pick } from "@/src/lib/i18n";
import { INVENTORY_ITEMS, INVENTORY_LOCATION } from "@/src/server/inventory-catalog";
import { PageHead } from "../_components/ui";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  await requireSupporter();
  const lang = await getLang();
  const t = (de: string, en: string) => pick(lang, de, en);
  const lowStock = INVENTORY_ITEMS.filter(
    (item) => item.minimum !== null && item.stockCount < item.minimum,
  ).length;

  return (
    <main className="content inventory-page">
      <PageHead
        title={t("Inventar", "Inventory")}
        sub={t(
          "Bestand und Mindestbestand der IT-Ausrüstung.",
          "Current and minimum stock of IT equipment.",
        )}
        action={
          <Link className="btn primary" href="/inventory/request">
            {t("Bestellung anfragen", "Request an order")}
          </Link>
        }
      />
      <div className="inventory-location">
        <span className="inventory-location-icon" aria-hidden="true">
          ⌖
        </span>
        <div>
          <strong>{t("Lagerort", "Storage location")}</strong>
          <p>{INVENTORY_LOCATION}</p>
        </div>
      </div>
      <div className="inventory-summary">
        <span>
          {INVENTORY_ITEMS.length} {t("Artikel", "items")}
        </span>
        <span>
          {lowStock} {t("unter Mindestbestand", "below minimum stock")}
        </span>
      </div>
      <div className="inventory-grid">
        {INVENTORY_ITEMS.map((item) => {
          const low = item.minimum !== null && item.stockCount < item.minimum;
          const unavailable = item.stockCount === 0;
          return (
            <article className="card inventory-item" key={item.id}>
              <div className="inventory-item-top">
                <span className="inventory-category">{item.category}</span>
                <span
                  className={`inventory-status${unavailable ? " unavailable" : low ? " low" : ""}`}
                >
                  {unavailable
                    ? t("Nicht verfügbar", "Unavailable")
                    : low
                      ? t("Niedriger Bestand", "Low stock")
                      : t("Verfügbar", "Available")}
                </span>
              </div>
              <h2>{item.name}</h2>
              <p className="inventory-description">{item.description}</p>
              <dl className="inventory-facts">
                <div>
                  <dt>{t("Bestand", "In stock")}</dt>
                  <dd>{item.stock}</dd>
                </div>
                <div>
                  <dt>{t("Mindestbestand", "Minimum stock")}</dt>
                  <dd>{item.minimum ?? "–"}</dd>
                </div>
              </dl>
              <Link
                className="inventory-request-link"
                href={`/inventory/request?item=${encodeURIComponent(item.id)}`}
              >
                {t("Artikel anfragen", "Request item")} <span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
