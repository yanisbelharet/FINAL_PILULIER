import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck, Truck, Banknote, PhoneCall, Droplets, ShoppingCart, Check, ChevronDown, Play, Sparkles, PaintRoller, Sun,
  Calculator, BadgeCheck, MessageCircle, Eye, Layers, House, Grid3x3, BrickWall, Building2, Waves, Bath, CornerDownLeft, CloudRain, Gift, Info,
} from 'lucide-react';
import CheckoutFormPigma, {
  PIGMA_OFFERS, PIGMA_PRODUCT, PIGMA_UNIT_PRICE, PIGMA_BOX_KG, PigmaOfferId, getOffer, da,
} from './CheckoutFormPigma';
import { DELIVERY_PRICES } from './data';
import ambianceList from './pigma-ambiance.json';

// Étiquette envoyée dans le champ `source` des commandes de cette page
const SOURCE_TAG = 'LP pigma-stop-fuites';
const WHATSAPP = '213557920685';
const A = '/lp-assets/pigma/';

// Vraies photos fournies par la boutique (boîte non retouchée)
const PHOTO_HERO = { src: A + 'pot-transparent-1-4kg.webp', alt: 'علبة Pigma Color Stop Fuites الشفافة 1,4 كلغ', w: 495, h: 619 };
const PHOTO_SIZES = { src: A + 'pots-1-4kg-5kg-pluie.webp', alt: 'علبة Stop Fuites 1,4 كلغ فوق سطل 5 كلغ (النسخة الشفافة) تحت الشتا', w: 370, h: 828 };
const PHOTO_HAND = { src: A + 'pot-1-4kg-en-main.webp', alt: 'علبة Stop Fuites 1,4 كلغ في اليد', w: 370, h: 828 };
const PHOTO_DROPS = { src: A + 'pot-1-4kg-gouttes.webp', alt: 'علبة Stop Fuites 1,4 كلغ عليها قطرات الماء', w: 480, h: 640 };

// ----------------------------------------------------------------------------------------------
// Données techniques : n'inventer AUCUN chiffre. Tant que la fiche technique n'est pas trouvée,
// ces valeurs restent `null` et la page affiche un repère visible [À COMPLÉTER] (voir docs/pigma-sources.md).
// ----------------------------------------------------------------------------------------------
// coats : « يُفضل تطبيق طبقتين » (fiche du revendeur Fast-Colors-Tlemcen) ; rendement toujours introuvable
const SPEC: { kgPerM2PerCoat: number | null; coats: number | null } = { kgPerM2PerCoat: null, coats: 2 };

// Vidéo réelle du test à l'eau (fichier dans public/lp-assets/pigma/). null = emplacement réservé.
const VIDEO: { src: string; poster: string } | null = null;

// Images d'ambiance générées (scripts/gen-image.mjs) : illustratives uniquement
const AMBIANCE = new Set<string>(ambianceList as string[]);
const ambiance = (id: string) => (AMBIANCE.has(id) ? `/images/pigma/${id}.webp` : null);

const usdRate = (config: any) => (Number(config?.usdRate) > 0 ? Number(config.usdRate) : 250);

// Les pixels sont initialisés dans App.tsx après les effets des pages : on attend qu'ils soient prêts
const whenReady = (check: () => boolean, fn: () => void, timeoutMs = 10000) => {
  if (check()) { fn(); return () => {}; }
  const started = Date.now();
  const id = setInterval(() => {
    if (check()) { clearInterval(id); fn(); }
    else if (Date.now() - started > timeoutMs) clearInterval(id);
  }, 300);
  return () => clearInterval(id);
};

// Offre la moins chère (un seul type d'offre) pour un nombre de boîtes ; à égalité on garde le plus grand pack
const bestOffer = (boxesNeeded: number) => {
  const options = PIGMA_OFFERS.map(o => {
    const count = Math.max(1, Math.ceil(boxesNeeded / o.boxes));
    return { offer: o, count, cost: count * o.price, boxes: count * o.boxes };
  });
  return options.sort((a, b) => a.cost - b.cost || b.offer.boxes - a.offer.boxes)[0];
};

const STYLES = `
.pg-root { --ink:#0B1B3F; --ink2:#0E2A5C; --aqua:#2EC4F1; --sun:#FFD60A; }
@keyframes pg-shine { 0% { transform: translateX(120%) } 60%,100% { transform: translateX(-220%) } }
@keyframes pg-bead { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
@keyframes pg-slide { 0% { transform: translateY(-10%); opacity: 0 } 12% { opacity: 1 } 100% { transform: translateY(520%); opacity: 0 } }
@keyframes pg-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(37,211,102,.55) } 70% { box-shadow: 0 0 0 12px rgba(37,211,102,0) } }
.pg-shine::after { content:''; position:absolute; inset:0; width:40%; background:linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent); animation: pg-shine 3.4s ease-in-out infinite; }
/* goutte "verre mouillé" : reflet en haut, ombre portée en bas */
.pg-drop { position:absolute; border-radius:50%; background:radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0 10%, rgba(255,255,255,.28) 24%, rgba(150,215,255,.10) 55%, rgba(10,40,90,.28) 100%); box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 3px rgba(255,255,255,.25); }
.pg-bead { animation: pg-bead 3s ease-in-out infinite; }
.pg-runner { animation: pg-slide 4.5s cubic-bezier(.55,0,.75,.4) infinite; }
.pg-wa { animation: pg-pulse 2.4s infinite; }
.pg-offer:active { transform: scale(.985); }
.pg-todo { display:inline-block; max-width:100%; background:#FEF3C7; color:#92400E; border:1px dashed #D97706; border-radius:6px; padding:0 .35em; font-weight:800; font-size:.86em; direction:ltr; unicode-bidi:isolate; }
.pg-wave { display:block; width:100%; height:28px; }
@media (prefers-reduced-motion: reduce) {
  .pg-bead,.pg-runner,.pg-wa { animation: none !important; }
  .pg-shine::after { display: none; }
  html { scroll-behavior: auto; }
}`;

// Repère visible pour une information introuvable
const Todo = ({ children }: { children: React.ReactNode }) => <span className="pg-todo">[À COMPLÉTER : {children}]</span>;

const Section = ({ id, className = '', children, wide = false }: { id?: string; className?: string; children: React.ReactNode; wide?: boolean }) => (
  <section id={id} className={`px-4 py-14 lg:py-20 ${className}`}><div className={`mx-auto ${wide ? 'max-w-5xl' : 'max-w-xl lg:max-w-3xl'}`}>{children}</div></section>
);
const Kicker = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <p className={`text-[13px] font-black tracking-wide mb-2 flex items-center gap-1.5 ${dark ? 'text-[#7DD9FF]' : 'text-[#1366d6]'}`}>
    <Droplets size={14} /> {children}
  </p>
);
const H2 = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <h2 className={`text-[28px] lg:text-[38px] leading-[1.25] font-black ${dark ? 'text-white' : 'text-[#0B1B3F]'}`}>{children}</h2>
);

// Image d'ambiance générée, sinon un fond dégradé (jamais présentée comme un résultat réel)
const AmbientFigure = ({ id, alt, className = '', Icon, children }: {
  id: string; alt: string; className?: string; Icon?: React.ElementType; children?: React.ReactNode;
}) => {
  const src = ambiance(id);
  return (
    <figure className={`relative overflow-hidden bg-gradient-to-br from-[#123366] via-[#0E2A5C] to-[#071634] ${className}`}>
      {src ? <img src={src} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        : Icon && <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true"><Icon size={64} strokeWidth={1.4} className="text-[#7DD9FF]/45" /></span>}
      {children}
      {src && <figcaption className="absolute bottom-2 left-2 text-[10px] font-bold text-white/85 bg-black/35 rounded-full px-2 py-0.5">صورة توضيحية</figcaption>}
    </figure>
  );
};

// Gouttes qui perlent sur une surface (positions déterministes)
const Beads = ({ n = 14, seed = 7 }: { n?: number; seed?: number }) => {
  const beads = useMemo(() => Array.from({ length: n }, (_, i) => {
    const r = 6 + ((i * seed * 13) % 17);
    return { left: `${(i * 37 + seed * 11) % 96}%`, top: `${(i * 53 + seed * 7) % 92}%`, size: r, delay: `${(i * 0.37) % 3}s` };
  }), [n, seed]);
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {beads.map((b, i) => <span key={i} className="pg-drop pg-bead" style={{ left: b.left, top: b.top, width: b.size, height: b.size * 0.92, animationDelay: b.delay }} />)}
    </div>
  );
};

// Surface traitée vs non traitée : les gouttes glissent sur la partie protégée (animée au scroll avec GSAP)
const SurfaceDemo = () => (
  <div id="pg-surface" className="relative rounded-[28px] overflow-hidden ring-1 ring-white/10 bg-[#0a1f47]" style={{ aspectRatio: '4 / 3' }}>
    <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="pg-tile" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#d9dee6" /><stop offset="1" stopColor="#9aa6b6" /></linearGradient>
        <linearGradient id="pg-gloss" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="rgba(255,255,255,.55)" /><stop offset=".45" stopColor="rgba(255,255,255,.04)" /><stop offset="1" stopColor="rgba(255,255,255,.35)" /></linearGradient>
        <radialGradient id="pg-dropg" cx=".32" cy=".28" r=".75"><stop offset="0" stopColor="#ffffff" /><stop offset=".3" stopColor="#e0f4ff" stopOpacity=".9" /><stop offset="1" stopColor="#4aa8e0" stopOpacity=".55" /></radialGradient>
        <radialGradient id="pg-stain" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#4b3a22" stopOpacity=".75" /><stop offset="1" stopColor="#4b3a22" stopOpacity="0" /></radialGradient>
      </defs>
      {/* dalle en perspective */}
      <polygon points="30,70 370,70 400,300 0,300" fill="url(#pg-tile)" />
      {[0, 1, 2, 3, 4].map(i => <line key={'h' + i} x1={30 - i * 6} y1={70 + i * 46} x2={370 + i * 6} y2={70 + i * 46} stroke="#6b7685" strokeWidth="1.2" opacity=".55" />)}
      {[-150, -75, 0, 75, 150].map(x => <line key={'v' + x} x1={200 + x * 1.13} y1="70" x2={200 + x * 1.33} y2="300" stroke="#6b7685" strokeWidth="1.2" opacity=".55" />)}
      {/* côté protégé (droite = début de lecture en RTL) : film transparent brillant */}
      <polygon points="200,70 370,70 400,300 200,300" fill="url(#pg-gloss)" />
      <g className="pg-dry-side">
        {[[262, 118, 11], [322, 150, 13], [238, 196, 12], [300, 232, 15], [356, 206, 10], [270, 268, 12]].map(([x, y, r], i) => (
          <g key={i} className="pg-slide-drop" data-i={i}>
            <ellipse cx={x} cy={y + r * 0.7} rx={r} ry={r * 0.3} fill="rgba(0,0,0,.22)" />
            <circle cx={x} cy={y} r={r} fill="url(#pg-dropg)" />
          </g>
        ))}
      </g>
      {/* côté non protégé : l'eau pénètre et tache */}
      {[[110, 150, 46], [70, 232, 54], [150, 250, 40]].map(([x, y, r], i) => (
        <ellipse key={i} className="pg-stain" cx={x} cy={y} rx={r} ry={r * 0.55} fill="url(#pg-stain)" />
      ))}
      {[[110, 140, 10], [70, 222, 12], [150, 242, 9]].map(([x, y, r], i) => (
        <circle key={i} className="pg-soak-drop" cx={x} cy={y} r={r} fill="url(#pg-dropg)" />
      ))}
      <line x1="200" y1="70" x2="200" y2="300" stroke="#FFD60A" strokeWidth="2.5" strokeDasharray="6 6" />
    </svg>
    <span className="absolute top-3 right-3 text-[12px] font-black bg-[#FFD60A] text-[#0B1B3F] rounded-full px-3 py-1">مدهون بـ Stop Fuites</span>
    <span className="absolute top-3 left-3 text-[12px] font-black bg-white/90 text-slate-700 rounded-full px-3 py-1">بلا حماية</span>
    <span className="absolute bottom-2 inset-x-0 text-center text-[11px] font-semibold text-white/70">رسم توضيحي</span>
  </div>
);

const FAQ = (deskMin: number, homeMin: number) => [
  { q: 'شحال تغطي العلبة تاع 1,4 كلغ؟', a: <>يُنصح بطبقتين. الاستهلاك في المتر المربع: <Todo>rendement kg/m² par couche</Todo>. كي نأكدو الرقم، الحاسبة الفوق تحسبلك عدد العلب ديريكت.</> },
  { q: 'شحال من وقت باش ينشف؟', a: <>وقت التنشاف: <Todo>temps de séchage (au toucher / entre couches / complet)</Todo>. ديما اختار نهار شمس وبلا شتا.</> },
  { q: 'نقدر ندهن وكاين الشتا؟', a: <>لا، لازم السطح يكون نقي وناشف. المدة اللي لازم تكون بلا شتا بعد الدهان: <Todo>délai sans pluie après application</Todo>.</> },
  { q: 'على واش نقدر ندهنو؟', a: <>السطوح والتيراسات، البالكونات والدروج، خزانات الماء والأحواض، الحمامات والكوزينات (البلايص اللي فيها الرطوبة)، والتسربات في الزوايا وحول الترابيات. يتدهن من الجهة اللي يدخل منها الماء.</> },
  { q: 'صح شفاف؟ ما يبدلش لون الزليج؟', a: 'النسخة اللي نبيعوها مكتوب عليها «TRANSPARENT» على العلبة. هي مخصصة للي حاب يحمي السطح بلا ما يبدل المظهر الطبيعي تاع السطح ولا الزليج.' },
  { q: 'شحال يدوم؟ يقاوم الشمس؟', a: <>المدة ومقاومة الشمس (UV): <Todo>durabilité et résistance UV selon le fabricant</Todo>.</> },
  { q: 'لازمني عامل مختص؟', a: 'التطبيق يكون بالرولو ولا البروسة كيما الصباغة، تقدر تديرو وحدك. تبّع الخطوات اللي الفوق.' },
  { q: 'كيفاش نخلص؟', a: 'الدفع عند الاستلام: ما تخلص والو دركا. تستلم الطلب، تشوفو، ومن بعد تخلص لعامل التوصيل.' },
  { q: 'شحال سومة التوصيل وشحال يطوّل؟', a: <>عرض 6 علب: التوصيل مجاني. عرض 3 علب: حسب الولاية، من {deskMin} د.ج للمكتب ومن {homeMin} د.ج للدار (يبان السعر الصحيح في الاستمارة). مدة التوصيل: <Todo>délai de livraison habituel</Todo>.</> },
  { q: 'كيفاش نعرف باللي الطلب تسجّل؟', a: 'كي تبعث الاستمارة يبانلك ميساج تأكيد، ومن بعد نعيطولك باش نأكدو العنوان والكمية قبل ما نبعثو.' },
];

export default function LandingPagePigma({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  const [offerId, setOfferId] = useState<PigmaOfferId>('pack6');
  const [count, setCount] = useState(1);
  const [area, setArea] = useState(20);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSticky, setShowSticky] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const checkoutFiredRef = useRef(false);
  const viewFiredRef = useRef({ tt: false, fb: false });
  const counterRef = useRef<HTMLSpanElement>(null);
  const gsapRef = useRef<any>(null);
  const rate = usdRate(config);
  const offer = getOffer(offerId);

  // En développement uniquement : ?rendement=0.5&couches=2 pour tester la calculatrice avant d'avoir la fiche technique
  const spec = useMemo(() => {
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(window.location.search);
      const r = Number(q.get('rendement')), c = Number(q.get('couches'));
      if (r > 0 && c > 0) return { kgPerM2PerCoat: r, coats: c };
    }
    return SPEC;
  }, []);

  useEffect(() => { document.title = 'Stop Fuites شفاف من Pigma Color – الدفع عند الاستلام'; }, []);

  // ViewContent (TikTok + Meta) une seule fois dès que les pixels sont prêts
  useEffect(() => {
    const value = Number((PIGMA_UNIT_PRICE / rate).toFixed(2));
    const content = { content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name };
    const fired = viewFiredRef.current;
    const stopTt = whenReady(() => !!window.ttq, () => {
      if (fired.tt) return; fired.tt = true;
      window.ttq.track('ViewContent', { contents: [content], value, currency: 'USD' });
    });
    const stopFb = whenReady(() => !!window.fbq, () => {
      if (fired.fb) return; fired.fb = true;
      window.fbq('track', 'ViewContent', { content_name: PIGMA_PRODUCT.name, content_ids: [PIGMA_PRODUCT.id], content_type: 'product', value, currency: 'USD' });
    });
    return () => { stopTt(); stopFb(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AddToCart à chaque choix d'offre par l'utilisateur
  const trackAddToCart = (id: PigmaOfferId, n: number) => {
    const o = getOffer(id);
    const value = Number(((o.price * n) / rate).toFixed(2));
    const content = { content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name, quantity: o.boxes * n };
    if (window.ttq) window.ttq.track('AddToCart', { contents: [content], value, currency: 'USD' });
    if (window.fbq) window.fbq('track', 'AddToCart', { content_ids: [PIGMA_PRODUCT.id], content_type: 'product', content_name: o.title, value, currency: 'USD', num_items: o.boxes * n });
  };

  const selectOffer = (id: PigmaOfferId, n = count) => {
    setOfferId(id);
    setCount(n);
    trackAddToCart(id, n);
    const g = gsapRef.current;
    const el = document.querySelector(`[data-offer="${id}"]`);
    if (g && el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      g.fromTo(el, { scale: 0.96 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    }
  };

  // InitiateCheckout à la première interaction avec le formulaire
  const handleFirstInteraction = () => {
    if (checkoutFiredRef.current) return;
    checkoutFiredRef.current = true;
    const value = Number(((offer.price * count) / rate).toFixed(2));
    const content = { content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name };
    if (window.ttq) window.ttq.track('InitiateCheckout', { contents: [content], value, currency: 'USD' });
    if (window.fbq) window.fbq('track', 'InitiateCheckout', { content_ids: [PIGMA_PRODUCT.id], content_type: 'product', value, currency: 'USD', num_items: offer.boxes * count });
    if (window.gtag && config?.ga4MeasurementId) window.gtag('event', 'begin_checkout', { currency: 'USD', value, items: [{ item_id: PIGMA_PRODUCT.id, item_name: PIGMA_PRODUCT.name, price: value, quantity: 1 }] });
  };

  const toForm = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('order')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // Bouton collant : visible une fois le hero dépassé, masqué quand le formulaire est à l'écran
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setShowSticky(true); return; }
    let heroPassed = false, formVisible = false;
    const update = () => setShowSticky(heroPassed && !formVisible);
    const heroObs = new IntersectionObserver(([e]) => { heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0; update(); });
    const formObs = new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update(); }, { threshold: 0.05 });
    const hero = document.getElementById('pg-hero'); const form = document.getElementById('order');
    if (hero) heroObs.observe(hero); if (form) formObs.observe(form);
    return () => { heroObs.disconnect(); formObs.disconnect(); };
  }, []);

  // GSAP + ScrollTrigger chargés après le premier affichage (n'impactent pas le LCP)
  useEffect(() => {
    let cancelled = false;
    let mm: any = null;
    const start = () => Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      gsapRef.current = gsap;
      mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Apparition des blocs (uniquement ceux encore sous l'écran, pour éviter tout clignotement)
        gsap.utils.toArray<HTMLElement>('.pg-reveal').forEach(el => {
          if (el.getBoundingClientRect().top < window.innerHeight) return;
          gsap.from(el, { y: 32, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
        });
        // Gouttes qui glissent sur la surface traitée / l'eau qui pénètre la surface nue
        const surface = document.getElementById('pg-surface');
        if (surface) {
          const tl = gsap.timeline({ scrollTrigger: { trigger: surface, start: 'top 80%', end: 'bottom 25%', scrub: 0.6 } });
          tl.to('.pg-slide-drop', { y: (i: number) => 150 + i * 12, x: (i: number) => (i % 2 ? 10 : -6), scaleY: 1.25, opacity: 0, ease: 'power2.in', stagger: 0.06 }, 0)
            .fromTo('.pg-stain', { opacity: 0.1, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1.15, ease: 'none' }, 0)
            .to('.pg-soak-drop', { scale: 0.2, opacity: 0, transformOrigin: '50% 50%', ease: 'power1.in' }, 0);
        }
        // Le badge de l'offre flotte légèrement dans le hero
        gsap.to('.pg-hero-badge', { y: -6, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
    });
    const w = window as any;
    const id = 'requestIdleCallback' in w ? w.requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 600);
    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in w) w.cancelIdleCallback(id); else clearTimeout(id);
      mm?.revert();
    };
  }, []);

  // Calculatrice
  const calcReady = spec.kgPerM2PerCoat != null && spec.coats != null;
  const kgNeeded = calcReady ? area * spec.kgPerM2PerCoat! * spec.coats! : 0;
  const boxesNeeded = calcReady ? Math.max(1, Math.ceil(kgNeeded / PIGMA_BOX_KG)) : 0;
  const suggestion = calcReady ? bestOffer(boxesNeeded) : null;

  // Compteur animé du nombre de boîtes
  useEffect(() => {
    const el = counterRef.current;
    if (!el || !calcReady) return;
    const g = gsapRef.current;
    const from = Number(el.textContent) || 0;
    if (!g || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = String(boxesNeeded); return; }
    const obj = { v: from };
    const tween = g.to(obj, { v: boxesNeeded, duration: 0.6, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
    return () => { tween.kill(); };
  }, [boxesNeeded, calcReady]);

  const deskMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.desk));
  const homeMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.home));
  // variante légère 480 px (scripts/gen-image.mjs) : le fond est à 30 % d'opacité
  const heroBg = ambiance('hero-rain-roof')?.replace('.webp', '-sm.webp');

  return (
    <div className="pg-root min-h-screen bg-[#F3F7FB] font-sans text-slate-800 overflow-x-hidden" dir="rtl" lang="ar">
      <style>{STYLES}</style>

      {/* Bandeau de réassurance */}
      <div className="bg-[#FFD60A] text-[#0B1B3F] text-[12.5px] font-black py-2 px-3 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1"><Banknote size={15} /> الدفع عند الاستلام</span>
        <span className="w-px h-3.5 bg-[#0B1B3F]/30" />
        <span className="flex items-center gap-1"><Truck size={15} /> التوصيل لـ 69 ولاية</span>
      </div>

      {/* HERO */}
      <header id="pg-hero" className="relative bg-[#0B1B3F] text-white overflow-hidden">
        {heroBg && <img src={heroBg} alt="" aria-hidden="true" decoding="async" fetchPriority="low" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(46,196,241,.28),transparent_60%),linear-gradient(180deg,rgba(11,27,63,.4),#0B1B3F_92%)]" aria-hidden="true" />
        <Beads n={16} seed={5} />
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-12 lg:pt-14 lg:pb-20 flex flex-col lg:grid lg:grid-cols-[1.05fr_.95fr] lg:gap-x-12 lg:[grid-template-areas:'title_photo''text_photo'] lg:items-center">
          <div className="lg:[grid-area:title] lg:self-end">
            <p className="inline-flex items-center gap-1.5 text-[12.5px] font-bold bg-white/10 ring-1 ring-white/15 rounded-full px-3 py-1">
              <CloudRain size={14} className="text-[#7DD9FF]" /> التسربات مع الشتا؟
            </p>
            <h1 className="mt-3 text-[27px] lg:text-[46px] leading-[1.25] font-black tracking-tight">
              القطرة راجعة مع الشتا؟<br />
              <span className="text-[#FFD60A]">سكّرلها الطريق</span> من السطح
            </h1>
          </div>

          <div className="relative mt-5 lg:mt-0 lg:[grid-area:photo]">
            <div className="relative mx-auto w-[74%] max-w-[300px] lg:w-full lg:max-w-[380px] rounded-[30px] overflow-hidden ring-1 ring-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,.7)] bg-[#0E2A5C]" style={{ aspectRatio: `${PHOTO_HERO.w} / ${PHOTO_HERO.h}` }}>
              <img src={PHOTO_HERO.src} alt={PHOTO_HERO.alt} width={PHOTO_HERO.w} height={PHOTO_HERO.h} fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
              <span className="absolute top-2.5 right-2.5 bg-white text-[#0B1B3F] text-[11.5px] font-black rounded-full px-2.5 py-1 shadow flex items-center gap-1"><BadgeCheck size={13} className="text-[#1366d6]" /> صورة حقيقية</span>
            </div>
            <div className="pg-hero-badge relative -mt-7 mx-auto w-[86%] max-w-[330px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] px-4 py-2.5 text-center shadow-2xl ring-4 ring-[#0B1B3F]">
              <p className="text-[16px] font-black leading-snug flex items-center justify-center gap-1.5"><Gift size={17} /> 4 علب + 2 مجانيات</p>
              <p className="text-[13px] font-black">والتوصيل مجاني</p>
            </div>
          </div>

          <div className="lg:hidden mt-5">
            <button type="button" onClick={toForm}
              className="pg-shine relative overflow-hidden w-full h-[60px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[18.5px] font-black flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/20 active:scale-[0.98] transition-transform">
              <ShoppingCart size={21} /> اطلب الآن – الدفع عند الاستلام
            </button>
            <p className="mt-2 text-center text-[13px] font-semibold text-sky-100/75">ما تخلص والو دركا · تخلص كي تستلم</p>
          </div>

          <div className="mt-7 lg:mt-0 lg:[grid-area:text] lg:self-start">
            <p className="text-[16px] lg:text-[19px] font-semibold text-sky-100/90 leading-relaxed lg:mt-5">
              <b className="text-white">Stop Fuites</b> من <b className="text-white">Pigma Color</b>، النسخة <b className="text-white">الشفافة</b>:
              غشاء مرن ومانع للتسربات يتدهن من برّا، يحمي السطح وما يبدلش الشكل الطبيعي تاع الزليج.
            </p>
            <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-[12px] font-bold">
              {[{ Icon: Eye, t: 'شفاف' }, { Icon: Layers, t: 'غشاء مرن' }, { Icon: ShieldCheck, t: 'ضد التسربات' }].map(({ Icon, t }) => (
                <li key={t} className="rounded-2xl bg-white/[.07] ring-1 ring-white/10 py-3 flex flex-col items-center gap-1"><Icon size={20} className="text-[#7DD9FF]" />{t}</li>
              ))}
            </ul>
            <div className="hidden lg:block mt-7">
              <button type="button" onClick={toForm}
                className="pg-shine relative overflow-hidden w-full max-w-md h-[60px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[19px] font-black flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/20 active:scale-[0.98] transition-transform">
                <ShoppingCart size={21} /> اطلب الآن – الدفع عند الاستلام
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* LE PROBLÈME */}
      <Section className="bg-white">
        <div className="pg-reveal"><Kicker>كل شتا نفس الحكاية</Kicker><H2>القطرة ما تجيش وحدها…</H2>
          <p className="mt-3 text-[16px] font-semibold text-slate-600 leading-relaxed">الماء يدخل من الشقوق الصغار في السطح ولا التيراس، ويبان الضرر في الداخل:</p>
        </div>
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {[
            { id: 'damp-ceiling', Icon: CloudRain, t: 'تبقيع الرطوبة في السقف', d: 'بقع صفرا وكحلة تكبر مع كل شتا، وريحة الرطوبة في البيت.' },
            { id: 'peeling-paint', Icon: BrickWall, t: 'الصباغة تنفخ وتطيح', d: 'تصبغ، والشتا الجاية ترجع تنفخ وتتقشر من جديد.' },
            { id: 'roof-tiles-rain', Icon: Banknote, t: 'الإيطانشيتي غالية', d: 'التكسير، المواد، والمعلم المختص… مصاريف كبيرة وأيام خدمة.' },
          ].map(c => (
            <article key={c.t} className="pg-reveal rounded-3xl overflow-hidden bg-slate-50 ring-1 ring-slate-200">
              <AmbientFigure id={c.id} alt={c.t} Icon={c.Icon} className="h-36"><Beads n={6} seed={c.t.length} /></AmbientFigure>
              <div className="p-4"><p className="font-black text-[17px] text-[#0B1B3F]">{c.t}</p><p className="mt-1 text-[14px] font-semibold text-slate-600">{c.d}</p></div>
            </article>
          ))}
        </div>
      </Section>

      {/* LA SOLUTION */}
      <section className="relative bg-[#0B1B3F] text-white px-4 py-14 lg:py-20 overflow-hidden">
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="pg-reveal">
            <Kicker dark>الحل</Kicker>
            <H2 dark>غشاء شفاف يخلّي الماء يزلق<br />وما يدخلش</H2>
            <p className="mt-3 text-[16px] font-semibold text-sky-100/85 leading-relaxed">
              على العلبة مكتوب: <b className="text-white" dir="ltr">Membrane élastique étanche</b> و <b className="text-white" dir="ltr">Système anti-infiltrations</b>.
              يعني طبقة مرنة تتدهن على السطح من برّا وتسكّر الطريق على الماء.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                { t: 'شفاف: ما يبدلش الشكل', d: 'النسخة «TRANSPARENT» تحافظ على المظهر الطبيعي: الزليج ولا الدالة يبقاو كيما راهم.' },
                { t: 'مرن (élastique)', d: 'غشاء مرن يتبع حركة السطح مع السخانة والبرد.' },
                { t: 'تطبيق ساهل', d: 'بالرولو ولا البروسة، بلا تكسير وبلا معلم مختص.' },
              ].map(b => (
                <li key={b.t} className="flex gap-3">
                  <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-[#2EC4F1] text-[#0B1B3F] flex items-center justify-center"><Check size={16} strokeWidth={3} /></span>
                  <div><p className="font-black text-[16px]">{b.t}</p><p className="text-[14px] font-semibold text-sky-100/75">{b.d}</p></div>
                </li>
              ))}
              <li className="flex gap-3">
                <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center"><Sun size={15} /></span>
                <div><p className="font-black text-[16px]">الشمس والمدة</p><p className="text-[14px] font-semibold text-sky-100/75"><Todo>durabilité / résistance UV</Todo></p></div>
              </li>
            </ul>
          </div>
          <div className="pg-reveal mt-8 lg:mt-0">
            <SurfaceDemo />
            <p className="mt-2 text-center text-[13px] font-semibold text-sky-100/70">مرّر للتحت: الماء يزلق على الجهة المدهونة ويدخل في الجهة اللي بلا حماية</p>
          </div>
        </div>
      </section>

      {/* OÙ L'UTILISER */}
      <Section className="bg-white" wide>
        <div className="text-center pg-reveal"><Kicker>وين نستعملو؟</Kicker><H2>السطوح اللي يتدهن عليها</H2>
          <p className="mt-2 text-[14px] font-semibold text-slate-500">الاستعمالات اللي يذكرها البائعين. القائمة الرسمية: <Todo>fiche technique Pigma Color</Todo></p>
        </div>
        <AmbientFigure id="terrace-tiles-rain" alt="تيراس مزلّج أبيض بعد الشتا" Icon={Grid3x3} className="pg-reveal mt-6 rounded-3xl h-44 lg:h-64" />
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { Icon: House, t: 'السطح (الدالة)', d: 'سطوح الديار' },
            { Icon: Grid3x3, t: 'التيراس', d: 'يخلّي شكل الزليج' },
            { Icon: Building2, t: 'البالكونات والدروج', d: 'الأرضية والحواف' },
            { Icon: Waves, t: 'خزانات الماء والأحواض', d: 'الريزيرفوار والبيسان' },
            { Icon: Bath, t: 'الحمام والكوزينة', d: 'البلايص الرطبة' },
            { Icon: CornerDownLeft, t: 'الزوايا والترابيات', d: 'تسربات حول القنوات' },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="pg-reveal relative rounded-3xl p-4 bg-[#F3F7FB] ring-1 ring-sky-100 text-center">
              <span className="mx-auto mb-2 w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center"><Icon size={26} className="text-[#1366d6]" /></span>
              <p className="font-black text-[15px] text-[#0B1B3F]">{t}</p>
              <p className="text-[12.5px] font-semibold text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* COMMENT L'APPLIQUER */}
      <Section className="bg-[#F3F7FB]" wide>
        <div className="text-center pg-reveal"><Kicker>بلا معلم</Kicker><H2>كيفاش تدهنو؟</H2></div>
        <div className="mt-7 lg:grid lg:grid-cols-[1.1fr_.9fr] lg:gap-10">
          <ol className="space-y-3">
            {[
              { Icon: Sparkles, t: 'نقّي السطح مليح', d: 'نحّي الغبرة، الوسخ والزيوت، والطلاء اللي راهو يتقشر.' },
              { Icon: Sun, t: 'خلّيه ينشف مليح', d: <>السطح لازم يكون ناشف قبل الدهان. ظروف التطبيق: <Todo>température min/max et délai sans pluie</Todo></> },
              { Icon: PaintRoller, t: 'ادهن بالرولو ولا البروسة', d: <>ركّز على الشقوق والزوايا والفواصل. يُنصح بـ <b>طبقتين</b> باش تكون النتيجة أحسن.</> },
              { Icon: Droplets, t: 'خلّيه ينشف', d: <>ما تمشيش عليه وما يمسوش الماء حتى ينشف: <Todo>temps de séchage</Todo></> },
            ].map((s, i) => (
              <li key={s.t} className="pg-reveal flex gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                <span className="shrink-0 w-12 h-12 rounded-2xl bg-[#0B1B3F] text-[#FFD60A] font-black flex items-center justify-center text-[20px]">{i + 1}</span>
                <div className="min-w-0"><p className="font-black text-[16px] text-[#0B1B3F] flex items-center gap-1.5"><s.Icon size={17} className="text-[#1366d6]" /> {s.t}</p>
                  <p className="text-[14px] font-semibold text-slate-600 leading-relaxed">{s.d}</p></div>
              </li>
            ))}
          </ol>
          <div className="mt-5 lg:mt-0 space-y-3">
            <AmbientFigure id="roller-apply" alt="تطبيق طبقة شفافة بالرولو على سطح من البيتون" Icon={PaintRoller} className="pg-reveal rounded-3xl h-44 lg:h-56">
              <Beads n={8} seed={3} />
            </AmbientFigure>
            {/* Emplacement vidéo : chargée seulement au clic */}
            <div className="pg-reveal relative rounded-3xl overflow-hidden bg-[#0B1B3F] ring-1 ring-slate-200" style={{ aspectRatio: '9 / 12' }}>
              {VIDEO && videoOn ? (
                <video src={(VIDEO as { src: string }).src} poster={(VIDEO as { poster: string }).poster} controls autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <button type="button" onClick={() => VIDEO && setVideoOn(true)} className="absolute inset-0 w-full h-full text-white" aria-label="شغّل فيديو تجربة الماء">
                  <img src={PHOTO_DROPS.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-45" />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#0B1B3F] via-transparent to-transparent" />
                  <span className="relative mx-auto w-16 h-16 rounded-full bg-[#FFD60A] text-[#0B1B3F] flex items-center justify-center shadow-xl"><Play size={28} fill="currentColor" /></span>
                  <span className="absolute bottom-4 inset-x-4 text-center">
                    <span className="block font-black text-[17px]">شوف تجربة الماء بعينيك</span>
                    {!VIDEO && <span className="block mt-1"><Todo>vidéo réelle du test à l'eau</Todo></span>}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* CALCULATEUR */}
      <Section className="bg-white">
        <div className="pg-reveal relative overflow-hidden rounded-[32px] bg-[#0B1B3F] text-white p-5 lg:p-8">
          <Beads n={10} seed={9} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1"><Calculator size={22} className="text-[#7DD9FF]" /><p className="font-black text-[20px]">شحال من علبة تلزمك؟</p></div>
            <p className="text-[14px] text-sky-100/80 font-semibold mb-5">اكتب مساحة السطح بالمتر المربع</p>
            <label htmlFor="pg-area" className="sr-only">المساحة بالمتر المربع</label>
            <div className="flex items-center gap-3">
              <input id="pg-area" type="number" inputMode="decimal" min={1} max={1000} value={area}
                onChange={e => setArea(Math.min(1000, Math.max(0, Number(e.target.value) || 0)))}
                className="w-28 h-14 rounded-2xl bg-white text-[#0B1B3F] text-[26px] font-black text-center outline-none ring-4 ring-transparent focus:ring-[#2EC4F1]/60" />
              <span className="text-[20px] font-black">م²</span>
            </div>
            <input type="range" min={1} max={200} step={1} value={Math.min(area, 200)} onChange={e => setArea(Number(e.target.value))}
              aria-label="مساحة السطح بالمتر المربع" className="mt-4 w-full accent-[#FFD60A] h-2" />
            <div className="mt-5 grid grid-cols-2 gap-2 text-center">
              <div className="pg-calc-boxes rounded-2xl bg-white/10 py-4">
                <p className="text-[12px] text-sky-100/75 font-bold">عدد العلب (1,4 كلغ)</p>
                <p className="text-[38px] leading-none mt-1 font-black text-[#FFD60A]">{calcReady ? <span ref={counterRef}>0</span> : '—'}</p>
              </div>
              <div className="pg-calc-offer rounded-2xl bg-white/10 py-4 px-2">
                <p className="text-[12px] text-sky-100/75 font-bold">العرض المناسب</p>
                {suggestion ? (
                  <>
                    <p className="text-[16px] font-black mt-1">{suggestion.count > 1 ? `${suggestion.count} × ` : ''}{suggestion.offer.title}</p>
                    <p className="text-[12.5px] font-bold text-[#7DD9FF]">{suggestion.boxes} علب · {da(suggestion.cost)}</p>
                  </>
                ) : <p className="text-[24px] font-black mt-1">—</p>}
              </div>
            </div>
            {suggestion ? (
              <button type="button" onClick={() => { selectOffer(suggestion.offer.id, suggestion.count); toForm(); }}
                className="mt-4 w-full h-[54px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] font-black text-[17px] active:scale-[0.98] transition-transform">اطلب العرض المناسب</button>
            ) : (
              <p className="mt-4 rounded-2xl bg-white/10 p-3 text-[13px] font-semibold text-sky-100/85 flex items-start gap-2">
                <Info size={17} className="shrink-0 mt-0.5" /> <span>الحساب يتفعّل كي نأكدو الاستهلاك في المتر المربع (طبقتين): <Todo>rendement kg/m² par couche</Todo></span>
              </p>
            )}
            {calcReady && <p className="mt-2 text-[11.5px] text-sky-100/60 font-semibold">الحساب: {spec.kgPerM2PerCoat} كلغ/م² × {spec.coats} طبقات. السطح اللي يشرب بزاف يقدر يحتاج أكثر شوية.</p>}
          </div>
        </div>
      </Section>

      {/* OFFRES */}
      <Section id="offres" className="bg-[#F3F7FB]">
        <div className="text-center pg-reveal"><Kicker>العروض</Kicker><H2>كل ما تدّي أكثر، توفّر أكثر</H2>
          <p className="mt-2 text-[15px] font-semibold text-slate-500">السعر العادي: {da(PIGMA_UNIT_PRICE)} للعلبة</p>
        </div>
        <div className="mt-7 grid gap-4 lg:grid-cols-2" role="radiogroup" aria-label="اختار العرض">
          {PIGMA_OFFERS.map(o => {
            const active = o.id === offerId;
            const saving = o.boxes * PIGMA_UNIT_PRICE - o.price;
            return (
              <button key={o.id} data-offer={o.id} type="button" role="radio" aria-checked={active} onClick={() => selectOffer(o.id, 1)}
                className={`pg-offer pg-reveal relative text-right rounded-[28px] p-5 border-2 transition-all hover:-translate-y-0.5 ${
                  active ? 'border-[#1366d6] bg-white shadow-[0_24px_50px_-24px_rgba(19,102,214,.6)]' : 'border-slate-200 bg-white/70'}`}>
                {o.badge && <span className="absolute -top-3 right-5 text-[12.5px] font-black text-[#0B1B3F] bg-[#FFD60A] rounded-full px-3 py-1 shadow">⭐ {o.badge}</span>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[20px] font-black text-[#0B1B3F]">{o.title}</p>
                    <p className="text-[14px] font-bold text-slate-500">{o.boxes} علب × 1,4 كلغ</p>
                  </div>
                  <span className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#1366d6] bg-[#1366d6] text-white' : 'border-slate-300'}`}>
                    {active && <Check size={16} strokeWidth={3} />}
                  </span>
                </div>
                {/* boîtes payées / offertes */}
                <div className="mt-3 flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: o.boxes }, (_, i) => (
                    <span key={i} className={`h-9 flex-1 max-w-9 rounded-lg flex items-center justify-center text-[10px] font-black ${i < o.paid ? 'bg-[#0B1B3F] text-white' : 'bg-[#FFD60A] text-[#0B1B3F]'}`}>
                      {i < o.paid ? '1,4' : 'مجانا'}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[30px] leading-none font-black text-[#0B1B3F]">{da(o.price)}</p>
                    <p className="mt-1 text-[13px] font-bold text-slate-400 line-through">{da(o.boxes * PIGMA_UNIT_PRICE)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-bold text-slate-600">≈ {da(Math.round(o.price / o.boxes))} للعلبة</p>
                    <p className="text-[13px] font-black text-emerald-600">توفّر {da(saving)}</p>
                  </div>
                </div>
                <p className={`mt-3 rounded-xl px-3 py-2 text-[13.5px] font-black flex items-center gap-1.5 ${o.freeDelivery ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  <Truck size={16} /> {o.freeDelivery ? 'التوصيل مجاني' : 'التوصيل حسب الولاية'}
                </p>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={toForm}
          className="pg-shine pg-reveal relative overflow-hidden mt-5 w-full h-[58px] rounded-2xl bg-[#0B1B3F] text-white text-[18px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <ShoppingCart size={20} /> كمّل الطلب – {offer.title}
        </button>
      </Section>

      {/* FORMULAIRE */}
      <section id="order" className="relative px-4 py-14 lg:py-20 scroll-mt-2 bg-gradient-to-b from-[#0B1B3F] to-[#0E2A5C]">
        <Beads n={12} seed={11} />
        <div className="relative max-w-xl mx-auto">
          <CheckoutFormPigma offerId={offerId} onOfferChange={id => selectOffer(id, count)} count={count} onCountChange={n => setCount(n)}
            sourceTag={SOURCE_TAG} onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction} />
        </div>
      </section>

      {/* RÉASSURANCE */}
      <Section className="bg-white" wide>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { Icon: Banknote, t: 'الدفع عند الاستلام', d: 'ما تخلص والو قبل' },
            { Icon: Truck, t: 'التوصيل لـ 69 ولاية', d: 'للدار ولا للمكتب' },
            { Icon: PhoneCall, t: 'نعيطولك نأكدو', d: 'قبل ما نبعثو الطلب' },
            { Icon: BadgeCheck, t: 'صور حقيقية للعلبة', d: 'Pigma Color · Stop Fuites' },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="pg-reveal rounded-3xl bg-[#F3F7FB] p-4 text-center ring-1 ring-sky-100">
              <Icon size={28} className="mx-auto text-[#1366d6]" /><p className="mt-2 font-black text-[15px] text-[#0B1B3F]">{t}</p><p className="text-[12.5px] font-semibold text-slate-500">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 pg-reveal">
          {[PHOTO_SIZES, PHOTO_HAND].map(p => (
            <figure key={p.src} className="rounded-3xl overflow-hidden ring-1 ring-slate-200 bg-slate-100">
              <img src={p.src} alt={p.alt} width={p.w} height={p.h} loading="lazy" decoding="async" className="w-full h-64 lg:h-96 object-cover" />
            </figure>
          ))}
        </div>
        <p className="mt-2 text-center text-[12.5px] font-semibold text-slate-500">صور حقيقية للمنتج: علبة 1,4 كلغ (والسطل 5 كلغ للمقارنة)</p>
      </Section>

      {/* FAQ */}
      <Section className="bg-[#F3F7FB]">
        <div className="text-center mb-6 pg-reveal"><Kicker>عندك سؤال؟</Kicker><H2>الأسئلة اللي تتعاود</H2></div>
        <div className="space-y-2">
          {FAQ(deskMin, homeMin).map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white">
                <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-right font-black text-[15.5px] text-[#0B1B3F]">
                  {item.q}<ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && <p className="px-4 pb-4 -mt-1 text-[14.5px] font-semibold text-slate-600 leading-relaxed">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="relative px-4 py-14 bg-[#0B1B3F] text-white text-center overflow-hidden">
        <AmbientFigure id="house-after-storm" alt="" className="absolute inset-0 opacity-40" />
        <Beads n={14} seed={13} />
        <div className="relative max-w-xl mx-auto">
          <H2 dark>ما تستناش حتى تدخل القطرة</H2>
          <p className="mt-2 text-[16px] font-semibold text-sky-100/85">احمي السطح قبل الشتا الجاية، بطبقة شفافة ما تبانش.</p>
          <button type="button" onClick={toForm}
            className="pg-shine relative overflow-hidden mt-6 w-full h-[60px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[18.5px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <ShoppingCart size={21} /> اطلب الآن – الدفع عند الاستلام
          </button>
        </div>
      </section>

      <footer className="px-4 pt-6 pb-28 text-center text-[11.5px] font-semibold text-slate-400 space-y-1">
        <p>Pigma Color و Stop Fuites علامات تجارية لأصحابها. YANIS SHOP بائع للمنتج.</p>
        <p>الصور المكتوب عليها «صورة توضيحية» مولّدة للتوضيح فقط وماهيش نتائج حقيقية ولا صور زبائن.</p>
      </footer>

      {/* WhatsApp flottant */}
      <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('السلام عليكم، عندي سؤال على Stop Fuites الشفاف')}`} target="_blank" rel="noopener noreferrer"
        aria-label="تواصل معنا على واتساب"
        className={`pg-wa fixed left-4 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl transition-[bottom] duration-300 ${showSticky ? 'bottom-[92px]' : 'bottom-5'}`}>
        <MessageCircle size={28} fill="currentColor" />
      </a>

      {/* Bouton de commande collant */}
      <div className={`fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!showSticky}>
        <div className="max-w-xl mx-auto bg-[#0B1B3F]/95 backdrop-blur px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:rounded-t-3xl">
          <button type="button" tabIndex={showSticky ? 0 : -1} onClick={toForm}
            className="pg-shine relative overflow-hidden w-full h-[54px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[16.5px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <ShoppingCart size={20} /> اطلب الآن – {offer.boxes * count} علب بـ {da(offer.price * count)}
          </button>
        </div>
      </div>
    </div>
  );
}
