"use client";

import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n/context";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export default function FavoriteButton({
  propertyId,
  variant = "icon",
  className,
}: {
  propertyId: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { has, toggle } = useFavorites();
  const active = has(propertyId);
  const dict = useDict().favorite;

  function onClick(e: React.MouseEvent) {
    // Empêche la navigation quand le bouton est superposé à une carte-lien.
    e.preventDefault();
    e.stopPropagation();
    toggle(propertyId);
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "btn-outline gap-2",
          active && "border-primary-300 bg-primary-50 text-primary-700",
          className,
        )}
      >
        <Heart filled={active} />
        {active ? dict.savedInFavorites : dict.add}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? dict.remove : dict.add}
      title={active ? dict.remove : dict.add}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white",
        active ? "text-red-500" : "text-stone-500 hover:text-stone-700",
        className,
      )}
    >
      <Heart filled={active} />
    </button>
  );
}
