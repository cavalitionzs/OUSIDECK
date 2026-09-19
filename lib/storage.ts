"use client";

import type { ConnectionSettings, DeckKeyConfig } from "./types";

const CONNECTION_KEY = "obs-deck:connection";
const KEYS_KEY = "obs-deck:keys";

export function loadConnectionSettings(): ConnectionSettings {
  if (typeof window === "undefined") return { url: "", password: "" };
  try {
    const raw = window.localStorage.getItem(CONNECTION_KEY);
    if (!raw) return { url: "", password: "" };
    return JSON.parse(raw);
  } catch {
    return { url: "", password: "" };
  }
}

export function saveConnectionSettings(settings: ConnectionSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONNECTION_KEY, JSON.stringify(settings));
}

export function loadDeckKeys(): DeckKeyConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEYS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDeckKeys(keys: DeckKeyConfig[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS_KEY, JSON.stringify(keys));
}
