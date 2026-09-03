import Link from "next/link";
import Image from "next/image";
import ReviewStars from "@/components/ReviewStars";

export default function ReviewCard({
  review,
}: {
  review: {
    authorName: string;
    rating: number;
    comment: string;
    avatarUrl: string | null;
    createdAt: Date;
    property?: { title: string; slug: string } | null;
  };
}) {
  return (
    <div className="card flex h-full flex-col gap-3 p-6">
      <ReviewStars rating={review.rating} />
      <p className="flex-1 text-sm leading-relaxed text-stone-600">
        « {review.comment} »
      </p>
      <div className="flex items-center gap-3 border-t border-stone-100 pt-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
          {review.avatarUrl ? (
            review.avatarUrl.startsWith("/") ? (
              // Upload local (/uploads/…) : next/image redimensionne à la
              // volée plutôt que de servir l'avatar en pleine résolution
              // pour un rendu de 36px.
              <Image
                src={review.avatarUrl}
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              // URL externe saisie à la main dans l'admin : domaine non
              // garanti dans next.config.js images.remotePatterns, next/image
              // lèverait une erreur — repli sur une <img> classique.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.avatarUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )
          ) : (
            review.authorName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-900">
            {review.authorName}
          </p>
          {review.property && (
            <Link
              href={`/annonces/${review.property.slug}`}
              className="truncate text-xs text-primary-600 hover:text-primary-700"
            >
              {review.property.title}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
