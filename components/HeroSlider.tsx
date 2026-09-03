import Image from "next/image";

const SLIDES = [
  "/brand/hero-jerusalem.jpg",
  "/brand/hero-jerusalem-2.jpg",
  "/brand/hero-jerusalem-3.jpg",
];
const SLOT_SECONDS = 7; // doit correspondre à la durée des animations kb-* dans globals.css

// Diaporama plein cadre en fondu enchaîné avec effet Ken Burns (zoom lent).
// Pure CSS (animation-delay négatif décalant chaque slide) : aucun JS, aucun
// risque de layout shift/hydratation.
export default function HeroSlider() {
  return (
    <div className="absolute inset-0">
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="kb-fade absolute inset-0"
          style={{ animationDelay: `-${i * SLOT_SECONDS}s` }}
        >
          <Image
            src={src}
            alt=""
            fill
            // Les 3 slides doivent être chargées dès l'arrivée (le fondu CSS
            // les rend visibles au bout de quelques secondes, pas au scroll) :
            // le lazy-loading par défaut de next/image les laisserait vides.
            priority
            sizes="100vw"
            className="kb-zoom object-cover"
            style={{ animationDelay: `-${i * SLOT_SECONDS}s` }}
          />
        </div>
      ))}
    </div>
  );
}
