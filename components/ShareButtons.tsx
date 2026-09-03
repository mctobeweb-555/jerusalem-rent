"use client";

import { useEffect, useState } from "react";
import { useDict } from "@/lib/i18n/context";
import { LinkIcon, MailIcon } from "@/components/icons";

// Boutons de partage d'une annonce. L'URL absolue est fournie par le serveur
// (à partir de NEXT_PUBLIC_SITE_URL) pour rester correcte partout.
export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const dict = useDict().share;
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Détection côté client uniquement (évite un mismatch d'hydratation).
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  const links = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodedText}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Repli : sélection via prompt si clipboard indisponible.
      window.prompt(dict.copyPrompt, url);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* annulé par l'utilisateur */
      }
    }
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:bg-stone-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-stone-500">{dict.label}</span>

      <button type="button" onClick={copy} className={btn}>
        {!copied && <LinkIcon className="h-4 w-4" />}
        {copied ? dict.linkCopied : dict.copyLink}
      </button>

      <a
        href={links.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label={dict.whatsapp}
      >
        WhatsApp
      </a>

      <a
        href={links.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label={dict.facebook}
      >
        Facebook
      </a>

      <a
        href={links.x}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label={dict.x}
      >
        X
      </a>

      <a href={links.email} className={btn} aria-label={dict.email}>
        <MailIcon className="h-4 w-4" /> Email
      </a>

      {/* Partage natif (surtout mobile), affiché seulement si l'API est dispo. */}
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={btn}>
          {dict.more}
        </button>
      )}
    </div>
  );
}
