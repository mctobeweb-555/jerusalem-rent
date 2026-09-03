import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { getWhatsappConfig } from "@/lib/site-settings";
import { PhoneIcon, MailIcon, PinIcon } from "@/components/icons";

const CONTACT_EMAIL = "contact@jerusalem-rent.com";
const CONTACT_ADDRESS = "Maavar Beit Haknesset 12, Jerusalem, Israel";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return getDictionary(params.locale).meta.contact;
}

// Une coordonnée (icône + libellé + valeur), en blanc sur la photo.
function ContactLine({
  icon: Icon,
  label,
  value,
  href,
  ltr,
}: {
  icon: (props: { className?: string }) => JSX.Element;
  label: string;
  value: string;
  href?: string;
  /** Force le sens LTR (téléphone) : le bidi d'une page RTL réordonne sinon
      les chiffres/le "+"/les tirets. */
  ltr?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            dir={ltr ? "ltr" : undefined}
            className="mt-1 block text-white transition hover:text-accent-300"
          >
            {value}
          </a>
        ) : (
          <p dir={ltr ? "ltr" : undefined} className="mt-1 text-white">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default async function ContactPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const d = getDictionary(params.locale).contact;
  const whatsapp = await getWhatsappConfig();

  return (
    // Section unique sur l'aplat marine de la marque : le texte et le
    // formulaire sont posés dessus.
    <section className="bg-primary-600">
      <div className="container-page py-20 sm:py-28">
        <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[1fr_460px]">
          {/* Colonne texte + coordonnées */}
          <div className="text-white">
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">
              {d.heroEyebrow}
            </p>
            <h1 className="mt-5 font-display text-4xl font-extralight uppercase tracking-[0.04em] text-white sm:text-5xl">
              {d.title}
            </h1>
            <p className="mt-6 max-w-md leading-relaxed text-white/70">{d.desc}</p>

            <div className="mt-12 space-y-8 border-t border-white/15 pt-10">
              <ContactLine
                icon={MailIcon}
                label={d.emailLabel}
                value={CONTACT_EMAIL}
                href={`mailto:${CONTACT_EMAIL}`}
              />
              {whatsapp && (
                <ContactLine
                  icon={PhoneIcon}
                  label={d.phoneLabel}
                  value={whatsapp.number}
                  href={`tel:${whatsapp.number.replace(/[^\d+]/g, "")}`}
                  ltr
                />
              )}
              <ContactLine icon={PinIcon} label={d.addressLabel} value={CONTACT_ADDRESS} />
            </div>
          </div>

          {/* Formulaire, sur fond blanc pour rester lisible sur la photo */}
          <div className="lg:pt-2">
            <ContactForm heading={d.formHeading} confirmText={d.confirmText} />
          </div>
        </div>
      </div>
    </section>
  );
}
