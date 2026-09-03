"use client";

import { useEffect } from "react";

// Incrémente le compteur de vues d'une annonce, une seule fois par session
// navigateur et par bien (évite d'inflater au rafraîchissement).
export default function ViewTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const key = `oximmo:viewed:${propertyId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage indisponible → on compte quand même une fois par montage
    }
    fetch(`/api/properties/${propertyId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [propertyId]);

  return null;
}
