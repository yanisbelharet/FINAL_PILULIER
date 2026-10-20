import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck, Truck, Banknote, PhoneCall, Star, Droplets, ShoppingCart, Check, X, ChevronDown, AlertTriangle,
  Sparkles, Home, Building, Waves, Calculator, PackageCheck, Play, Paintbrush, Sun, Clock, BadgeCheck,
} from 'lucide-react';
import CheckoutFormProelasticLP, {
  PROELASTIC_PACKAGES, PROELASTIC_PRODUCT, KG_COVERAGE_M2, ProelasticPackageId,
} from './CheckoutFormProelasticLP';
import { DELIVERY_PRICES } from './data';

// Étiquette envoyée dans le champ `source` des commandes de cette page
const SOURCE_TAG = 'LP proelastic (B)';
const TIKTOK_URL = 'https://www.tiktok.com/@yanishop_dz';
const A = '/lp-assets/proelastic/';

// Photos et vidéos réelles fournies par YANIS SHOP (emballage officiel PROELASTIC)
const PHOTO_HERO = { src: A + 'pot-1kg.webp', alt: 'علبة PROELASTIC الأصلية 1 كلغ من Profinish', w: 342, h: 361 };
const PHOTO_SIZES = { src: A + 'pots-1kg-5kg.webp', alt: 'علبة PROELASTIC 1 كلغ وسطل 5 كلغ', w: 478, h: 641 };
const PHOTO_STOCK = { src: A + 'pots-stock.webp', alt: 'علب PROELASTIC الأصلية متوفرة عند YANIS SHOP', w: 539, h: 569 };
const DEMO_VIDEOS = [
  { src: A + 'demo-carton-1', poster: A + 'demo-carton-1.webp', title: 'الماء يبقى فوق الكرتون ولا يخترقه' },
  { src: A + 'demo-carton-2', poster: A + 'demo-carton-2.webp', title: 'تجربة ثانية في المحل' },
];

// Vrais commentaires TikTok (@yanishop_dz), retranscrits depuis les captures fournies
const REVIEWS = [
  { name: 'سجود', date: '2023-11-23', likes: 5, text: 'صح كاين منها شريتها الحمد لله', shot: 'avis-soujoud.webp', w: 482, h: 333 },
  { name: 'Badradine Saidani', date: '2023-11-24', likes: 1, text: 'والله منتوج هايل لي عنو القطرة يتهنا منها وراني مدايرو فوق الدالة', shot: 'avis-badradine.webp', w: 539, h: 125 },
  { name: 'Ÿạç İñě', date: '2023-11-27', likes: 1, text: 'والله خدمتها نجحت', shot: 'avis-yace.webp', w: 537, h: 276 },
  { name: 'liliane89', date: '2023-11-23', likes: 1, text: 'sah Kayen menha mliha bezzaf', shot: 'avis-liliane.webp', w: 540, h: 222 },
];

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

// Meilleure offre (un seul type d'offre) pour une quantité de kg donnée
const bestOffer = (kgNeeded: number) => {
  const options = PROELASTIC_PACKAGES.map(p => {
    const count = Math.max(1, Math.ceil(kgNeeded / p.kg));
    return { pkg: p, count, cost: count * p.price, kg: count * p.kg };
  });
  return options.sort((a, b) => a.cost - b.cost || a.count - b.count)[0];
};

// Animations CSS (légères, désactivées si l'utilisateur préfère réduire les animations)
const STYLES = `
@keyframes pe-rain { from { transform: translateY(-20px); opacity: 0 } 10% { opacity: .9 } to { transform: translateY(260px); opacity: 0 } }
@keyframes pe-bead { 0%,100% { transform: translateY(0) scale(1) } 50% { transform: translateY(-2px) scale(1.06) } }
@keyframes pe-seep { 0% { transform: translateY(0); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(46px); opacity: 0 } }
@keyframes pe-roll { 0% { transform: translateX(0) } 50% { transform: translateX(-210px) } 100% { transform: translateX(0) } }
@keyframes pe-coat { 0% { transform: scaleX(0) } 50% { transform: scaleX(1) } 100% { transform: scaleX(1) } }
@keyframes pe-stretch { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(1.35) } }
@keyframes pe-crackL { 0%,100% { transform: translateX(0) } 50% { transform: translateX(-12px) } }
@keyframes pe-crackR { 0%,100% { transform: translateX(0) } 50% { transform: translateX(12px) } }
@keyframes pe-shine { 0% { transform: translateX(120%) } 60%,100% { transform: translateX(-220%) } }
@keyframes pe-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes pe-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,.55) } 70% { box-shadow: 0 0 0 10px rgba(245,158,11,0) } }
.pe-drop { position:absolute; top:0; width:2px; height:18px; border-radius:2px; background:linear-gradient(to bottom, rgba(125,211,252,0), rgba(186,230,253,.95)); animation: pe-rain linear infinite; }
.pe-bead { animation: pe-bead 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
.pe-seep { animation: pe-seep 2.2s ease-in infinite; }
.pe-roller { animation: pe-roll 5s ease-in-out infinite; }
.pe-coat { animation: pe-coat 5s ease-in-out infinite; transform-origin: right; transform-box: fill-box; }
.pe-membrane { animation: pe-stretch 3s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
.pe-crackL { animation: pe-crackL 3s ease-in-out infinite; }
.pe-crackR { animation: pe-crackR 3s ease-in-out infinite; }
.pe-shine::after { content:''; position:absolute; inset:0; width:40%; background:linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent); animation: pe-shine 3.2s ease-in-out infinite; }
.pe-float { animation: pe-float 4s ease-in-out infinite; }
.pe-pulse { animation: pe-pulse 2s infinite; }
@keyframes pe-fadeup { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
/* Apparition liée au défilement, sans JavaScript : si le navigateur ne la gère pas, le contenu reste simplement visible */
@supports (animation-timeline: view()) {
  .pe-reveal { animation: pe-fadeup linear both; animation-timeline: view(); animation-range: entry 0% entry 40%; }
}
@media (prefers-reduced-motion: reduce) {
  .pe-drop,.pe-bead,.pe-seep,.pe-roller,.pe-coat,.pe-membrane,.pe-crackL,.pe-crackR,.pe-float,.pe-pulse,.pe-shine::after { animation: none !important; }
  .pe-reveal { animation: none !important; }
}`;

// ------------------------------- Illustrations -------------------------------
// Rendu illustratif (pas une photo) : à gauche une dalle protégée où l'eau perle, à droite une fissure qui laisse passer l'eau
// Pot réel sous une pluie animée
const HeroProduct = () => {
  const drops = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    left: `${(i * 41) % 100}%`, delay: `${(i * 0.31) % 2.4}s`, dur: `${1.1 + ((i * 13) % 7) / 10}s`,
  })), []);
  return (
    <div className="relative mt-5 rounded-3xl overflow-hidden" style={{ aspectRatio: '1 / 0.9' }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(34,211,238,.35),transparent_62%)]" aria-hidden="true" />
      <div className="absolute inset-0" aria-hidden="true">
        {drops.map((d, i) => <span key={i} className="pe-drop" style={{ left: d.left, animationDelay: d.delay, animationDuration: d.dur }} />)}
      </div>
      <img src={PHOTO_HERO.src} alt={PHOTO_HERO.alt} width={PHOTO_HERO.w} height={PHOTO_HERO.h} fetchPriority="high" decoding="async"
        className="pe-float absolute left-1/2 top-[6%] -translate-x-1/2 w-[72%] h-auto drop-shadow-[0_25px_35px_rgba(0,0,0,.55)]" />
      <span className="absolute bottom-3 right-3 bg-emerald-500 text-white text-[12px] font-black rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
        <BadgeCheck size={14} /> العلبة الأصلية
      </span>
      <span className="absolute bottom-3 left-3 bg-white text-[#0A1F44] text-[12px] font-black rounded-full px-3 py-1 shadow-lg">النسخة الشفافة</span>
    </div>
  );
};

const HeroIllustration = () => {
  const drops = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    left: `${(i * 37) % 100}%`, delay: `${(i * 0.29) % 2.4}s`, dur: `${1.1 + ((i * 13) % 7) / 10}s`,
  })), []);
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#0B2A55] to-[#071a36] ring-1 ring-white/10" style={{ aspectRatio: '4 / 3' }}>
      <div className="absolute inset-0" aria-hidden="true">
        {drops.map((d, i) => <span key={i} className="pe-drop" style={{ left: d.left, animationDelay: d.delay, animationDuration: d.dur }} />)}
      </div>
      <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <linearGradient id="tile" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c2410c" /><stop offset="1" stopColor="#7c2d12" /></linearGradient>
          <linearGradient id="gloss" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="rgba(255,255,255,.35)" /><stop offset=".5" stopColor="rgba(255,255,255,.05)" /><stop offset="1" stopColor="rgba(255,255,255,.25)" /></linearGradient>
          <radialGradient id="drop" cx=".35" cy=".3" r=".7"><stop offset="0" stopColor="#ffffff" /><stop offset=".35" stopColor="#bae6fd" /><stop offset="1" stopColor="#38bdf8" stopOpacity=".55" /></radialGradient>
        </defs>
        {/* dalle en perspective */}
        <polygon points="20,190 380,190 400,290 0,290" fill="url(#tile)" />
        {[0, 1, 2, 3].map(i => <line key={'h' + i} x1={20 - i * 5} y1={190 + i * 25} x2={380 + i * 5} y2={190 + i * 25} stroke="#431407" strokeWidth="1.5" opacity=".6" />)}
        {[-150, -90, -30, 30, 90, 150].map(x => <line key={'v' + x} x1={200 + x} y1="190" x2={200 + x * 1.12} y2="290" stroke="#431407" strokeWidth="1.5" opacity=".6" />)}
        {/* côté protégé (droite en RTL = début de lecture) */}
        <polygon points="200,190 380,190 400,290 200,290" fill="url(#gloss)" />
        {[[250, 215, 7], [300, 232, 9], [350, 210, 6], [270, 262, 10], [330, 270, 8], [370, 248, 6], [228, 240, 6]].map(([x, y, r], i) => (
          <g key={i} className="pe-bead" style={{ animationDelay: `${i * 0.3}s` }}>
            <ellipse cx={x} cy={y + r * 0.55} rx={r} ry={r * 0.35} fill="rgba(0,0,0,.25)" />
            <circle cx={x} cy={y} r={r} fill="url(#drop)" />
          </g>
        ))}
        {/* côté non protégé : fissure + infiltration */}
        <path d="M120 190 L112 214 L126 236 L110 262 L120 290" stroke="#1c0a03" strokeWidth="4" fill="none" />
        {[0, 1, 2].map(i => <circle key={i} className="pe-seep" cx={116 + i * 3} cy={212 + i * 18} r="3.2" fill="#7dd3fc" style={{ animationDelay: `${i * 0.6}s` }} />)}
        <line x1="200" y1="188" x2="200" y2="292" stroke="rgba(255,255,255,.7)" strokeDasharray="5 5" />
      </svg>
      <div className="absolute top-3 inset-x-3 flex justify-between text-[11px] font-black">
        <span className="bg-emerald-500 text-white rounded-full px-2.5 py-1 flex items-center gap-1"><Check size={12} strokeWidth={3} /> مع PROELASTIC</span>
        <span className="bg-rose-500 text-white rounded-full px-2.5 py-1 flex items-center gap-1"><X size={12} strokeWidth={3} /> بدون حماية</span>
      </div>
      <span className="absolute bottom-2 left-3 text-[10px] font-semibold text-white/60">رسم توضيحي</span>
    </div>
  );
};

const RollerIllustration = () => (
  <svg viewBox="0 0 300 120" className="w-full h-auto" aria-hidden="true">
    <rect x="10" y="60" width="280" height="50" rx="6" fill="#9a3412" />
    {[70, 130, 190, 250].map(x => <line key={x} x1={x} y1="60" x2={x} y2="110" stroke="#431407" strokeWidth="2" opacity=".6" />)}
    <rect className="pe-coat" x="40" y="60" width="250" height="50" rx="6" fill="rgba(186,230,253,.45)" />
    <g className="pe-roller">
      <rect x="252" y="44" width="40" height="18" rx="9" fill="#e2e8f0" stroke="#94a3b8" />
      <path d="M272 44 L272 20 L290 8" stroke="#475569" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  </svg>
);

const ElasticIllustration = () => (
  <svg viewBox="0 0 300 130" className="w-full h-auto" aria-hidden="true">
    <g className="pe-crackL"><rect x="10" y="60" width="135" height="55" rx="6" fill="#64748b" /></g>
    <g className="pe-crackR"><rect x="155" y="60" width="135" height="55" rx="6" fill="#64748b" /></g>
    <rect className="pe-membrane" x="95" y="50" width="110" height="14" rx="7" fill="rgba(125,211,252,.9)" />
    {[0, 1, 2, 3].map(i => <circle key={i} className="pe-bead" cx={110 + i * 26} cy="40" r="6" fill="#bae6fd" style={{ animationDelay: `${i * 0.4}s` }} />)}
  </svg>
);

// Vidéo réelle : se lance (sans son) quand elle est visible, se met en pause sinon. Rien n'est chargé avant.
const DemoVideo = ({ src, poster, title, autoPlay }: { src: string; poster: string; title: string; autoPlay: boolean }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || !autoPlay || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    }, { threshold: 0.4 });
    obs.observe(v);
    return () => obs.disconnect();
  }, [autoPlay]);
  return (
    <figure className="rounded-3xl overflow-hidden bg-black ring-1 ring-white/10">
      <video ref={ref} poster={poster} muted playsInline loop preload="none" controls={!autoPlay}
        width={360} height={640} className="w-full h-auto block" style={{ aspectRatio: '9 / 16' }} aria-label={title}>
        {/* WebM (VP9) pour Chrome/Android, MP4 (H.264) pour iPhone */}
        <source src={`${src}.webm`} type="video/webm" />
        <source src={`${src}.mp4`} type="video/mp4" />
      </video>
      <figcaption className="px-3 py-2 text-[12px] font-bold text-sky-100/90 bg-[#0A1F44]">🎥 {title}</figcaption>
    </figure>
  );
};

// ------------------------------- Éléments -------------------------------
const Section = ({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) => (
  <section id={id} className={`px-4 py-12 ${className}`}><div className="max-w-xl mx-auto">{children}</div></section>
);
const Kicker = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <p className={`text-[13px] font-black tracking-wide mb-1 ${dark ? 'text-cyan-300' : 'text-sky-600'}`}>{children}</p>
);
const H2 = ({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) => (
  <h2 className={`text-[27px] leading-[1.25] font-black ${dark ? 'text-white' : 'text-[#0A1F44]'}`}>{children}</h2>
);

const FAQ = (deskMin: number, homeMin: number) => [
  { q: 'هل المنتج أصلي؟', a: 'نعم. نبيع PROELASTIC الشفاف الأصلي من شركة Profinish الجزائرية منذ أكثر من 3 سنوات. تستلم العلبة وتفحصها بنفسك قبل أن تدفع.' },
  { q: 'كم كلغ أحتاج؟', a: `القاعدة: كل 1 كلغ يغطي حوالي ${KG_COVERAGE_M2} م² (قد يقل قليلاً إذا كان السطح يمتص كثيراً). استعمل الحاسبة في الأعلى لمعرفة الكمية والعرض الأنسب.` },
  { q: 'هل يغيّر لون البلاط؟', a: 'لا، نوفر النسخة الشفافة: تحمي السطح وتترك شكل البلاط أو الدالة كما هو.' },
  { q: 'أين أستعمله؟', a: 'على السطوح والدالة، التيراس، البلكونات والواجهات، ويملأ الشقوق الصغيرة. يُدهن من الخارج على المكان الذي تدخل منه المياه.' },
  { q: 'كيف أطبّقه؟', a: 'نظّف السطح وجففه جيداً، ثم ادهن طبقتين بالرولو أو الفرشاة. يمكن تخفيف الطبقة الأولى بقليل من الماء على الأسطح التي تمتص كثيراً. يجف في حوالي 6 إلى 8 ساعات، لذلك اختر يوماً بدون مطر.' },
  { q: 'هل أحتاج عامل مختص؟', a: 'لا. التطبيق بسيط بالرولو أو الفرشاة، ويمكنك القيام به بنفسك.' },
  { q: 'هل أدفع قبل الاستلام؟', a: 'لا. تدفع لعامل التوصيل عند الاستلام فقط، بعد فحص المنتج.' },
  { q: 'كم سعر التوصيل؟', a: `حسب الولاية: من ${deskMin} د.ج للمكتب ومن ${homeMin} د.ج للمنزل. يظهر السعر الدقيق في الاستمارة.` },
];

export default function LandingPageProelasticLP({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  const [packageId, setPackageId] = useState<ProelasticPackageId>('3kg_offer');
  const [packCount, setPackCount] = useState(1);
  const [area, setArea] = useState(10);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSticky, setShowSticky] = useState(false);
  const checkoutFiredRef = useRef(false);
  const rate = usdRate(config);
  const pkg = PROELASTIC_PACKAGES.find(p => p.id === packageId)!;

  useEffect(() => { document.title = 'PROELASTIC الأصلي – عازل شفاف ضد التسربات'; }, []);

  // ViewContent (TikTok + Meta) une seule fois dès que les pixels sont prêts
  useEffect(() => {
    const value = Number((PROELASTIC_PACKAGES[0].price / rate).toFixed(2));
    const content = { content_id: PROELASTIC_PRODUCT.id, content_type: 'product', content_name: PROELASTIC_PRODUCT.name };
    const stopTt = whenReady(() => !!window.ttq, () => window.ttq.track('ViewContent', { contents: [content], value, currency: 'USD' }));
    const stopFb = whenReady(() => !!window.fbq, () => window.fbq('track', 'ViewContent', {
      content_name: PROELASTIC_PRODUCT.name, content_ids: [PROELASTIC_PRODUCT.id], content_type: 'product', value, currency: 'USD',
    }));
    return () => { stopTt(); stopFb(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFirstInteraction = () => {
    if (checkoutFiredRef.current) return;
    checkoutFiredRef.current = true;
    const value = Number(((pkg.price * packCount) / rate).toFixed(2));
    const content = { content_id: PROELASTIC_PRODUCT.id, content_type: 'product', content_name: PROELASTIC_PRODUCT.name };
    if (window.ttq) window.ttq.track('InitiateCheckout', { contents: [content], value, currency: 'USD' });
    if (window.fbq) window.fbq('track', 'InitiateCheckout', { content_ids: [PROELASTIC_PRODUCT.id], content_type: 'product', value, currency: 'USD', num_items: packCount });
    if (window.gtag && config?.ga4MeasurementId) window.gtag('event', 'begin_checkout', { currency: 'USD', value, items: [{ item_id: PROELASTIC_PRODUCT.id, item_name: PROELASTIC_PRODUCT.name, price: value, quantity: 1 }] });
  };

  const toForm = () => document.getElementById('order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const choose = (id: ProelasticPackageId, count = 1) => { setPackageId(id); setPackCount(count); toForm(); };

  // Bouton collant : visible après le hero, masqué quand le formulaire est à l'écran
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    let heroPassed = false, formVisible = false;
    const update = () => setShowSticky(heroPassed && !formVisible);
    const heroObs = new IntersectionObserver(([e]) => { heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0; update(); });
    const formObs = new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update(); }, { threshold: 0.1 });
    const hero = document.getElementById('pe-hero-cta'); const form = document.getElementById('order');
    if (hero) heroObs.observe(hero); if (form) formObs.observe(form);
    return () => { heroObs.disconnect(); formObs.disconnect(); };
  }, []);

  const kgNeeded = Math.max(1, Math.ceil(area / KG_COVERAGE_M2));
  const suggestion = bestOffer(kgNeeded);
  const deskMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.desk));
  const homeMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.home));

  return (
    <div className="min-h-screen bg-[#071530] font-sans text-slate-800" dir="rtl" lang="ar">
      <style>{STYLES}</style>
      <div className="max-w-xl mx-auto bg-white min-h-screen shadow-2xl pb-24 overflow-hidden">

        {/* Bandeau */}
        <div className="bg-amber-400 text-[#0A1F44] text-[12.5px] font-black py-2 px-3 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1"><BadgeCheck size={15} /> المنتج الأصلي Profinish</span>
          <span className="w-px h-3.5 bg-[#0A1F44]/30" />
          <span className="flex items-center gap-1"><Truck size={15} /> التوصيل لـ 69 ولاية</span>
        </div>

        {/* HERO */}
        <section className="relative bg-gradient-to-b from-[#071a36] via-[#0A2550] to-[#0b3a6b] text-white px-4 pt-6 pb-10">
          <div className="max-w-xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold">
              <span className="bg-white/10 ring-1 ring-white/15 rounded-full px-3 py-1">🏆 نبيعه منذ +3 سنوات</span>
              <span className="bg-white/10 ring-1 ring-white/15 rounded-full px-3 py-1 flex items-center gap-1">
                <span className="flex text-amber-300">{[0, 1, 2, 3, 4].map(i => <Star key={i} size={11} fill="currentColor" strokeWidth={0} />)}</span> مئات الزبائن الراضين
              </span>
            </div>
            <h1 className="mt-4 text-center text-[30px] leading-[1.25] font-black">
              أوقف تسرّب المياه<br /><span className="text-cyan-300">من السطح</span> بدون تكسير
            </h1>
            <p className="mt-3 text-center text-[16px] font-semibold text-sky-100/90">
              <b className="text-white">PROELASTIC</b> الشفاف الأصلي من <b className="text-white">Profinish</b>: طلاء مطاطي يُدهن من الخارج، يملأ الشقوق الصغيرة ويحافظ على شكل البلاط.
            </p>

            <HeroProduct />

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[{ v: 'شفاف', l: 'لا يغيّر شكل البلاط' }, { v: `${KG_COVERAGE_M2} م²`, l: 'لكل 1 كلغ' }, { v: 'مطاطي', l: 'يملأ الشقوق الصغيرة' }].map(s => (
                <div key={s.v} className="rounded-2xl bg-white/10 ring-1 ring-white/10 py-3 px-1">
                  <p className="text-[18px] font-black text-cyan-300">{s.v}</p>
                  <p className="text-[11px] font-semibold text-sky-100/80">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-end justify-center gap-2">
              <span className="text-sky-100/80 font-bold mb-1.5">ابتداءً من</span>
              <span className="text-[44px] leading-none font-black">1900<span className="text-xl"> د.ج</span></span>
            </div>
            <p className="text-center text-[13px] font-bold text-amber-300 mt-1">🎁 اشترِ 2 كلغ = 3 كلغ · اشترِ 3 كلغ = 5 كلغ</p>

            <div id="pe-hero-cta" className="mt-5">
              <button type="button" onClick={toForm}
                className="pe-shine pe-pulse relative overflow-hidden w-full h-14 rounded-2xl bg-amber-400 text-[#0A1F44] text-lg font-black flex items-center justify-center gap-2">
                <ShoppingCart size={20} /> اطلب الآن – الدفع عند الاستلام
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11.5px] font-bold text-sky-100/90 text-center">
              <span className="flex flex-col items-center gap-1"><Banknote size={18} className="text-cyan-300" />الدفع عند الاستلام</span>
              <span className="flex flex-col items-center gap-1"><PackageCheck size={18} className="text-cyan-300" />افحص قبل أن تدفع</span>
              <span className="flex flex-col items-center gap-1"><PhoneCall size={18} className="text-cyan-300" />نتصل بك للتأكيد</span>
            </div>
          </div>
        </section>

        {/* DÉMONSTRATION RÉELLE */}
        <Section className="bg-[#071530] text-white">
          <div className="text-center mb-5 pe-reveal"><Kicker dark>اختبار حقيقي بالفيديو</Kicker><H2 dark>كرتون عادي + PROELASTIC<br />= يحمل الماء!</H2>
            <p className="mt-2 text-[14px] font-semibold text-sky-100/80">دهنّا علبة من الكرتون بـ PROELASTIC وملأناها بالماء: الكرتون حمل الماء والماء لم يتسرب.</p>
          </div>
          <div className="pe-reveal max-w-[300px] mx-auto"><DemoVideo {...DEMO_VIDEOS[0]} autoPlay /></div>
          <details className="mt-4 pe-reveal">
            <summary className="cursor-pointer text-center text-[13px] font-black text-cyan-300">▶ شاهد تجربة ثانية</summary>
            <div className="mt-3 max-w-[300px] mx-auto"><DemoVideo {...DEMO_VIDEOS[1]} autoPlay={false} /></div>
          </details>
          <div className="pe-reveal mt-6"><HeroIllustration /></div>
          <p className="mt-2 text-center text-[13px] font-bold text-sky-100/80">نفس الشيء فوق سطحك: الماء يبقى فوق ولا يدخل من الشقوق.</p>
        </Section>

        {/* OFFRES */}
        <Section className="bg-gradient-to-b from-sky-50 to-white">
          <div className="text-center mb-6 pe-reveal"><Kicker>عروض خاصة</Kicker><H2>كلما اشتريت أكثر، وفّرت أكثر</H2></div>
          <figure className="pe-reveal mb-5 rounded-3xl overflow-hidden bg-white ring-1 ring-slate-200">
            <img src={PHOTO_SIZES.src} alt={PHOTO_SIZES.alt} width={PHOTO_SIZES.w} height={PHOTO_SIZES.h} loading="lazy" decoding="async"
              className="w-full h-auto" style={{ aspectRatio: `${PHOTO_SIZES.w} / ${PHOTO_SIZES.h}`, maxHeight: 420, objectFit: 'cover' }} />
            <figcaption className="p-3 text-center text-[13px] font-bold text-slate-600">علبة 1 كلغ وسطل 5 كلغ – التغليف الأصلي من Profinish</figcaption>
          </figure>
          <div className="space-y-3">
            {PROELASTIC_PACKAGES.map(p => {
              const best = p.id === '3kg_offer';
              return (
                <div key={p.id} className={`pe-reveal relative rounded-3xl p-4 border-2 ${best ? 'border-sky-600 bg-white shadow-xl shadow-sky-600/15' : 'border-slate-200 bg-white'}`}>
                  {best && <span className="absolute -top-3 right-4 bg-sky-600 text-white text-[11px] font-black rounded-full px-3 py-1">⭐ الأكثر طلباً</span>}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[22px] font-black text-[#0A1F44]">{p.title}</p>
                      <p className="text-[13px] font-semibold text-slate-500">يغطي حوالي {p.kg * KG_COVERAGE_M2} م²{p.badge ? ` · تدفع ${p.paidKg} كلغ فقط` : ''}</p>
                      {p.badge && <span className="inline-block mt-1.5 text-[12px] font-black text-amber-700 bg-amber-100 rounded-full px-2.5 py-0.5">🎁 {p.badge}</span>}
                    </div>
                    <div className="text-left">
                      {p.badge && <p className="text-[13px] font-bold text-slate-400 line-through">{p.kg * 1900} د.ج</p>}
                      <p className="text-[24px] font-black text-[#0A1F44]">{p.price} <span className="text-sm">د.ج</span></p>
                      <p className="text-[11px] font-bold text-emerald-600">{Math.round(p.price / p.kg)} د.ج / كلغ</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => choose(p.id)}
                    className={`mt-3 w-full h-11 rounded-xl font-black text-[15px] ${best ? 'bg-sky-600 text-white' : 'bg-slate-100 text-[#0A1F44]'}`}>
                    اختر هذا العرض
                  </button>
                </div>
              );
            })}
          </div>
        </Section>

        {/* CALCULATEUR */}
        <Section className="bg-white">
          <div className="pe-reveal rounded-3xl bg-[#0A1F44] text-white p-5">
            <div className="flex items-center gap-2 mb-1"><Calculator size={20} className="text-cyan-300" /><p className="font-black text-[18px]">كم كلغ تحتاج؟</p></div>
            <p className="text-[13px] text-sky-100/80 font-semibold mb-4">حرّك المؤشر حسب مساحة السطح</p>
            <div className="flex items-end justify-between mb-2">
              <span className="text-[13px] font-bold text-sky-100/80">المساحة</span>
              <span className="text-[30px] font-black text-cyan-300 leading-none">{area} <span className="text-base">م²</span></span>
            </div>
            <input type="range" min={2} max={100} step={1} value={area} onChange={e => setArea(Number(e.target.value))}
              aria-label="مساحة السطح بالمتر المربع" className="w-full accent-cyan-400 h-2" />
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 py-3"><p className="text-[11px] text-sky-100/70 font-bold">الكمية اللازمة</p><p className="text-[22px] font-black">{kgNeeded} كلغ</p></div>
              <div className="rounded-2xl bg-white/10 py-3"><p className="text-[11px] text-sky-100/70 font-bold">العرض المقترح</p>
                <p className="text-[17px] font-black">{suggestion.count > 1 ? `${suggestion.count} × ` : ''}{suggestion.pkg.title}</p>
                <p className="text-[12px] font-bold text-amber-300">{suggestion.cost} د.ج · {suggestion.kg} كلغ</p></div>
            </div>
            <button type="button" onClick={() => choose(suggestion.pkg.id, suggestion.count)}
              className="mt-4 w-full h-12 rounded-xl bg-amber-400 text-[#0A1F44] font-black">اطلب الكمية المقترحة</button>
            <p className="mt-2 text-[11px] text-sky-100/60 font-semibold">على أساس {KG_COVERAGE_M2} م² لكل كلغ. السطح الذي يمتص كثيراً قد يحتاج كمية أكبر قليلاً.</p>
          </div>
        </Section>

        {/* FORMULAIRE */}
        <section id="order" className="px-4 pb-12 scroll-mt-3 bg-white">
          <div className="max-w-xl mx-auto">
            <CheckoutFormProelasticLP packageId={packageId} onPackageChange={setPackageId} packCount={packCount} onPackCountChange={setPackCount}
              sourceTag={SOURCE_TAG} onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction} />
          </div>
        </section>

        {/* ATTENTION AUX IMITATIONS */}
        <Section className="bg-gradient-to-b from-[#1a0b0b] to-[#2a0f0f] text-white">
          <div className="pe-reveal">
            <div className="flex items-center gap-2 text-amber-300 font-black text-[14px] mb-2"><AlertTriangle size={18} /> تنبيه قبل الشراء</div>
            <H2 dark>احذر من المنتجات الرخيصة<br />ذات الجودة الضعيفة</H2>
            <p className="mt-3 text-[15px] font-semibold text-rose-100/85 leading-relaxed">
              ظهرت مؤخراً في السوق ماركات جديدة بسعر أقل، لكنها لا تعطي نفس النتيجة. النتيجة؟ تعاود الدهن من جديد، وتخسر الوقت والمال مرتين.
            </p>
            <div className="mt-5 rounded-2xl overflow-hidden ring-1 ring-white/10">
              <table className="w-full text-[13.5px]">
                <thead><tr>
                  <th className="p-3 text-right bg-white/5"> </th>
                  <th className="p-3 bg-emerald-600 font-black w-28">PROELASTIC<br /><span className="text-[11px] font-bold opacity-90">الأصلي</span></th>
                  <th className="p-3 bg-white/10 font-bold w-24">ماركات رخيصة جديدة</th>
                </tr></thead>
                <tbody className="divide-y divide-white/10">
                  {[
                    ['مجرّب عند زبائننا منذ +3 سنوات', true, false],
                    ['علامة Profinish الجزائرية المعروفة', true, false],
                    ['مئات التعليقات والتجارب الحقيقية', true, false],
                  ].map(([label, a, b]) => (
                    <tr key={label as string}>
                      <td className="p-3 font-semibold text-rose-50/90 bg-white/5">{label}</td>
                      <td className="p-3 text-center bg-emerald-500/15">{a ? <Check className="inline text-emerald-400" size={20} strokeWidth={3} /> : <X className="inline text-rose-400" size={20} />}</td>
                      <td className="p-3 text-center">{b ? <Check className="inline text-emerald-400" size={20} /> : <X className="inline text-rose-400" size={20} strokeWidth={3} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <figure className="mt-5 rounded-3xl overflow-hidden ring-1 ring-white/10">
              <img src={PHOTO_STOCK.src} alt={PHOTO_STOCK.alt} width={PHOTO_STOCK.w} height={PHOTO_STOCK.h} loading="lazy" decoding="async" className="w-full h-auto" />
              <figcaption className="p-3 text-[13px] font-bold text-amber-100 bg-white/5">📦 علب PROELASTIC الأصلية متوفرة عندنا: تعرّف على التغليف الأصلي قبل الشراء</figcaption>
            </figure>
            <p className="mt-4 text-[13px] font-bold text-amber-200">✅ مع YANIS SHOP تستلم PROELASTIC الأصلي، وتفحص العلبة بنفسك قبل الدفع.</p>
          </div>
        </Section>

        {/* PREUVE SOCIALE */}
        <Section className="bg-[#071530] text-white">
          <div className="text-center pe-reveal"><Kicker dark>ثقة مبنية على 3 سنوات</Kicker><H2 dark>زبائن حقيقيون، نتائج حقيقية</H2></div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center pe-reveal">
            {[{ v: '+3', l: 'سنوات ونحن نبيعه' }, { v: 'مئات', l: 'الزبائن الراضين' }, { v: 'ملايين', l: 'المشاهدات على فيديوهاتنا' }].map(s => (
              <div key={s.l} className="rounded-2xl bg-white/5 ring-1 ring-white/10 py-4 px-1">
                <p className="text-[24px] font-black text-cyan-300">{s.v}</p><p className="text-[11px] font-semibold text-sky-100/75">{s.l}</p>
              </div>
            ))}
          </div>
          <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer"
            className="pe-reveal mt-5 flex items-center justify-center gap-2 h-12 rounded-2xl bg-white text-[#0A1F44] font-black">
            <Play size={18} fill="currentColor" /> شاهد فيديوهاتنا على تيك توك @yanishop_dz
          </a>
        </Section>

        {/* AVIS RÉELS */}
        <Section className="bg-slate-50">
          <div className="text-center mb-6 pe-reveal"><Kicker>تعليقات حقيقية من تيك توك</Kicker><H2>ماذا يقول زبائننا؟</H2></div>
          <div className="space-y-3">
            {REVIEWS.map(r => (
              <figure key={r.name} className="pe-reveal bg-white rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-white font-black flex items-center justify-center">{r.name.trim().charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-[14px] text-slate-900" dir="auto">{r.name}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">تعليق على تيك توك · {r.date}</p>
                  </div>
                  <span className="text-[12px] font-bold text-rose-500">♥ {r.likes}</span>
                </div>
                <blockquote className="mt-3 text-[16px] font-bold text-slate-800" dir="auto">« {r.text} »</blockquote>
              </figure>
            ))}
          </div>
          <details className="mt-4 pe-reveal">
            <summary className="cursor-pointer text-center text-[13px] font-black text-sky-700">📸 عرض لقطات الشاشة الأصلية</summary>
            <div className="mt-3 space-y-3">
              {REVIEWS.map(r => (
                <img key={r.shot} src={A + r.shot} alt={`تعليق ${r.name} على تيك توك`} width={r.w} height={r.h} loading="lazy" decoding="async"
                  className="w-full h-auto rounded-xl border border-slate-200 bg-white" />
              ))}
            </div>
          </details>
        </Section>

        {/* COMMENT ÇA MARCHE */}
        <Section className="bg-white">
          <div className="text-center mb-6 pe-reveal"><Kicker>بدون عامل مختص</Kicker><H2>طريقة الاستعمال في 3 خطوات</H2></div>
          <ol className="space-y-4">
            {[
              { Icon: Sparkles, t: 'نظّف وجفّف السطح', d: 'أزل الغبار والأوساخ، وتأكد أن السطح جاف تماماً.' },
              { Icon: Paintbrush, t: 'ادهن الطبقة الأولى', d: 'بالرولو أو الفرشاة، مع التركيز على الشقوق والفواصل. يمكن تخفيفها بقليل من الماء إذا كان السطح يمتص كثيراً.' },
              { Icon: Droplets, t: 'ادهن الطبقة الثانية', d: 'بعد جفاف الأولى، ادهن طبقة ثانية لحماية أقوى. يجف في حوالي 6 إلى 8 ساعات.' },
            ].map((s, i) => (
              <li key={s.t} className="pe-reveal flex gap-3">
                <span className="shrink-0 w-11 h-11 rounded-2xl bg-sky-600 text-white font-black flex items-center justify-center text-lg">{i + 1}</span>
                <div><p className="font-black text-[#0A1F44] flex items-center gap-1.5"><s.Icon size={16} className="text-sky-600" /> {s.t}</p><p className="text-[14px] font-semibold text-slate-600">{s.d}</p></div>
              </li>
            ))}
          </ol>
          <div className="pe-reveal mt-6 rounded-3xl bg-gradient-to-br from-sky-50 to-cyan-50 p-4 ring-1 ring-sky-100">
            <RollerIllustration />
            <p className="text-center text-[13px] font-bold text-slate-600 mt-1">طبقة شفافة تُدهن بالرولو بسهولة <span className="text-slate-400 font-semibold">(رسم توضيحي)</span></p>
          </div>
          <div className="pe-reveal mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-[13px] font-bold text-amber-800">
            <Sun size={18} className="shrink-0 mt-0.5" /> نصيحة: ادهن في يوم مشمس وبدون مطر متوقع، حتى يجف المنتج جيداً.
          </div>
        </Section>

        {/* ÉLASTICITÉ */}
        <Section className="bg-[#0A1F44] text-white">
          <div className="pe-reveal"><Kicker dark>لماذا مطاطي؟</Kicker><H2 dark>يتمدّد مع السطح ولا يتشقق</H2>
            <p className="mt-3 text-[15px] font-semibold text-sky-100/85">السطوح تتمدد وتنكمش مع الحرارة والبرودة. طبقة PROELASTIC المرنة تتبع هذه الحركة وتملأ الشقوق الصغيرة، فتبقى الحماية في مكانها.</p>
          </div>
          <div className="pe-reveal mt-5 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4">
            <ElasticIllustration />
            <p className="text-center text-[12px] font-semibold text-sky-100/60 mt-1">رسم توضيحي</p>
          </div>
        </Section>

        {/* OÙ L'UTILISER */}
        <Section className="bg-white">
          <div className="text-center mb-6 pe-reveal"><Kicker>استعمالات</Kicker><H2>أين تستعمل PROELASTIC؟</H2></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: Home, t: 'السطح والدالة', d: 'ضد القطرة في الشتاء' },
              { Icon: Building, t: 'البلكونات', d: 'فوق البلاط مباشرة' },
              { Icon: Waves, t: 'التيراس', d: 'يحافظ على شكل البلاط' },
              { Icon: ShieldCheck, t: 'الواجهات والشقوق', d: 'يملأ الشقوق الصغيرة' },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="pe-reveal rounded-2xl p-4 bg-sky-50 ring-1 ring-sky-100 text-center">
                <Icon size={28} className="text-sky-600 mx-auto mb-2" /><p className="font-black text-[15px] text-[#0A1F44]">{t}</p><p className="text-[12px] font-semibold text-slate-500">{d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* GARANTIE */}
        <Section className="bg-slate-50">
          <div className="pe-reveal rounded-3xl border-2 border-dashed border-sky-600 p-5 text-center bg-white">
            <ShieldCheck size={38} className="text-sky-600 mx-auto mb-2" />
            <p className="text-[21px] font-black text-[#0A1F44]">لا تدفع شيئاً قبل أن تتأكد</p>
            <p className="text-[15px] font-semibold text-slate-600 mt-1">تستلم PROELASTIC، تفحص العلبة بنفسك، ثم تدفع لعامل التوصيل.</p>
            <div className="grid grid-cols-3 gap-2 mt-4 text-[12px] font-bold text-slate-700">
              <span className="flex flex-col items-center gap-1"><PhoneCall size={20} className="text-sky-600" />اتصال للتأكيد</span>
              <span className="flex flex-col items-center gap-1"><Truck size={20} className="text-sky-600" />69 ولاية</span>
              <span className="flex flex-col items-center gap-1"><Banknote size={20} className="text-sky-600" />الدفع عند الاستلام</span>
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section className="bg-white">
          <div className="text-center mb-6"><H2>أسئلة شائعة</H2></div>
          <div className="space-y-2">
            {FAQ(deskMin, homeMin).map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="rounded-2xl border border-slate-200 bg-white">
                  <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-right font-black text-[15px] text-[#0A1F44]">
                    {item.q}<ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <p className="px-4 pb-4 -mt-1 text-[14px] font-semibold text-slate-600 leading-relaxed">{item.a}</p>}
                </div>
              );
            })}
          </div>
        </Section>

        {/* CTA FINAL */}
        <section className="px-4 py-12 bg-gradient-to-b from-[#0A2550] to-[#071530] text-white text-center">
          <div className="max-w-xl mx-auto">
            <Clock size={30} className="text-cyan-300 mx-auto mb-2" />
            <H2 dark>لا تنتظر حتى تدخل القطرة</H2>
            <p className="mt-2 text-[15px] font-semibold text-sky-100/85">احمِ سطحك قبل الأمطار مع PROELASTIC الأصلي.</p>
            <button type="button" onClick={toForm}
              className="pe-shine relative overflow-hidden mt-5 w-full h-14 rounded-2xl bg-amber-400 text-[#0A1F44] text-lg font-black flex items-center justify-center gap-2">
              <ShoppingCart size={20} /> اطلب الآن – الدفع عند الاستلام
            </button>
          </div>
        </section>

        <footer className="px-4 py-5 text-center text-[11px] font-semibold text-slate-400">
          PROELASTIC علامة تجارية لشركة Profinish. YANIS SHOP بائع للمنتج الأصلي.
        </footer>
      </div>

      {/* Bouton collant */}
      <div className={`fixed bottom-0 inset-x-0 z-50 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`} aria-hidden={!showSticky}>
        <div className="max-w-xl mx-auto bg-[#071530]/95 backdrop-blur px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          <button type="button" tabIndex={showSticky ? 0 : -1} onClick={toForm}
            className="w-full py-3.5 rounded-2xl bg-amber-400 text-[#0A1F44] text-[17px] font-black flex items-center justify-center gap-2">
            <ShoppingCart size={20} /> اطلب الآن – {pkg.title} بـ {pkg.price * packCount} د.ج
          </button>
        </div>
      </div>
    </div>
  );
}
