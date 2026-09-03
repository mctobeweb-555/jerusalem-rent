"use client";

import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatSurface } from "@/lib/utils";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type Bbox = {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
};

export type MapMarker = {
  id: string;
  slug: string;
  title: string;
  price: number;
  priceHidden?: boolean;
  status: string;
  city: string;
  image: string | null;
  lat: number;
  lng: number;
  surface: number;
  rooms: number | null;
  bedrooms: number | null;
  maxGuests: number | null;
  reviewStats: { average: number; count: number } | null;
};

// Prix compact pour l'étiquette du marqueur (ex. "429 k€", "1,25 M€").
function compactPrice(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1_000_000) {
    return `${(euros / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M€`;
  }
  if (euros >= 10_000) {
    return `${Math.round(euros / 1000)} k€`;
  }
  return `${Math.round(euros).toLocaleString("fr-FR")} €`;
}

// Icône "maison" (même tracé que components/icons/index.tsx::HouseIcon, pour
// rester cohérent avec le reste du site) — affichée à la place du texte
// "Prix sur demande" sur l'étiquette de la carte : trop long pour une
// pastille compacte, plus lisible et plus "beau" qu'un simple pictogramme
// générique (retour utilisateur).
const HOUSE_ICON =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"></path><path d="M5.5 10v9a1 1 0 0 0 1 1H9v-5h6v5h2.5a1 1 0 0 0 1-1v-9"></path></svg>';

// Marqueur en forme de pastille de prix (divIcon → aucune image externe,
// compatible CSP stricte). Si le prix est masqué, affiche une icône plutôt
// qu'un libellé texte (trop long pour la pastille).
function priceIcon(cents: number, rent: boolean, priceOnRequestShort: string, hidden?: boolean): L.DivIcon {
  const html = hidden
    ? `<span class="oximmo-pill oximmo-pill-icon" role="img" aria-label="${priceOnRequestShort}">${HOUSE_ICON}</span>`
    : `<span class="oximmo-pill">${compactPrice(cents)}${rent ? "/m" : ""}</span>`;
  return L.divIcon({
    className: "oximmo-price-marker",
    html,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Contenu HTML de la bulle au clic sur un marqueur — construit à la main
// (pas de <Popup> react-leaflet ici : les marqueurs sont ajoutés de façon
// impérative au groupe de clusters, cf. ClusteredMarkers). Les classes
// Tailwind utilisées ci-dessous sont bien générées au build : le scanner de
// Tailwind lit le contenu texte de ce fichier .tsx, peu importe qu'elles
// finissent dans une chaîne HTML plutôt que du JSX.
function buildPopupHtml(
  m: MapMarker,
  locale: Locale,
  dict: Dictionary,
): string {
  const rent = m.status === "FOR_RENT" || m.status === "RENTED";
  const isShortTerm = m.status === "SHORT_TERM";
  const specs = (
    isShortTerm
      ? [
          formatSurface(m.surface),
          m.bedrooms != null ? `${m.bedrooms} ${dict.property.specs.bedroomsShort}` : null,
          m.maxGuests != null ? `${m.maxGuests} ${dict.property.specs.guestsShort}` : null,
        ]
      : [
          formatSurface(m.surface),
          m.rooms ? `${m.rooms} ${dict.property.specs.roomsShort}` : null,
        ]
  )
    .filter(Boolean)
    .join(" · ");

  const priceHtml = m.priceHidden
    ? dict.property.priceOnRequest
    : `${formatPrice(m.price)}${rent ? dict.property.perMonth : ""}`;

  const reviewsHtml = m.reviewStats
    ? `<div class="mt-0.5 flex items-center gap-1 text-xs text-accent-600">
        <span aria-hidden>${"★".repeat(Math.round(m.reviewStats.average))}${"☆".repeat(5 - Math.round(m.reviewStats.average))}</span>
        <span class="text-stone-400">${dict.property.reviewsCount(m.reviewStats.average, m.reviewStats.count)}</span>
      </div>`
    : "";

  const imageHtml = m.image
    ? `<img src="${escapeHtml(m.image)}" alt="" class="mb-1.5 h-24 w-full rounded-lg object-cover" />`
    : "";

  // <div>, jamais <p> : le CSS de Leaflet (leaflet.css, importé plus bas)
  // pose `.leaflet-popup-content p { margin: 1.3em 0 }` — plus spécifique
  // qu'une classe Tailwind isolée (mt-*), donc gagnant même avec un `mt-0.5`
  // posé dessus. Un <div> n'est visé par aucune règle par défaut de Leaflet,
  // l'espacement reste entièrement piloté par les classes ci-dessous.
  return `
    <div class="w-56">
      ${imageHtml}
      <div class="text-sm font-medium leading-snug text-stone-900">${escapeHtml(m.title)}</div>
      <div class="text-xs text-stone-500">${escapeHtml(m.city)}</div>
      ${specs ? `<div class="text-xs text-stone-500">${escapeHtml(specs)}</div>` : ""}
      ${reviewsHtml}
      <div class="mt-0.5 font-display text-sm font-medium text-primary-700">${priceHtml}</div>
      <a href="${localizedHref(locale, `/annonces/${m.slug}`)}" class="mt-1.5 inline-block bg-primary-600 px-3 py-1.5 text-xs font-medium uppercase tracking-wide !text-white transition hover:bg-primary-700">
        ${dict.map.viewListing}
      </a>
    </div>
  `;
}

// Cadre la vue initiale : sur la zone recherchée si active, sinon sur les
// marqueurs. Ne se déclenche qu'une fois (pas à chaque déplacement utilisateur).
function InitialView({
  markers,
  bbox,
  onProgrammaticMove,
}: {
  markers: MapMarker[];
  bbox?: Bbox | null;
  onProgrammaticMove: () => void;
}) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    onProgrammaticMove();
    if (bbox) {
      map.fitBounds(
        L.latLngBounds([bbox.latMin, bbox.lngMin], [bbox.latMax, bbox.lngMax]),
        { padding: [20, 20] },
      );
    } else if (markers.length > 0) {
      map.fitBounds(L.latLngBounds(markers.map((m) => [m.lat, m.lng])), {
        padding: [40, 40],
        maxZoom: 13,
      });
    }
  }, [map, markers, bbox, onProgrammaticMove]);
  return null;
}

// Détecte les déplacements *utilisateur* (hors recentrages programmatiques) et
// expose le bouton « Rechercher dans cette zone ».
function AreaSearch({ locale, label }: { locale: Locale; label: string }) {
  const map = useMap();
  const router = useRouter();
  const [moved, setMoved] = useState(false);
  const lastProgrammatic = useRef(Date.now());

  useMapEvents({
    moveend() {
      // Ignore les moveend déclenchés par un fitBounds programmatique récent.
      if (Date.now() - lastProgrammatic.current > 600) setMoved(true);
    },
  });

  function searchHere() {
    const b = map.getBounds();
    const params = new URLSearchParams(window.location.search);
    params.set("latMin", b.getSouth().toFixed(6));
    params.set("latMax", b.getNorth().toFixed(6));
    params.set("lngMin", b.getWest().toFixed(6));
    params.set("lngMax", b.getEast().toFixed(6));
    params.delete("page");
    router.push(`${localizedHref(locale, "/annonces")}?${params.toString()}`);
  }

  // Exposé au parent via un attribut pour marquer les recentrages programmatiques.
  useEffect(() => {
    (map as unknown as { __markProgrammatic?: () => void }).__markProgrammatic =
      () => {
        lastProgrammatic.current = Date.now();
      };
  }, [map]);

  if (!moved) return null;
  return (
    <button
      type="button"
      onClick={searchHere}
      className="absolute left-1/2 top-3 z-[500] -translate-x-1/2 bg-primary-600 px-4 py-2 text-xs font-medium uppercase tracking-[0.1em] text-white shadow-lg transition hover:bg-primary-700"
    >
      {label}
    </button>
  );
}

// Regroupe les marqueurs proches/superposés en pastilles numérotées
// (leaflet.markercluster) — zoom ou clic sur une pastille pour l'éclater.
// Ajout entièrement impératif (pas de <Marker>/<Popup> react-leaflet) : le
// plugin de clustering opère sur de vraies L.LayerGroup, pas la
// réconciliation React.
function ClusteredMarkers({
  markers,
  locale,
  dict,
}: {
  markers: MapMarker[];
  locale: Locale;
  dict: Dictionary;
}) {
  const map = useMap();

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          className: "oximmo-cluster-wrapper",
          html: `<div class="oximmo-cluster">${cluster.getChildCount()}</div>`,
          iconSize: [36, 36],
        }),
    });

    for (const m of markers) {
      const rent = m.status === "FOR_RENT" || m.status === "RENTED";
      const marker = L.marker([m.lat, m.lng], {
        icon: priceIcon(m.price, rent, dict.map.priceOnRequestShort, m.priceHidden),
      });
      marker.bindPopup(buildPopupHtml(m, locale, dict), { minWidth: 224, maxWidth: 260 });
      group.addLayer(marker);
    }

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, markers, locale, dict]);

  return null;
}

export default function PropertyMap({
  markers,
  bbox,
  locale,
  dict,
}: {
  markers: MapMarker[];
  bbox?: Bbox | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const center = useMemo<[number, number]>(() => {
    if (markers.length === 0) return [46.6, 2.4]; // centre France
    const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  const markProgrammatic = () => {
    const m = mapRef.current as unknown as { __markProgrammatic?: () => void };
    m?.__markProgrammatic?.();
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200">
    <MapContainer
      center={center}
      zoom={6}
      // maxZoom explicite (au lieu de le laisser se déduire du TileLayer,
      // potentiellement pas encore prêt quand ClusteredMarkers calcule son
      // seuil de spiderfy) : le regroupement de biens à des coordonnées
      // identiques (même immeuble) doit pouvoir s'éclater au zoom max.
      maxZoom={18}
      scrollWheelZoom={false}
      className="oximmo-map-muted h-[440px] w-full"
      style={{ zIndex: 0 }}
      ref={mapRef}
    >
      {/* OSM classique (CartoDB Positron testé, mais exige désormais une clé
          API — tuiles "API KEY REQUIRED" en filigrane sans elle). Look sobre
          obtenu à la place par un filtre CSS sur les tuiles (.oximmo-map-muted
          dans globals.css), sans dépendance à un fournisseur tiers. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AreaSearch locale={locale} label={dict.map.searchThisArea} />
      <InitialView markers={markers} bbox={bbox} onProgrammaticMove={markProgrammatic} />
      <ClusteredMarkers markers={markers} locale={locale} dict={dict} />
    </MapContainer>
    </div>
  );
}
