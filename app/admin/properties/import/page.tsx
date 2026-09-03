import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import CsvImport from "@/components/admin/CsvImport";

export const dynamic = "force-dynamic";

export default async function ImportPropertiesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/properties" className="text-sm text-stone-500 hover:text-primary-600">
          ← Retour aux annonces
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Importer des annonces (CSV)</h1>
        <p className="mt-1 text-sm text-stone-500">
          Les annonces créées vous sont attribuées comme agent.
        </p>
      </div>
      <CsvImport />
    </div>
  );
}
