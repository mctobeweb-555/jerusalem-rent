import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import ReviewForm from "@/components/admin/ReviewForm";

export const dynamic = "force-dynamic";

export default async function NewReviewPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  const properties = await prisma.property.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/reviews" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux avis
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nouvel avis</h1>
      </div>
      <ReviewForm properties={properties} />
    </div>
  );
}
