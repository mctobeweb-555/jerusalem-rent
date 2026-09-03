"use client";

import { useCallback, useSyncExternalStore } from "react";

// Favoris sans compte : persistés dans localStorage, synchronisés entre tous les
// composants (et onglets via l'événement "storage").
const KEY = "oximmo:favorites";
const EMPTY: string[] = [];

let cache: string[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function ensureHydrated() {
  if (!hydrated && typeof window !== "undefined") {
    cache = load();
    hydrated = true;
  }
}

function notify() {
  listeners.forEach((l) => l());
}

function getSnapshot() {
  return cache;
}

// Snapshot serveur stable (aucun favori au rendu SSR → pas de mismatch).
function getServerSnapshot() {
  return EMPTY;
}

function subscribe(listener: () => void) {
  ensureHydrated();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = load();
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function toggleFavorite(id: string) {
  ensureHydrated();
  cache = cache.includes(id) ? cache.filter((x) => x !== id) : [id, ...cache];
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* quota / mode privé : on ignore */
  }
  notify();
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, has, toggle: toggleFavorite };
}
