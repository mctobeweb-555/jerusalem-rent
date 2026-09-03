import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "@/components/NewsletterForm";
import type { SocialLinks } from "@/lib/site-settings";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { PhoneIcon, MailIcon } from "@/components/icons";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M13.5 21v-7.5h2.5l.5-3H13.5V8.5c0-.9.25-1.5 1.55-1.5H16.5V4.3C16.2 4.26 15.2 4.17 14 4.17c-2.5 0-4.2 1.5-4.2 4.3V10.5H7.3v3H9.8V21h3.7Z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path d="M6.94 8.5H4V20h2.94V8.5ZM5.47 4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4ZM20 20v-6.4c0-3.06-1.63-4.48-3.8-4.48-1.75 0-2.53.96-2.97 1.64V8.5H10.3c.04.86 0 11.5 0 11.5h2.94v-6.42c0-.34.03-.69.13-.93.28-.69.92-1.41 2-1.41 1.4 0 1.97 1.07 1.97 2.63V20H20Z" />
    </svg>
  );
}

const CONTACT_EMAIL = "contact@jerusalem-rent.com";
const CONTACT_ADDRESS = "Maavar Beit Haknesset 12, Jerusalem, Israel";

const SOCIAL_ICONS = {
  facebookUrl: FacebookIcon,
  instagramUrl: InstagramIcon,
  linkedinUrl: LinkedinIcon,
} as const;

// Emblème (rond + étoile) recadré depuis le logo complet par zoom CSS — pas
// d'asset dédié pour l'instant. Le logo (519×125) place l'icône ronde dans
// les ~118 premiers pixels de large ; on agrandit l'image en arrière-plan
// pour que ce carré remplisse la boîte, positionné à gauche/centre.
function BrandEmblemWatermark({ size = 420 }: { size?: number }) {
  const scale = size / 118;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div
        style={{
          width: size,
          height: size,
          backgroundImage: "url(/brand/logo.png)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "left center",
          backgroundSize: `${519 * scale}px ${125 * scale}px`,
          opacity: 0.06,
        }}
      />
    </div>
  );
}

export default function Footer({
  social,
  locale,
  phone,
}: {
  social?: SocialLinks;
  locale: Locale;
  phone?: string | null;
}) {
  const dict = getDictionary(locale);
  const year = new Date().getFullYear();
  const socialEntries = social
    ? (Object.keys(SOCIAL_ICONS) as (keyof SocialLinks)[])
        .map((key) => ({ key, url: social[key], Icon: SOCIAL_ICONS[key] }))
        .filter((s) => s.url)
    : [];
  const href = (path: string) => localizedHref(locale, path);
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;

  const navLinks = [
    { href: href("/annonces"), label: dict.nav.ourListings },
    { href: `${href("/")}#quartiers`, label: dict.nav.neighborhoods },
    { href: href("/agents"), label: dict.nav.agents },
    { href: href("/qui-sommes-nous"), label: dict.nav.aboutUs },
    { href: href("/faq"), label: dict.footer.aboutLinks.faq },
    { href: href("/contact"), label: dict.footer.aboutLinks.contact },
    { href: href("/favoris"), label: dict.nav.favorites },
  ];

  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      {/* Bandeau newsletter — fond marine plat (plus de dégradé), tout centré,
          champ sous le texte, emblème de marque en filigrane. */}
      <div className="relative overflow-hidden bg-primary-600">
        <BrandEmblemWatermark />
        <div className="container-page relative py-16 text-center">
          <h2 className="font-display text-2xl font-light text-white sm:text-3xl">
            {dict.footer.newsletterTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">{dict.footer.newsletterDesc}</p>
          <div className="mx-auto mt-8 max-w-md">
            <NewsletterForm dict={dict.newsletter} />
          </div>
        </div>
      </div>

      <div className="container-page py-16 text-center">
        <Image
          src="/brand/logo.png"
          alt="Jerusalem Rent"
          width={519}
          height={125}
          className="mx-auto h-14 w-auto"
        />
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-stone-500">
          {dict.footer.brandBlurb}
        </p>
        <p className="mt-3 text-sm text-stone-500">{CONTACT_ADDRESS}</p>

        {/* Contact */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-stone-600">
          {telHref && (
            <a href={telHref} className="flex items-center gap-2 hover:text-primary-700">
              <PhoneIcon className="h-4 w-4" />
              <span dir="ltr">{phone}</span>
            </a>
          )}
          <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-primary-700">
            <MailIcon className="h-4 w-4" />
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* Navigation, en une seule ligne centrée */}
        <nav className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.1em] text-stone-500">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary-700">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="hover:text-primary-700">
            {dict.footer.aboutLinks.pro}
          </Link>
        </nav>

        {/* Nos quartiers, sous forme de boutons — tous les quartiers. */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {NEIGHBORHOODS.map((n) => (
            <Link
              key={n.slug}
              href={href(`/annonces?neighborhood=${encodeURIComponent(n.name)}`)}
              className="border border-stone-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-stone-600 transition hover:border-primary-600 hover:text-primary-700"
            >
              {n.name}
            </Link>
          ))}
        </div>

        {/* Réseaux sociaux */}
        {socialEntries.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            {socialEntries.map(({ key, url, Icon }) => (
              <a
                key={key}
                href={url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={key.replace("Url", "")}
                className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-primary-100 hover:text-primary-700"
              >
                <Icon />
              </a>
            ))}
          </div>
        )}

        {/* Mentions légales de l'agence */}
        <ul className="mx-auto mt-10 max-w-2xl space-y-1 text-xs text-stone-400">
          {dict.footer.legalItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="border-t border-stone-200">
        {/* pb-24 (au lieu de py-5 symétrique) : réserve la place du bouton
            WhatsApp flottant (fixed bottom-5 right-5, 56px) qui recouvrait
            sinon le lien "CGU" et le rendait inaccessible au clic — vérifié
            en conditions réelles à toutes les largeurs, pas seulement mobile. */}
        <div className="container-page flex flex-col items-center justify-between gap-2 pb-24 pt-5 text-xs text-stone-400 sm:flex-row">
          <p>
            {dict.footer.copyright(year)}
            {" · Design by "}
            <a
              href="https://tobeweb.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600"
            >
              Tobeweb
            </a>
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-1.5">
            <Link href={href("/mentions-legales")} className="hover:text-primary-600">
              {dict.footer.bottomLegal.mentions}
            </Link>
            <span aria-hidden>·</span>
            <Link href={href("/confidentialite")} className="hover:text-primary-600">
              {dict.footer.bottomLegal.privacy}
            </Link>
            <span aria-hidden>·</span>
            <Link href={href("/cgu")} className="hover:text-primary-600">
              {dict.footer.bottomLegal.cgu}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
