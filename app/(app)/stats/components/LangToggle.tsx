import type { Lang } from "../i18n";
import { ACCENT, INK, LINE } from "../theme";

export function LangToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div style={{ display: "inline-flex", gap: 4 }}>
      {(["de", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            border: `1px solid ${lang === l ? ACCENT : LINE}`,
            background: lang === l ? ACCENT : "#fff",
            color: lang === l ? "#fff" : INK,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
