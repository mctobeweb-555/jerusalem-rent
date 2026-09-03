import Link from "next/link";
import { pageHref, type SearchParams } from "@/lib/pagination";

export default function AdminPagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: SearchParams;
}) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <Link
        href={pageHref(basePath, searchParams, Math.max(1, page - 1))}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={`btn-outline py-1.5 ${prevDisabled ? "pointer-events-none opacity-40" : ""}`}
      >
        Précédent
      </Link>
      <span className="text-stone-500">
        Page {page} / {totalPages}
      </span>
      <Link
        href={pageHref(basePath, searchParams, Math.min(totalPages, page + 1))}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={`btn-outline py-1.5 ${nextDisabled ? "pointer-events-none opacity-40" : ""}`}
      >
        Suivant
      </Link>
    </div>
  );
}
