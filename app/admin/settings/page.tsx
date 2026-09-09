import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { getSiteMode } from "@/lib/site-settings";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import WhatsAppSettingsForm from "@/components/admin/WhatsAppSettingsForm";
import ReviewsSettingsForm from "@/components/admin/ReviewsSettingsForm";
import SocialSettingsForm from "@/components/admin/SocialSettingsForm";
import PopupSettingsForm from "@/components/admin/PopupSettingsForm";

export const dynamic = "force-dynamic";

/** Bloc de traduction de la popup tel que stocké en base (champ Json). */
function popupTranslation(raw: unknown, locale: "en" | "he") {
  const empty = { title: "", text: "", ctaLabel: "" };
  if (!raw || typeof raw !== "object") return empty;
  const block = (raw as Record<string, unknown>)[locale];
  if (!block || typeof block !== "object") return empty;
  const b = block as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return { title: str(b.title), text: str(b.text), ctaLabel: str(b.ctaLabel) };
}

export default async function AdminSettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "ADMIN") redirect("/admin");

  const [mode, contact] = await Promise.all([
    getSiteMode(),
    prisma.siteSettings.findUnique({
      where: { id: "default" },
      select: {
        whatsappNumber: true,
        whatsappMessage: true,
        reviewsGeneralized: true,
        facebookUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        popupEnabled: true,
        popupImageUrl: true,
        popupTitle: true,
        popupText: true,
        popupCtaLabel: true,
        popupCtaUrl: true,
        popupTranslations: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Paramètres du site</h1>
        <p className="mt-1 text-sm text-stone-500">
          Choisissez les catégories affichées sur le site public.
        </p>
      </div>
      <SiteSettingsForm
        initial={{
          showSale: mode.showSale,
          showRent: mode.showRent,
          showShortTerm: mode.showShortTerm,
        }}
      />
      <WhatsAppSettingsForm
        initial={{
          whatsappNumber: contact?.whatsappNumber ?? "",
          whatsappMessage: contact?.whatsappMessage ?? "",
        }}
      />
      <ReviewsSettingsForm
        initial={{ reviewsGeneralized: contact?.reviewsGeneralized ?? false }}
      />
      <SocialSettingsForm
        initial={{
          facebookUrl: contact?.facebookUrl ?? "",
          instagramUrl: contact?.instagramUrl ?? "",
          linkedinUrl: contact?.linkedinUrl ?? "",
        }}
      />
      <PopupSettingsForm
        initial={{
          popupEnabled: contact?.popupEnabled ?? false,
          popupImageUrl: contact?.popupImageUrl ?? "",
          popupTitle: contact?.popupTitle ?? "",
          popupText: contact?.popupText ?? "",
          popupCtaLabel: contact?.popupCtaLabel ?? "",
          popupCtaUrl: contact?.popupCtaUrl ?? "",
          translations: {
            en: popupTranslation(contact?.popupTranslations, "en"),
            he: popupTranslation(contact?.popupTranslations, "he"),
          },
        }}
      />
    </div>
  );
}
