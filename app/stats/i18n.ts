export type Lang = "de" | "en";

type Dict = {
  title: string;
  statistics: string;
  enterPin: string;
  unlock: string;
  checking: string;
  wrongPin: string;
  loadError: string;
  from: string;
  to: string;
  reset: string;
  resolvedBy: string;
  totalTickets: string;
  totalSupportTime: string;
  ticketsPerDay: string;
  hoursUnit: string;
  minUnit: string;
  secTimeTrends: string;
  secDevices: string;
  secLocation: string;
  secPeople: string;
  secResolution: string;
  secQuality: string;
  ticketsPerMonth: string;
  cumulative: string;
  heatmap: string;
  deviceCategory: string;
  topDevices: string;
  productionLine: string;
  department: string;
  role: string;
  topReporters: string;
  resolvedBySupporter: string;
  avgPerSupporter: string;
  distribution: string;
  medianByCategory: string;
  docVsEst: string;
  locIdent: string;
  supportMatch: string;
  days: string[];
  // Translations of data values that come from the export in English.
  labels: Record<string, string>;
};

export const DICT: Record<Lang, Dict> = {
  de: {
    title: "IT-Support Statistiken",
    statistics: "Statistiken",
    enterPin: "PIN eingeben, um fortzufahren",
    unlock: "Entsperren",
    checking: "Prüfe…",
    wrongPin: "Falscher PIN.",
    loadError: "Statistiken konnten nicht geladen werden.",
    from: "Von",
    to: "Bis",
    reset: "Zurücksetzen",
    resolvedBy: "Gelöst von:",
    totalTickets: "Tickets gesamt",
    totalSupportTime: "Supportzeit gesamt",
    ticketsPerDay: "Tickets / Tag",
    hoursUnit: "Std.",
    minUnit: "Min.",
    secTimeTrends: "Zeitliche Entwicklung",
    secDevices: "Geräte",
    secLocation: "Standort",
    secPeople: "Personen",
    secResolution: "Lösungszeit",
    secQuality: "Datenqualität",
    ticketsPerMonth: "Tickets pro Monat",
    cumulative: "Tickets kumuliert",
    heatmap: "Wochentag × Stunde (Europe/Zurich)",
    deviceCategory: "Tickets nach Gerätekategorie",
    topDevices: "Häufigste Geräte",
    productionLine: "Produktionslinie",
    department: "Abteilung",
    role: "Rolle",
    topReporters: "Häufigste Melder",
    resolvedBySupporter: "Gelöste Tickets pro Supporter",
    avgPerSupporter: "Ø Lösungszeit pro Supporter (Min.)",
    distribution: "Verteilung (Minuten pro Ticket)",
    medianByCategory: "Median-Minuten nach Gerätekategorie",
    docVsEst: "Dokumentierte vs. geschätzte Zeit",
    locIdent: "Standorterkennung",
    supportMatch: "Zuordnung Support-Eintrag",
    days: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    labels: {
      computer: "Computer",
      printer: "Drucker",
      display: "Bildschirm",
      scanner: "Scanner",
      network: "Netzwerk",
      input: "Eingabegeräte",
      other: "Andere",
      software: "Software",
      documented: "Dokumentiert",
      Documented: "Dokumentiert",
      Estimated: "Geschätzt",
      Identified: "Erkannt",
      "Partially Identified": "Teilweise erkannt",
      Unknown: "Unbekannt",
      Matched: "Zugeordnet",
      "Manual review required": "Manuelle Prüfung nötig",
      "No reliable match": "Keine verlässliche Zuordnung",
    },
  },
  en: {
    title: "IT Support Statistics",
    statistics: "Statistics",
    enterPin: "Enter PIN to continue",
    unlock: "Unlock",
    checking: "Checking…",
    wrongPin: "Incorrect PIN.",
    loadError: "Could not load statistics.",
    from: "From",
    to: "To",
    reset: "Reset",
    resolvedBy: "Resolved by:",
    totalTickets: "Total tickets",
    totalSupportTime: "Total support time",
    ticketsPerDay: "Tickets / day",
    hoursUnit: "h",
    minUnit: "min",
    secTimeTrends: "Time trends",
    secDevices: "Devices",
    secLocation: "Location",
    secPeople: "People",
    secResolution: "Resolution time",
    secQuality: "Data quality",
    ticketsPerMonth: "Tickets per month",
    cumulative: "Cumulative tickets",
    heatmap: "Weekday × hour (Europe/Zurich)",
    deviceCategory: "Tickets by device category",
    topDevices: "Top devices",
    productionLine: "Production line",
    department: "Department",
    role: "Role",
    topReporters: "Top reporters",
    resolvedBySupporter: "Tickets resolved by supporter",
    avgPerSupporter: "Avg resolution time per supporter (min)",
    distribution: "Distribution (minutes per ticket)",
    medianByCategory: "Median minutes by device category",
    docVsEst: "Documented vs estimated time",
    locIdent: "Location identification",
    supportMatch: "Support record match",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    labels: {
      computer: "Computer",
      printer: "Printer",
      display: "Display",
      scanner: "Scanner",
      network: "Network",
      input: "Input devices",
      other: "Other",
      software: "Software",
      documented: "Documented",
      Documented: "Documented",
      Estimated: "Estimated",
      Identified: "Identified",
      "Partially Identified": "Partially identified",
      Unknown: "Unknown",
      Matched: "Matched",
      "Manual review required": "Manual review required",
      "No reliable match": "No reliable match",
    },
  },
};
