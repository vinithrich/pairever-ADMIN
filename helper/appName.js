// Canonical app ids and every spelling that maps to one. Mirrors APP_ALIASES in the
// backend's src/utils/appName.js — the panel stores whichever spelling the Switch App
// screen wrote ("0", "flamez", "flirt fling"), so anything comparing against an app
// has to normalise first.
const APP_ALIASES = {
  "0": ["", "0", "pairever", "pair ever", "undefined", "null"],
  "1": ["1", "flamez"],
  "2": ["2", "bonding"],
  "3": ["3", "heylove", "hey love"],
  "4": ["4", "doly"],
  "5": ["5", "bestie", "best"],
  "8": ["8", "flirtfling", "flirt fling", "flirt-fling"],
};

const APP_LABELS = {
  "0": "Pair Ever",
  "1": "Flamez",
  "2": "Bonding",
  "3": "Heylove",
  "4": "Doly",
  "5": "Bestie",
  "8": "Flirt Fling",
};

export const normalizeAppName = (value) => {
  const name = String(value ?? "").trim().toLowerCase();
  const match = Object.keys(APP_ALIASES).find((id) =>
    APP_ALIASES[id].includes(name)
  );
  // An unregistered id passes through as itself rather than silently becoming
  // PairEver, so a new app is never mistaken for the default one.
  return match || name || "0";
};

export const appLabel = (value) => {
  const id = normalizeAppName(value);
  return APP_LABELS[id] || `App ${id}`;
};

export const readSelectedApp = () => {
  if (typeof window === "undefined") return "0";
  try {
    return normalizeAppName(localStorage.getItem("selectedAdminApp"));
  } catch {
    return "0";
  }
};
