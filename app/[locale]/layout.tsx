import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieConsent from "@/components/CookieConsent";
import WelcomePopup from "@/components/WelcomePopup";
import { I18nProvider } from "@/lib/i18n/context";
import { locales, isLocale, type Locale } from "@/lib/i18n/config";
import { getWhatsappConfig, getSocialLinks, getWelcomePopup } from "@/lib/site-settings";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;

  const [whatsapp, social, popup] = await Promise.all([
    getWhatsappConfig(),
    getSocialLinks(),
    getWelcomePopup(locale),
  ]);

  return (
    <I18nProvider locale={locale}>
      <Header phone={whatsapp?.number ?? null} />
      <main className="flex-1">{children}</main>
      <Footer social={social} locale={locale} phone={whatsapp?.number ?? null} />
      {whatsapp && <WhatsAppButton number={whatsapp.number} message={whatsapp.message} />}
      {popup && <WelcomePopup popup={popup} />}
      <CookieConsent />
    </I18nProvider>
  );
}
