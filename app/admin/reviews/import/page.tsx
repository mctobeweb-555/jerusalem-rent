import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import ReviewsCsvImport from "@/components/admin/ReviewsCsvImport";

export const dynamic = "force-dynamic";

export default async function ImportReviewsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/reviews" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux avis
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Importer des avis (CSV)</h1>
        <p className="mt-1 text-sm text-stone-500">
          Les avis liés à une annonce sont retrouvés par titre exact.
        </p>
      </div>
      <ReviewsCsvImport />
    </div>
  );
}
