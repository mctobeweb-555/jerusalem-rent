import { cn } from "@/lib/utils";

// Étoiles pleines/vides (arrondi à l'entier le plus proche). Purement
// présentationnel, pas de logique client nécessaire.
export default function ReviewStars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-accent-500", className)}
      aria-label={`${rating} sur 5 étoiles`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden>
          {i < rounded ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}
