"use client";

import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Marqueur pastille (divIcon → aucune image externe, compatible CSP stricte).
const pin = L.divIcon({
  className: "oximmo-loc-marker",
  html: '<span class="oximmo-loc-pin"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Mini-carte de localisation d'un bien (marqueur unique).
export default function PropertyLocationMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200">
    <MapContainer
      center={[lat, lng]}
      // zoom 14 montrait la ville entière (échelle quartier/district) — 16
      // montre les rues autour du bien, avec leurs noms, plutôt que la ville
      // en global (demandé explicitement).
      zoom={16}
      scrollWheelZoom={false}
      className="oximmo-map-muted h-72 w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Cercle d'approximation autour de la position. */}
      <Circle
        center={[lat, lng]}
        radius={220}
        pathOptions={{
          color: "#1c1f40",
          fillColor: "#1c1f40",
          fillOpacity: 0.12,
          weight: 1,
        }}
      />
      <Marker position={[lat, lng]} icon={pin} title={label} />
    </MapContainer>
    </div>
  );
}
