"use client";

import { Dashboard } from "./components/Dashboard";
import { Filters } from "./components/Filters";
import { LangToggle } from "./components/LangToggle";
import { DICT } from "./i18n";
import { LangContext } from "./LangContext";
import { INK } from "./theme";
import { useLang } from "./useLang";
import { useStatsData } from "./useStatsData";
import type { Payload } from "./aggregate";

export function StatsView({ payload }: { payload: Payload }): React.JSX.Element {
  const [lang, setLang] = useLang();
  const t = DICT[lang];
  const data = useStatsData(payload);

  return (
    <main className="content">
      <LangContext.Provider value={lang}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <h1 style={{ color: INK, margin: 0 }}>{t.title}</h1>
            <LangToggle lang={lang} onChange={setLang} />
          </div>
          <Filters
            supporters={data.payload.supporters}
            bounds={data.bounds}
            from={data.from}
            to={data.to}
            selected={data.selected}
            onFrom={data.setFrom}
            onTo={data.setTo}
            onSelected={data.setSelected}
          />
          <Dashboard s={data.stats} />
        </div>
      </LangContext.Provider>
    </main>
  );
}
