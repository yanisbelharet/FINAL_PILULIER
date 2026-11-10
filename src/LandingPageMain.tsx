// /lp/pigma-main : version courte et rapide de /lp/pigma-stop-fuites (qui reste inchangée).
// Formulaire juste sous la photo, preuves ensuite, calculatrice et FAQ repliées. Aucune animation ni librairie en plus.
// Pixels : uniquement TikTok PIGMA1 (DBJA2NRC77U3VQV6KJT0) — Monabih1, Facebook et Google ne sont pas chargés sur cette page
// (voir index.html et App.tsx : NO_EXTRA_PIXELS_PATH).
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Truck, Banknote, PhoneCall, ShoppingCart, ChevronDown, Play, Calculator, BadgeCheck, MessageCircle, Gift, Sparkles, Droplets, PaintRoller, CloudRain, Sun, Eye } from 'lucide-react';
import CheckoutFormPigma, { PIGMA_PRODUCT, pigmaUnitPrice, PIGMA_BOX_KG, PIGMA_DEFAULT_OFFER, getOffer, da, boxesLabel } from './CheckoutFormPigma';
import { DELIVERY_PRICES } from './data';
import { usePricing } from './pricing';

const SOURCE = 'lp-main';
const SOURCE_TAG = 'LP pigma-main';
const WHATSAPP = '213557920685';
const A = '/lp-assets/pigma/';
const PHOTO_HERO = { src: A + 'pot-transparent-1-4kg.webp', alt: 'علبة Pigma Color Stop Fuites الشفافة 1,4 كلغ', w: 495, h: 619 };
const VIDEO = { src: A + 'test-eau.mp4', poster: A + 'test-eau.webp' };
const P400 = '/lp-assets/pigma400/';

// Avis : ajoutez une capture dans public/lp-assets/pigma-main/ puis une ligne ici (4 emplacements ; section masquée si vide).
// Noms et photos de profil floutés.
const REVIEWS: { src: string; w: number; h: number; alt: string }[] = [
  { src: '/lp-assets/pigma-main/avis-1.webp', w: 720, h: 401, alt: 'تعليق على تيك توك: خدمت بيه' },
  { src: '/lp-assets/pigma-main/avis-2.webp', w: 706, h: 814, alt: 'تعليقات على تيك توك: الحل المثالي بتجربة' },
  { src: '/lp-assets/pigma-main/avis-3.webp', w: 720, h: 453, alt: 'تعليق على فيسبوك: منتج إيفيكاس جربتو لبعض الزبائن' },
].slice(0, 4);

const M2_PER_BOX = PIGMA_BOX_KG * 4; // 1 kg couvre 4 m² en deux couches
const CALC_MAX_BOXES = 9;
const offerForBoxes = (n: number) => (n <= 1 ? 'pack1' : n <= 3 ? 'pack3' : n <= 6 ? 'pack6' : n === 7 ? 'combo7' : 'combo9');
const usdRate = (config: any) => (Number(config?.usdRate) > 0 ? Number(config.usdRate) : 250);
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'ttclid', 'fbclid', 'gclid'];

// Paramètres UTM / identifiants de clic, gardés pour la session et transmis avec la commande
const readUtm = (): Record<string, string> => {
  const out: Record<string, string> = {};
  try { Object.assign(out, JSON.parse(sessionStorage.getItem('lpmain_utm') || '{}')); } catch { /* ignore */ }
  const p = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach(k => { const v = p.get(k); if (v) out[k] = v.slice(0, 200); });
  try { sessionStorage.setItem('lpmain_utm', JSON.stringify(out)); } catch { /* ignore */ }
  return out;
};

const whenReady = (check: () => boolean, fn: () => void, timeoutMs = 10000) => {
  if (check()) { fn(); return () => {}; }
  const start = Date.now();
  const id = setInterval(() => { if (check()) { clearInterval(id); fn(); } else if (Date.now() - start > timeoutMs) clearInterval(id); }, 150);
  return () => clearInterval(id);
};

const FAQ = (deskMin: number, homeMin: number) => [
  { q: 'شحال تغطي العلبة؟', a: 'كل 1 كلغ يغطي حوالي 4 م² بطبقتين. يعني العلبة تاع 1,4 كلغ تغطي حوالي 5,6 م². استعمل الحاسبة باش تعرف شحال من علبة تلزمك.' },
  { q: 'شحال من وقت باش ينشف؟', a: 'طبقة التحضير: 6 ساعات. بين الطبقة الأولى والثانية: 24 ساعة. وما لازمش تطيح الشتا 24 حتى 48 ساعة من بعد الدهان.' },
  { q: 'علاش يبان أبيض كي ندهنو؟', a: 'عادي. كي يتدهن يكون سايل وشوية أبيض كي الحليب، ويولي شفاف وما يبانش غير كي ينشف كامل.' },
  { q: 'على واش نقدر ندهنو؟', a: 'السطح والتيراس، البالكونات، الحيوط والياجور، الكارلاج والفايونس، الحمام وخزانات الماء. لازم السطح يكون نقي، بلا دسم وناشف 100%.' },
  { q: 'إذا السطح كبير وتلزمني أكثر من 9 علب؟', a: 'للكميات الأكبر نعطيوك سعر خاص بيك. ابعثلنا على واتساب المساحة تاعك.' },
  { q: 'شحال سومة التوصيل وشحال يطوّل؟', a: `عرض 4+2: التوصيل مجاني. علبة وحدة ولا عرض 2+1: حسب الولاية، من ${deskMin} د.ج للمكتب ومن ${homeMin} د.ج للدار. يوصلك في 24 ساعة، و48 ساعة على الأكثر.` },
  { q: 'المنتوج أصلي؟', a: 'إيه، Stop Fuites أصلي من Pigma Color. احذرو الماركات المقلدة: تستلم العلبة وتشوفها قبل ما تخلص.' },
  { q: 'كيفاش نخلص؟', a: 'الدفع عند الاستلام: ما تخلص والو دركا. تستلم الطلب، تشوفو، ومن بعد تخلص لعامل التوصيل.' },
];

const STEPS = [
  { Icon: Sparkles, t: 'نقّي ونشّف', d: <>نحّي الغبرة والدسم (بلا أسيد قوي). السطح لازم يكون <b>ناشف 100%</b>.</> },
  { Icon: Droplets, t: 'طبقة تحضير مخففة', d: <>زيد <b>10 حتى 20% ماء</b>، وخلّيها تنشف <b>6 ساعات</b>.</> },
  { Icon: PaintRoller, t: 'زوج طبقات صافيين', d: <>استنى <b>24 ساعة</b> بيناتهم، والثانية بعكس الاتجاه.</> },
];

// Bloc repliable (fermé par défaut)
const Fold: React.FC<{ title: React.ReactNode; children: React.ReactNode }> = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-right font-black text-[16.5px] text-[#0B1B3F]">
        {title}<ChevronDown size={19} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

const Img: React.FC<{ src: string; alt: string; w: number; h: number; srcSet?: string }> = ({ src, alt, w, h, srcSet }) => (
  <img src={src} srcSet={srcSet} sizes={srcSet ? '(max-width: 576px) 100vw, 576px' : undefined} width={w} height={h} alt={alt}
    loading="lazy" decoding="async" className="block w-full h-auto rounded-2xl bg-slate-100" />
);

export default function LandingPageMain({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  usePricing();
  const [offerId, setOfferId] = useState(PIGMA_DEFAULT_OFFER);
  const [area, setArea] = useState(10);
  const [videoOn, setVideoOn] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const checkoutFiredRef = useRef(false);
  const viewFiredRef = useRef(false);
  const rate = usdRate(config);
  const offer = getOffer(offerId);

  useEffect(() => { document.title = 'Stop Fuites شفاف من Pigma Color – الدفع عند الاستلام'; readUtm(); }, []);

  // ViewContent (TikTok) une seule fois dès que le pixel est prêt
  useEffect(() => {
    const value = Number((pigmaUnitPrice() / rate).toFixed(2));
    const content = { content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name };
    return whenReady(() => !!window.ttq, () => {
      if (viewFiredRef.current) return; viewFiredRef.current = true;
      window.ttq.track('ViewContent', { contents: [content], value, currency: 'USD' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AddToCart à chaque choix d'offre
  const selectOffer = (id: string) => {
    setOfferId(id);
    const o = getOffer(id);
    const value = Number((o.price / rate).toFixed(2));
    if (window.ttq) window.ttq.track('AddToCart', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name, quantity: o.boxes }], value, currency: 'USD' });
  };

  // InitiateCheckout à la première interaction avec le formulaire
  const handleFirstInteraction = () => {
    if (checkoutFiredRef.current) return;
    checkoutFiredRef.current = true;
    const value = Number((offer.price / rate).toFixed(2));
    if (window.ttq) window.ttq.track('InitiateCheckout', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name }], value, currency: 'USD' });
  };

  // Barre fixe (bouton + WhatsApp) masquée quand le formulaire est à l'écran
  useEffect(() => {
    const form = document.getElementById('order');
    if (!form || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.05 });
    obs.observe(form);
    return () => obs.disconnect();
  }, []);

  const toForm = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('order')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };
  const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

  const boxesNeeded = area > 0 ? Math.ceil(area / M2_PER_BOX - 1e-9) : 0;
  const tooBig = boxesNeeded > CALC_MAX_BOXES;
  const suggestion = boxesNeeded > 0 && !tooBig ? getOffer(offerForBoxes(boxesNeeded)) : null;
  const deskMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.desk));
  const homeMin = Math.min(...Object.values(DELIVERY_PRICES).map(p => p.home));

  return (
    <div className="min-h-screen bg-[#F3F7FB] font-sans text-slate-800 overflow-x-hidden" dir="rtl" lang="ar">
      {/* 1. Barre du haut */}
      <div className="bg-[#FFD60A] text-[#0B1B3F] text-[13px] font-black py-2 px-3 flex items-center justify-center gap-3">
        <span className="flex items-center gap-1"><Banknote size={15} /> الدفع عند الاستلام</span>
        <span className="w-px h-3.5 bg-[#0B1B3F]/30" />
        <span className="flex items-center gap-1"><Truck size={15} /> توصيل 69 ولاية</span>
      </div>

      {/* 2-3. Haut de page */}
      <header className="relative bg-[#0B1B3F] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_0%,rgba(46,196,241,.28),transparent_60%)]" aria-hidden="true" />
        <div className="relative max-w-xl mx-auto px-4 pt-5 pb-6 text-center">
          <h1 className="text-[27px] leading-[1.25] font-black tracking-tight">
            القطرة راجعة مع الشتا؟<br /><span className="text-[#FFD60A]">سكّرلها الطريق</span> من السطح
          </h1>
          <div className="relative mt-4 mx-auto w-[64%] max-w-[260px] rounded-[26px] overflow-hidden ring-1 ring-white/15 shadow-2xl bg-[#0E2A5C]" style={{ aspectRatio: `${PHOTO_HERO.w} / ${PHOTO_HERO.h}` }}>
            <img src={PHOTO_HERO.src} alt={PHOTO_HERO.alt} width={PHOTO_HERO.w} height={PHOTO_HERO.h} fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
            <span className="absolute top-2 right-2 bg-white text-[#0B1B3F] text-[11px] font-black rounded-full px-2 py-0.5 shadow flex items-center gap-1"><BadgeCheck size={12} className="text-[#1366d6]" /> صورة حقيقية</span>
          </div>
          <div className="relative -mt-5 mx-auto w-[92%] max-w-[360px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] px-3 py-2.5 shadow-2xl ring-4 ring-[#0B1B3F]">
            <p className="text-[15.5px] font-black leading-snug flex items-center justify-center gap-1.5"><Gift size={17} /> 1,4 كلغ بسعر 1 كلغ – 2 علب + 1 مجانية</p>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[12.5px] font-black">
            <span className="rounded-full bg-emerald-500 text-white px-2.5 py-1">منتوج أصلي ✅</span>
            <span className="rounded-full bg-white/12 ring-1 ring-white/20 px-2.5 py-1">5,6 م² للعلبة</span>
            <span className="rounded-full bg-white/12 ring-1 ring-white/20 px-2.5 py-1">الدفع عند الاستلام</span>
          </div>
        </div>
      </header>

      {/* 4. Formulaire */}
      <section id="order" className="px-3 pt-5 pb-8 scroll-mt-2 bg-gradient-to-b from-[#0B1B3F] to-[#0E2A5C]">
        <div className="max-w-xl mx-auto">
          <CheckoutFormPigma offerId={offerId} onOfferChange={selectOffer} sourceTag={SOURCE_TAG} onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction}
            source={SOURCE} extraPayload={() => ({ utm: readUtm() })} highlightOffer={{ id: 'pack3', badge: 'الأكثر طلبا' }} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px] font-bold text-sky-100/85">
            <span className="flex flex-col items-center gap-1"><Banknote size={20} className="text-[#FFD60A]" /> الدفع عند الاستلام</span>
            <span className="flex flex-col items-center gap-1"><Truck size={20} className="text-[#FFD60A]" /> 24 حتى 48 ساعة</span>
            <span className="flex flex-col items-center gap-1"><PhoneCall size={20} className="text-[#FFD60A]" /> نعيطولك نأكدو</span>
          </div>
        </div>
      </section>

      <main className="max-w-xl mx-auto px-3">
        {/* 5. Preuves */}
        <section className="pt-8">
          <h2 className="text-center text-[23px] font-black text-[#0B1B3F]">شوف التجربة: الماء ما يدخلش</h2>
          <p className="mt-1 text-center text-[14px] font-semibold text-slate-500">فيديو Pigma Color: كرتونة مدهونة عامرة بالماء، وبعد 48 ساعة بقات صحيحة</p>
          <div className="relative mt-4 mx-auto w-full max-w-[340px] rounded-[26px] overflow-hidden bg-[#0B1B3F]" style={{ aspectRatio: '9 / 16' }}>
            {videoOn ? (
              <video src={VIDEO.src} poster={VIDEO.poster} controls autoPlay playsInline preload="none" className="w-full h-full object-cover" />
            ) : (
              <button type="button" onClick={() => setVideoOn(true)} className="absolute inset-0 w-full h-full flex items-center justify-center" aria-label="شغّل فيديو تجربة الماء">
                <img src={VIDEO.poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-75" />
                <span className="relative w-[72px] h-[72px] rounded-full bg-[#FFD60A] text-[#0B1B3F] flex items-center justify-center shadow-xl"><Play size={32} fill="currentColor" /></span>
              </button>
            )}
          </div>
          <div className="mt-6 space-y-4">
            <Img src={P400 + 'quantite.webp'} srcSet={`${P400}quantite-640.webp 640w, ${P400}quantite.webp 1080w`} w={1080} h={1350} alt="مقارنة: علبة Pigma Color تاع 1,4 كلغ قدام علبة عادية تاع 1 كلغ" />
            <Img src={P400 + 'surface.webp'} srcSet={`${P400}surface-640.webp 640w, ${P400}surface.webp 1080w`} w={1080} h={1350} alt="العلبة تاع 1,4 كلغ تغطي 5,6 م² بطبقتين" />
          </div>
        </section>

        {/* 6. Avis (masqué tant qu'aucune image n'est ajoutée) */}
        {REVIEWS.length > 0 && (
          <section className="pt-8">
            <h2 className="text-center text-[23px] font-black text-[#0B1B3F]">آراء الناس اللي جربوه</h2>
            <p className="mt-1 text-center text-[13px] font-semibold text-slate-500">تعليقات حقيقية على تيك توك وفيسبوك حول Stop Fuites (الأسماء مخفية)</p>
            <div className="mt-4 grid grid-cols-2 gap-2 items-start">
              {REVIEWS.map(r => <Img key={r.src} src={r.src} w={r.w} h={r.h} alt={r.alt} />)}
            </div>
          </section>
        )}

        {/* 7. Calculatrice */}
        <section className="pt-8">
          <div className="rounded-[26px] bg-[#0B1B3F] text-white p-5">
            <p className="font-black text-[20px] flex items-center gap-2"><Calculator size={22} className="text-[#7DD9FF]" /> شحال من علبة تلزمك؟</p>
            <p className="mt-1 text-[13px] text-sky-100/75 font-semibold">العلبة (1,4 كلغ) تغطي حوالي 5,6 م² بطبقتين.</p>
            <div className="mt-4 flex items-center gap-3">
              <label htmlFor="pm-area" className="text-[14px] font-bold text-sky-100/90">المساحة</label>
              <input id="pm-area" type="number" inputMode="decimal" min={1} max={1000} value={area || ''}
                onChange={e => setArea(Math.min(1000, Math.max(0, Number(e.target.value) || 0)))}
                className="w-24 h-12 rounded-xl bg-white text-[#0B1B3F] text-[22px] font-black text-center outline-none" />
              <span className="text-[18px] font-black">م²</span>
            </div>
            <input type="range" min={1} max={60} step={1} value={Math.min(Math.max(area, 1), 60)} onChange={e => setArea(Number(e.target.value))}
              aria-label="مساحة السطح بالمتر المربع" className="mt-4 w-full accent-[#FFD60A] h-2" />
            {tooBig ? (
              <div className="mt-4 rounded-2xl bg-[#FFD60A] text-[#0B1B3F] p-4">
                <p className="text-[16px] font-black">تلزمك أكثر من 9 علب</p>
                <p className="mt-1 text-[14px] font-bold">للكميات الأكبر، نعطيوك سعر خاص بيك.</p>
                <a href={waLink(`السلام عليكم، حاب سعر خاص لـ Stop Fuites الشفاف. المساحة: ${area} م²`)} target="_blank" rel="noopener noreferrer"
                  className="mt-3 h-12 rounded-xl bg-[#0B1B3F] text-white font-black flex items-center justify-center gap-2"><MessageCircle size={19} /> اطلب سعرك على واتساب</a>
              </div>
            ) : suggestion ? (
              <>
                <div className="mt-4 rounded-2xl bg-white/10 p-4 flex items-center gap-4">
                  <div className="text-center shrink-0">
                    <p className="text-[40px] leading-none font-black text-[#FFD60A]">{boxesNeeded}</p>
                    <p className="text-[12px] font-bold text-sky-100/75">{boxesNeeded === 1 ? 'علبة' : 'علب'}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-sky-100/75">العرض المناسب</p>
                    <p className="text-[15px] font-black leading-snug">{suggestion.title}</p>
                    <p className="text-[13px] font-bold text-[#7DD9FF]">{boxesLabel(suggestion.boxes)} · {da(suggestion.price)}{suggestion.freeDelivery ? ' · توصيل مجاني' : ''}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { selectOffer(suggestion.id); toForm(); }}
                  className="mt-3 w-full h-[52px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] font-black text-[17px] active:scale-[0.98] transition-transform">اختار هذا العرض واطلب</button>
              </>
            ) : null}
          </div>
        </section>

        {/* 8. Repliables */}
        <section className="pt-8 pb-6 space-y-2">
          <Fold title="كيفاش تدهنو؟ 3 خطوات">
            <ol className="space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex items-center gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-2xl bg-[#0B1B3F] text-[#FFD60A] font-black flex items-center justify-center text-[18px]">{i + 1}</span>
                  <div className="min-w-0"><p className="font-black text-[15.5px] text-[#0B1B3F]">{s.t}</p><p className="text-[14px] font-semibold text-slate-600 leading-relaxed">{s.d}</p></div>
                </li>
              ))}
            </ol>
            <ul className="mt-3 rounded-2xl bg-[#0B1B3F] text-white p-4 space-y-2 text-[14px] font-semibold text-sky-100/90">
              <li className="flex gap-2"><CloudRain size={18} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">بلا شتا</b> 24 حتى 48 ساعة من بعد الدهان.</span></li>
              <li className="flex gap-2"><Sun size={18} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">بين 5° و 35°</b>، خير وقت الصباح بكري.</span></li>
              <li className="flex gap-2"><Eye size={18} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">أبيض كي تدهنو؟ عادي</b>، يولي شفاف كي ينشف كامل.</span></li>
            </ul>
          </Fold>
          <h2 className="pt-4 pb-1 text-center text-[21px] font-black text-[#0B1B3F]">عندك سؤال؟</h2>
          {FAQ(deskMin, homeMin).map(f => (
            <Fold key={f.q} title={f.q}><p className="text-[14.5px] font-semibold text-slate-600 leading-relaxed">{f.a}</p></Fold>
          ))}
        </section>

        <footer className="pt-2 pb-28 text-center text-[11.5px] font-semibold text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1"><ShieldCheck size={13} /> Pigma Color و Stop Fuites علامات تجارية لأصحابها. YANIS SHOP بائع للمنتج.</p>
        </footer>
      </main>

      {/* 9-10. Barre fixe : bouton de commande + WhatsApp à côté (ne cache jamais un bouton), masquée quand le formulaire est visible */}
      <div className={`fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${formVisible ? 'translate-y-full' : 'translate-y-0'}`} aria-hidden={formVisible}>
        <div className="max-w-xl mx-auto bg-[#0B1B3F]/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex items-center gap-2">
          <button type="button" tabIndex={formVisible ? -1 : 0} onClick={toForm}
            className="flex-1 h-[56px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[18px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <ShoppingCart size={20} /> اطلب الآن – {da(offer.price)}
          </button>
          <a href={waLink('السلام عليكم، عندي سؤال على Stop Fuites الشفاف')} target="_blank" rel="noopener noreferrer"
            tabIndex={formVisible ? -1 : 0} aria-label="تواصل معنا على واتساب"
            className="shrink-0 w-[56px] h-[56px] rounded-2xl bg-[#25D366] text-white flex items-center justify-center">
            <MessageCircle size={26} fill="currentColor" />
          </a>
        </div>
      </div>
    </div>
  );
}
