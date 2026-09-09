// Jeu d'icônes maison en traits fins (remplace les emojis, jugés bas de
// gamme). Style cohérent : viewBox 24×24, stroke="currentColor", trait fin
// (1.5), pas de remplissage — se colore et se dimensionne comme du texte
// (héritent de `text-*`/`h-*`/`w-*` via className).

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function HouseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9v-5h6v5h2.5a1 1 0 0 0 1-1v-9" />
    </Base>
  );
}

export function ApartmentIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
      <path d="M10 21v-4h4v4" />
    </Base>
  );
}

export function LandIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 20h18" />
      <path d="M5 20V9l4-3 4 3v11" />
      <path d="M13 20v-6l3-2 5 3v5" />
      <path d="M9 20v-4" />
    </Base>
  );
}

export function CommercialIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 9.5 4.2 4h15.6L21 9.5" />
      <path d="M4 9.5v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-10" />
      <path d="M4 9.5a2.5 2.5 0 0 0 5 0M9 9.5a2.5 2.5 0 0 0 5 0M14 9.5a2.5 2.5 0 0 0 5 0" />
      <path d="M10 20.5v-6h4v6" />
    </Base>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" />
    </Base>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m4 6.5 8 6.5 8-6.5" />
    </Base>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </Base>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.5 4 5.7 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.7-4-9s1.4-6.5 4-9Z" />
    </Base>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Base fill={filled ? "currentColor" : "none"} {...props}>
      <path d="M12 20.2 4.6 12.9a5 5 0 0 1 7.1-7.1l.3.3.3-.3a5 5 0 0 1 7.1 7.1L12 20.2Z" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Base>
  );
}

export function HandshakeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2 12.5 6 9l3 2 3-2 3 2.2" />
      <path d="M9 11 5 15.5a1.6 1.6 0 0 0 2.3 2.3L9 16" />
      <path d="M12 13.5 9.8 15.7A1.6 1.6 0 0 0 12 18l1-1" />
      <path d="m15 11 4-3.2" />
      <path d="M22 12.5 18 8.7l-3 2" />
    </Base>
  );
}

export function KeyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="8" cy="8" r="4.5" />
      <path d="m11.2 11.2 9.3 9.3" />
      <path d="m16 16 2-2M18.5 18.5l2-2" />
    </Base>
  );
}

export function TeamIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 20a4.5 4.5 0 0 1 6.5-4" />
    </Base>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 6-4-2 2-6 4 2Z" />
    </Base>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </Base>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </Base>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.5 2" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Base>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11 3c.6 2.8 1.4 4.4 2.7 5.7C15 10 16.6 10.8 19 11.4c-2.4.6-4 1.4-5.3 2.7-1.3 1.3-2.1 2.9-2.7 5.7-.6-2.8-1.4-4.4-2.7-5.7C6.9 12.8 5.4 12 3 11.4c2.4-.6 3.9-1.4 5.3-2.7C9.6 7.4 10.4 5.8 11 3Z" />
      <path d="M18.5 3.5c.3 1.2.7 1.9 1.7 2.5-1 .6-1.4 1.3-1.7 2.5-.3-1.2-.7-1.9-1.7-2.5 1-.6 1.4-1.3 1.7-2.5Z" />
    </Base>
  );
}

export function ComfortIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 16v-3a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 13v3" />
      <path d="M3 16h18v2.5a1 1 0 0 1-1 1h-1.5v-1H6.5v1H5a1 1 0 0 1-1-1V16Z" />
      <path d="M6 10.5V8a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2M13 10.5V8a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v2.5" />
    </Base>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 15 15 9" />
      <path d="M10.5 6.5 12 5a3.5 3.5 0 0 1 5 5l-1.5 1.5" />
      <path d="M13.5 17.5 12 19a3.5 3.5 0 0 1-5-5l1.5-1.5" />
    </Base>
  );
}
