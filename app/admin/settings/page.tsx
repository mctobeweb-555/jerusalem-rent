import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/guards";
import { getSiteMode } from "@/lib/site-settings";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import WhatsAppSettingsForm from "@/components/admin/WhatsAppSettingsForm";
import ReviewsSettingsForm from "@/components/admin/ReviewsSettingsForm";
import SocialSettingsForm from "@/components/admin/SocialSettingsForm";

export const dynamic = "force-dynamic";

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
    </div>
  );
}
