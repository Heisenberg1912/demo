const envBase = import.meta.env.VITE_VITRUVI_API_BASE;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const normalise = (value) => (value && typeof value === "string" ? value.trim() : "");

let base = normalise(envBase);

if (!base && normalise(apiBaseUrl)) {
  const cleaned = normalise(apiBaseUrl).replace(/\/$/, "");
  base = /\/vitruvi($|\/)/i.test(cleaned) ? cleaned : `${cleaned}/vitruvi`;
}

if (!base) {
  if (import.meta.env.DEV) {
    base = "/api/vitruvi";
  } else if (typeof window !== "undefined") {
    base = "/api/vitruvi";
  }
}

const normalisedBase = base.replace(/\/$/, "");

export const API_BASE = normalisedBase;
