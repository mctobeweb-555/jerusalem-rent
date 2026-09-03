import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import ReviewForm, { type ReviewFormValues } from "@/components/admin/ReviewForm";

export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  const [review, properties] = await Promise.all([
    prisma.review.findUnique({
      where: { id: params.id },
      include: { property: { select: { agencyId: true } } },
    }),
    prisma.property.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!review || (review.property && review.property.agencyId !== user.agencyId)) {
    notFound();
  }

  const initial: ReviewFormValues = {
    propertyId: review.propertyId ?? "",
    authorName: review.authorName,
    rating: review.rating,
    comment: review.comment,
    avatarUrl: review.avatarUrl ?? "",
    published: review.published,
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/reviews" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux avis
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Modifier l'avis</h1>
      </div>
      <ReviewForm initial={initial} reviewId={review.id} properties={properties} />
    </div>
  );
}
