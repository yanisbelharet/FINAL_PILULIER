import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck, Truck, Banknote, PhoneCall, Droplets, ShoppingCart, Check, ChevronDown, Play, Sparkles, PaintRoller, Sun,
  Calculator, BadgeCheck, MessageCircle, Eye, Layers, CloudRain, Gift,
} from 'lucide-react';
import CheckoutFormPigma, { PIGMA_PRODUCT, PIGMA_UNIT_PRICE, PIGMA_BOX_KG, getOffer, da, boxesLabel } from './CheckoutFormPigma';
import { DELIVERY_PRICES } from './data';
import ambianceList from './pigma-ambiance.json';

// Étiquette envoyée dans le champ `source` des commandes de cette page
const SOURCE_TAG = 'LP pigma-stop-fuites';
const WHATSAPP = '213557920685';
const A = '/lp-assets/pigma/';

// Vraie photo fournie par la boutique (boîte non retouchée)
const PHOTO_HERO = { src: A + 'pot-transparent-1-4kg.webp', alt: 'علبة Pigma Color Stop Fuites الشفافة 1,4 كلغ', w: 495, h: 619 };

// Vidéo officielle Pigma Color (extrait 0:36–1:20 : application sur terrasse + test de la caisse en carton, sans la carte de contact)
const VIDEO = { src: A + 'test-eau.mp4', poster: A + 'test-eau.webp' };

// Rendement fourni par la boutique : 1 kg couvre 4 m² en deux couches, donc une boîte de 1,4 kg ≈ 5,6 m²
const M2_PER_KG = 4;
const M2_PER_BOX = PIGMA_BOX_KG * M2_PER_KG;
// Au-delà, la boutique fait un tarif personnalisé
const CALC_MAX_BOXES = 9;
const offerForBoxes = (n: number) => (n <= 1 ? 'pack1' : n <= 3 ? 'pack3' : n <= 6 ? 'pack6' : n === 7 ? 'combo7' : 'combo9');

// Fond du hero (image d'ambiance générée, variante légère 480 px affichée à 30 % d'opacité)
const heroBg = (ambianceList as string[]).includes('hero-rain-roof') ? '/images/pigma/hero-rain-roof-sm.webp' : null;

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

const STYLES = `
@keyframes pg-shine { 0% { transform: translateX(120%) } 60%,100% { transform: translateX(-220%) } }
@keyframes pg-bead { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
@keyframes pg-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(37,211,102,.55) } 70% { box-shadow: 0 0 0 12px rgba(37,211,102,0) } }
.pg-shine::after { content:''; position:absolute; inset:0; width:40%; background:linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent); animation: pg-shine 3.4s ease-in-out infinite; }
/* goutte "verre mouillé" : reflet en haut, ombre portée en bas */
.pg-drop { position:absolute; border-radius:50%; background:radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0 10%, rgba(255,255,255,.28) 24%, rgba(150,215,255,.10) 55%, rgba(10,40,90,.28) 100%); box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 3px rgba(255,255,255,.25); }
.pg-bead { animation: pg-bead 3s ease-in-out infinite; }
.pg-wa { animation: pg-pulse 2.4s infinite; }
.pg-offer:active { transform: scale(.985); }
@media (prefers-reduced-motion: reduce) {
  .pg-bead,.pg-wa { animation: none !important; }
  .pg-shine::after { display: none; }
  html { scroll-behavior: auto; }
}`;

const Section = ({ id, className = '', children, wide = false }: { id?: string; className?: string; children: React.ReactNode; wide?: boolean }) => (
  <section id={id} className={`px-4 py-12 lg:py-16 ${className}`}><div className={`mx-auto ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>{children}</div></section>
);
const H2 = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <h2 className={`text-[26px] lg:text-[34px] leading-[1.25] font-black ${dark ? 'text-white' : 'text-[#0B1B3F]'}`}>{children}</h2>
);

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
  <div id="pg-surface" className="relative rounded-[28px] overflow-hidden ring-1 ring-slate-200 bg-[#0a1f47]" style={{ aspectRatio: '4 / 3' }}>
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
      {[[262, 118, 11], [322, 150, 13], [238, 196, 12], [300, 232, 15], [356, 206, 10], [270, 268, 12]].map(([x, y, r], i) => (
        <g key={i} className="pg-slide-drop">
          <ellipse cx={x} cy={y + r * 0.7} rx={r} ry={r * 0.3} fill="rgba(0,0,0,.22)" />
          <circle cx={x} cy={y} r={r} fill="url(#pg-dropg)" />
        </g>
      ))}
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
  { q: 'شحال تغطي العلبة؟', a: 'كل 1 كلغ يغطي حوالي 4 م² بطبقتين. يعني العلبة تاع 1,4 كلغ تغطي حوالي 5,6 م². استعمل الحاسبة باش تعرف شحال من علبة تلزمك.' },
  { q: 'شحال من وقت باش ينشف؟', a: 'طبقة التحضير: 6 ساعات. بين الطبقة الأولى والثانية: 24 ساعة. وما لازمش تطيح الشتا 24 حتى 48 ساعة من بعد الدهان.' },
  { q: 'علاش يبان أبيض كي ندهنو؟', a: 'عادي. كي يتدهن يكون سايل وشوية أبيض كي الحليب، ويولي شفاف وما يبانش غير كي ينشف كامل.' },
  { q: 'على واش نقدر ندهنو؟', a: 'السطح والتيراس، البالكونات، الحيوط والياجور، الزليج والفايونس، الحمام وخزانات الماء. لازم السطح يكون نقي، بلا دسم وناشف 100%.' },
  { q: 'إذا السطح كبير وتلزمني أكثر من 9 علب؟', a: 'للكميات الأكبر نعطيوك سعر خاص بيك. ابعثلنا على واتساب المساحة تاعك.' },
  { q: 'شحال سومة التوصيل وشحال يطوّل؟', a: <>عرض 4+2: التوصيل مجاني. علبة وحدة ولا عرض 2+1: حسب الولاية، من {deskMin} د.ج للمكتب ومن {homeMin} د.ج للدار. يوصلك في 24 ساعة، و48 ساعة على الأكثر.</> },
  { q: 'كيفاش نخلص؟', a: 'الدفع عند الاستلام: ما تخلص والو دركا. تستلم الطلب، تشوفو، ومن بعد تخلص لعامل التوصيل.' },
];

export default function LandingPagePigma({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  const [offerId, setOfferId] = useState('pack6');
  const [area, setArea] = useState(10);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSticky, setShowSticky] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const checkoutFiredRef = useRef(false);
  const viewFiredRef = useRef({ tt: false, fb: false });
  const counterRef = useRef<HTMLSpanElement>(null);
  const gsapRef = useRef<any>(null);
  const rate = usdRate(config);
  const offer = getOffer(offerId);

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
  const selectOffer = (id: string) => {
    setOfferId(id);
    const o = getOffer(id);
    const value = Number((o.price / rate).toFixed(2));
    const content = { content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name, quantity: o.boxes };
    if (window.ttq) window.ttq.track('AddToCart', { contents: [content], value, currency: 'USD' });
    if (window.fbq) window.fbq('track', 'AddToCart', { content_ids: [PIGMA_PRODUCT.id], content_type: 'product', content_name: o.title, value, currency: 'USD', num_items: o.boxes });
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
    const value = Number((offer.price / rate).toFixed(2));
    const content = { content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name };
    if (window.ttq) window.ttq.track('InitiateCheckout', { contents: [content], value, currency: 'USD' });
    if (window.fbq) window.fbq('track', 'InitiateCheckout', { content_ids: [PIGMA_PRODUCT.id], content_type: 'product', value, currency: 'USD', num_items: offer.boxes });
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

  // Calculatrice (limitée à 9 boîtes ; au-delà, tarif personnalisé)
  const boxesNeeded = area > 0 ? Math.ceil(area / M2_PER_BOX - 1e-9) : 0;
  const tooBig = boxesNeeded > CALC_MAX_BOXES;
  const suggestion = boxesNeeded > 0 && !tooBig ? getOffer(offerForBoxes(boxesNeeded)) : null;

  // Compteur animé du nombre de boîtes
  useEffect(() => {
    const el = counterRef.current;
    if (!el || tooBig) return;
    const g = gsapRef.current;
    const from = Number(el.textContent) || 0;
    if (!g || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = String(boxesNeeded); return; }
    const obj = { v: from };
    const tween = g.to(obj, { v: boxesNeeded, duration: 0.5, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
    return () => { tween.kill(); };
  }, [boxesNeeded, tooBig]);

  const deskMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.desk));
  const homeMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.home));
  const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  return (
    <div className="min-h-screen bg-[#F3F7FB] font-sans text-slate-800 overflow-x-hidden" dir="rtl" lang="ar">
      <style>{STYLES}</style>

      {/* Bandeau de réassurance */}
      <div className="bg-[#FFD60A] text-[#0B1B3F] text-[12.5px] font-black py-2 px-3 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1"><Banknote size={15} /> الدفع عند الاستلام</span>
        <span className="w-px h-3.5 bg-[#0B1B3F]/30" />
        <span className="flex items-center gap-1"><Truck size={15} /> 69 ولاية · 24 حتى 48 ساعة</span>
      </div>

      {/* HERO */}
      <header id="pg-hero" className="relative bg-[#0B1B3F] text-white overflow-hidden">
        {heroBg && <img src={heroBg} alt="" aria-hidden="true" decoding="async" fetchPriority="low" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(46,196,241,.28),transparent_60%),linear-gradient(180deg,rgba(11,27,63,.4),#0B1B3F_92%)]" aria-hidden="true" />
        <Beads n={16} seed={5} />
        <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10 lg:pt-14 lg:pb-16 flex flex-col lg:grid lg:grid-cols-[1.05fr_.95fr] lg:gap-x-12 lg:[grid-template-areas:'title_photo''text_photo'] lg:items-center">
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
          </div>

          <div className="mt-6 lg:mt-0 lg:[grid-area:text] lg:self-start">
            <p className="text-[16px] lg:text-[19px] font-semibold text-sky-100/90 leading-relaxed lg:mt-5">
              <b className="text-white">Stop Fuites</b> من <b className="text-white">Pigma Color</b>، النسخة <b className="text-white">الشفافة</b>:
              غشاء مرن يتدهن من برّا، يسكّر على الماء وما يبدلش شكل الزليج.
            </p>
            <div className="hidden lg:block mt-7">
              <button type="button" onClick={toForm}
                className="pg-shine relative overflow-hidden w-full max-w-md h-[60px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[19px] font-black flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/20 active:scale-[0.98] transition-transform">
                <ShoppingCart size={21} /> اطلب الآن – الدفع عند الاستلام
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* VIDÉO : la preuve, juste après le hero (chargée seulement au clic) */}
      <Section className="bg-[#0E2A5C] text-white">
        <div className="text-center pg-reveal">
          <H2 dark>شوف التجربة: الماء ما يدخلش</H2>
          <p className="mt-2 text-[14.5px] font-semibold text-sky-100/80">فيديو Pigma Color: كرتونة مدهونة عامرة بالماء، وبعد 48 ساعة بقات صحيحة</p>
        </div>
        <div className="pg-reveal relative mt-5 mx-auto w-full max-w-[340px] rounded-[28px] overflow-hidden bg-[#0B1B3F] ring-1 ring-white/10" style={{ aspectRatio: '9 / 16' }}>
          {videoOn ? (
            <video src={VIDEO.src} poster={VIDEO.poster} controls autoPlay playsInline preload="none" className="w-full h-full object-cover" />
          ) : (
            <button type="button" onClick={() => setVideoOn(true)} className="absolute inset-0 w-full h-full flex items-center justify-center" aria-label="شغّل فيديو تجربة الماء">
              <img src={VIDEO.poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-75" />
              <span className="relative w-[72px] h-[72px] rounded-full bg-[#FFD60A] text-[#0B1B3F] flex items-center justify-center shadow-xl"><Play size={32} fill="currentColor" /></span>
            </button>
          )}
        </div>
      </Section>

      {/* POURQUOI */}
      <Section className="bg-white" wide>
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="pg-reveal">
            <H2>غشاء شفاف يخلّي الماء يزلق وما يدخلش</H2>
            <ul className="mt-5 space-y-3">
              {[
                { Icon: Eye, t: 'شفاف', d: 'ما يبدلش شكل الزليج ولا الدالة.' },
                { Icon: Layers, t: 'مرن (élastique)', d: 'يتبع حركة السطح مع السخانة والبرد وما يتشققش.' },
                { Icon: Sun, t: 'يقاوم الشمس', d: 'أكريليك مرن يقاوم الأشعة UV والعوامل الجوية.' },
                { Icon: PaintRoller, t: 'بلا تكسير وبلا معلم', d: 'يتدهن بالبروسة ولا بالرولو.' },
              ].map(({ Icon, t, d }) => (
                <li key={t} className="flex gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-2xl bg-sky-50 text-[#1366d6] flex items-center justify-center"><Icon size={20} /></span>
                  <div><p className="font-black text-[16px] text-[#0B1B3F]">{t}</p><p className="text-[14px] font-semibold text-slate-600">{d}</p></div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[13px] font-black text-slate-500">يتدهن على:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['السطح والتيراس', 'البالكون', 'الحيوط والياجور', 'الزليج والفايونس', 'الحمام', 'خزانات الماء'].map(t => (
                <span key={t} className="text-[13px] font-bold text-[#0B1B3F] bg-[#F3F7FB] ring-1 ring-sky-100 rounded-full px-3 py-1.5">{t}</span>
              ))}
            </div>
          </div>
          <div className="pg-reveal mt-8 lg:mt-0">
            <SurfaceDemo />
          </div>
        </div>
      </Section>

      {/* COMMENT L'APPLIQUER */}
      <Section className="bg-[#F3F7FB]">
        <div className="text-center pg-reveal"><H2>كيفاش تدهنو؟ 3 خطوات</H2></div>
        <ol className="mt-6 space-y-3">
          {[
            { Icon: Sparkles, t: 'نقّي ونشّف', d: <>نحّي الغبرة والدسم (بلا أسيد قوي). السطح لازم يكون <b>ناشف 100%</b>.</> },
            { Icon: Droplets, t: 'طبقة تحضير مخففة', d: <>زيد <b>10 حتى 20% ماء</b>، وخلّيها تنشف <b>6 ساعات</b>.</> },
            { Icon: PaintRoller, t: 'جوج طبقات صافيين', d: <>استنى <b>24 ساعة</b> بيناتهم، والثانية بعكس الاتجاه.</> },
          ].map((s, i) => (
            <li key={s.t} className="pg-reveal flex items-center gap-3 rounded-3xl bg-white p-4 ring-1 ring-slate-200">
              <span className="shrink-0 w-11 h-11 rounded-2xl bg-[#0B1B3F] text-[#FFD60A] font-black flex items-center justify-center text-[19px]">{i + 1}</span>
              <div className="min-w-0"><p className="font-black text-[16px] text-[#0B1B3F]">{s.t}</p>
                <p className="text-[14px] font-semibold text-slate-600 leading-relaxed">{s.d}</p></div>
            </li>
          ))}
        </ol>
        <ul className="pg-reveal mt-4 rounded-3xl bg-[#0B1B3F] text-white p-4 space-y-2.5 text-[14px] font-semibold text-sky-100/90">
          <li className="flex gap-2.5"><CloudRain size={18} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">بلا شتا</b> 24 حتى 48 ساعة من بعد الدهان.</span></li>
          <li className="flex gap-2.5"><Sun size={18} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">بين 5° و 35°</b>، خير وقت الصباح بكري (ماشي تحت شمس العشية).</span></li>
          <li className="flex gap-2.5"><Eye size={18} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">أبيض كي تدهنو؟ عادي</b>، يولي شفاف كي ينشف كامل.</span></li>
        </ul>
      </Section>

      {/* CALCULATEUR */}
      <Section className="bg-white">
        <div className="pg-reveal relative overflow-hidden rounded-[28px] bg-[#0B1B3F] text-white p-5">
          <Beads n={8} seed={9} />
          <div className="relative">
            <p className="font-black text-[20px] flex items-center gap-2"><Calculator size={22} className="text-[#7DD9FF]" /> شحال من علبة تلزمك؟</p>
            <p className="mt-1 text-[13px] text-sky-100/75 font-semibold">العلبة (1,4 كلغ) تغطي حوالي 5,6 م² بطبقتين.</p>
            <div className="mt-4 flex items-center gap-3">
              <label htmlFor="pg-area" className="text-[14px] font-bold text-sky-100/90">المساحة</label>
              <input id="pg-area" type="number" inputMode="decimal" min={1} max={1000} value={area || ''}
                onChange={e => setArea(Math.min(1000, Math.max(0, Number(e.target.value) || 0)))}
                className="w-24 h-12 rounded-xl bg-white text-[#0B1B3F] text-[22px] font-black text-center outline-none ring-4 ring-transparent focus:ring-[#2EC4F1]/60" />
              <span className="text-[18px] font-black">م²</span>
            </div>
            <input type="range" min={1} max={60} step={1} value={Math.min(Math.max(area, 1), 60)} onChange={e => setArea(Number(e.target.value))}
              aria-label="مساحة السطح بالمتر المربع" className="mt-4 w-full accent-[#FFD60A] h-2" />

            {tooBig ? (
              <div className="mt-4 rounded-2xl bg-[#FFD60A] text-[#0B1B3F] p-4">
                <p className="text-[16px] font-black">تلزمك أكثر من 9 علب</p>
                <p className="mt-1 text-[14px] font-bold">للكميات الأكبر، نعطيوك سعر خاص بيك.</p>
                <a href={waLink(`السلام عليكم، حاب سعر خاص لـ Stop Fuites الشفاف. المساحة: ${area} م²`)} target="_blank" rel="noopener noreferrer"
                  className="mt-3 h-12 rounded-xl bg-[#0B1B3F] text-white font-black flex items-center justify-center gap-2">
                  <MessageCircle size={19} /> اطلب سعرك على واتساب
                </a>
              </div>
            ) : suggestion ? (
              <div className="mt-4 rounded-2xl bg-white/10 p-4 flex items-center gap-4">
                <div className="text-center shrink-0">
                  <p className="text-[40px] leading-none font-black text-[#FFD60A]"><span ref={counterRef} /></p>
                  <p className="text-[12px] font-bold text-sky-100/75">{boxesNeeded === 1 ? 'علبة' : 'علب'}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-sky-100/75">العرض المناسب</p>
                  <p className="text-[15px] font-black leading-snug">{suggestion.title}</p>
                  <p className="text-[13px] font-bold text-[#7DD9FF]">{boxesLabel(suggestion.boxes)} · {da(suggestion.price)}{suggestion.freeDelivery ? ' · توصيل مجاني' : ''}</p>
                </div>
              </div>
            ) : null}
            {suggestion && (
              <button type="button" onClick={() => { selectOffer(suggestion.id); toForm(); }}
                className="mt-3 w-full h-[52px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] font-black text-[17px] active:scale-[0.98] transition-transform">اختار هذا العرض</button>
            )}
            {!tooBig && <p className="mt-3 text-[12px] font-semibold text-sky-100/65">الحاسبة حتى 9 علب. للكميات الأكبر، نعطيوك سعر خاص.</p>}
          </div>
        </div>
      </Section>

      {/* COMMANDE */}
      <section id="order" className="relative px-4 py-12 lg:py-16 scroll-mt-2 bg-gradient-to-b from-[#0B1B3F] to-[#0E2A5C]">
        <Beads n={10} seed={11} />
        <div className="relative max-w-xl mx-auto">
          <CheckoutFormPigma offerId={offerId} onOfferChange={selectOffer} sourceTag={SOURCE_TAG} onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px] font-bold text-sky-100/85">
            <span className="flex flex-col items-center gap-1"><Banknote size={20} className="text-[#FFD60A]" /> الدفع عند الاستلام</span>
            <span className="flex flex-col items-center gap-1"><Truck size={20} className="text-[#FFD60A]" /> 24 حتى 48 ساعة</span>
            <span className="flex flex-col items-center gap-1"><PhoneCall size={20} className="text-[#FFD60A]" /> نعيطولك نأكدو</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <Section className="bg-[#F3F7FB]">
        <div className="text-center mb-5"><H2>عندك سؤال؟</H2></div>
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

      <footer className="px-4 pt-4 pb-28 text-center text-[11.5px] font-semibold text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-1"><ShieldCheck size={13} /> Pigma Color و Stop Fuites علامات تجارية لأصحابها. YANIS SHOP بائع للمنتج.</p>
        <p>صورة الخلفية في الأعلى مولّدة للتوضيح فقط.</p>
      </footer>

      {/* WhatsApp flottant */}
      <a href={waLink('السلام عليكم، عندي سؤال على Stop Fuites الشفاف')} target="_blank" rel="noopener noreferrer"
        aria-label="تواصل معنا على واتساب"
        className={`pg-wa fixed left-4 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xl transition-[bottom] duration-300 ${showSticky ? 'bottom-[92px]' : 'bottom-5'}`}>
        <MessageCircle size={28} fill="currentColor" />
      </a>

      {/* Bouton de commande collant */}
      <div className={`fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!showSticky}>
        <div className="max-w-xl mx-auto bg-[#0B1B3F]/95 backdrop-blur px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:rounded-t-3xl">
          <button type="button" tabIndex={showSticky ? 0 : -1} onClick={toForm}
            className="pg-shine relative overflow-hidden w-full h-[54px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[16.5px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <ShoppingCart size={20} /> اطلب الآن – {boxesLabel(offer.boxes)} بـ {da(offer.price)}
          </button>
        </div>
      </div>
    </div>
  );
}
