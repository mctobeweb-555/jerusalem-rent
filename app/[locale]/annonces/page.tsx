import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Filters from "@/components/Filters";
import PropertyCard from "@/components/PropertyCard";
import Pagination from "@/components/Pagination";
import MapView from "@/components/map/MapView";
import SortSelect from "@/components/SortSelect";
import type { MapMarker } from "@/components/map/PropertyMap";
import { propertySearchSchema } from "@/lib/validations";
import { searchProperties, searchPropertyMarkers } from "@/lib/properties";
import { listAgents } from "@/lib/agents";
import { reviewStats } from "@/lib/reviews";
import { getSiteMode } from "@/lib/site-settings";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, localizedHref, type Locale } from "@/lib/i18n/config";
import { withTranslatedTitle } from "@/lib/i18n/property-translation";
import { SearchIcon } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return getDictionary(params.locale).meta.listings;
}

// SSR : rendu à la demande selon les filtres de l'URL et la langue.
export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstOf(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AnnoncesPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: SearchParams;
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dict = getDictionary(locale);
  const href = (path: string) => localizedHref(locale, path);

  // On ne garde que des chaînes simples pour la validation Zod (coerce).
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    const value = firstOf(v);
    if (value !== undefined && value !== "") raw[k] = value;
  }

  // Validation tolérante : en cas d'entrée invalide, on retombe sur les défauts.
  const parsed = propertySearchSchema.safeParse(raw);
  const search = parsed.success
    ? parsed.data
    : propertySearchSchema.parse({});

  // Mode du site : si court terme uniquement et aucun statut demandé, on cible
  // les locations courte durée par défaut.
  const mode = await getSiteMode();
  if (mode.shortTermOnly && !search.status) {
    search.status = "SHORT_TERM";
  }
  const isShortTerm = search.status === "SHORT_TERM" || mode.shortTermOnly;

  const [{ items, total, page, totalPages }, markerProperties] = await Promise.all([
    searchProperties(search, locale),
    searchPropertyMarkers(search, locale),
  ]);

  // Agents disposant d'au moins un bien publié, pour le filtre par agent.
  const agentList = (await listAgents())
    .filter((a) => a.slug && a.publishedCount > 0)
    .map((a) => ({ slug: a.slug as string, name: a.name }));

  // Params de base pour la pagination (sans "page").
  const baseParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k !== "page") baseParams[k] = v;
  }

  const activeStatus = search.status ? dict.property.statuses[search.status] : null;
  const activeType = search.type ? dict.property.types[search.type] : null;
  const activeAgent = search.agent
    ? agentList.find((a) => a.slug === search.agent)?.name ?? null
    : null;

  // Marqueurs carte : tous les biens correspondant aux filtres (pas
  // seulement la page courante) — cf. searchPropertyMarkers.
  const markers: MapMarker[] = markerProperties
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: withTranslatedTitle(p, locale).title,
      price: p.price,
      priceHidden: p.priceHidden,
      status: p.status,
      city: p.city,
      image: p.images[0]?.url ?? null,
      lat: p.lat as number,
      lng: p.lng as number,
      surface: p.surface,
      rooms: p.rooms,
      bedrooms: p.bedrooms,
      maxGuests: p.maxGuests,
      reviewStats: reviewStats(p.reviews),
    }));

  // Zone carte active (« rechercher dans cette zone ») si les 4 bornes existent.
  const bbox =
    search.latMin != null &&
    search.latMax != null &&
    search.lngMin != null &&
    search.lngMax != null
      ? {
          latMin: search.latMin,
          latMax: search.latMax,
          lngMin: search.lngMin,
          lngMax: search.lngMax,
        }
      : null;

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light uppercase tracking-[0.1em] text-primary-900">
            {activeStatus ?? dict.listing.allListings}
            {activeType ? ` · ${activeType}` : ""}
          </h1>
          <p className="mt-2 text-stone-500">
            {dict.listing.resultCount(total)}
            {activeAgent ? ` · ${dict.listing.agentFilter(activeAgent)}` : ""}
          </p>
        </div>
        {total > 0 && <SortSelect />}
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <Filters agents={agentList} shortTerm={isShortTerm} />
        </aside>

        <div>
          {(markers.length > 0 || bbox) && (
            <MapView markers={markers} bbox={bbox} />
          )}
          {items.length === 0 ? (
            <div className="card grid place-items-center p-12 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-stone-100">
                <SearchIcon className="h-6 w-6 text-stone-400" />
              </div>
              <h2 className="mt-4 font-display text-lg font-light uppercase tracking-[0.08em] text-stone-900">
                {dict.common.noResultsTitle}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-stone-500">{dict.common.noResultsDesc}</p>
              <Link href={href("/annonces")} className="btn-outline mt-5">
                {dict.common.resetFilters}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={withTranslatedTitle(p, locale)}
                    locale={locale}
                    dict={dict}
                  />
                ))}
              </div>
              <Pagination
                current={page}
                totalPages={totalPages}
                baseParams={baseParams}
                locale={locale}
                dict={dict.pagination}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
