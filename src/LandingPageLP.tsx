import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  ShoppingCart, Truck, Banknote, PhoneCall, ShieldCheck, BellRing, Clock, Grid2x2, Monitor,
  Battery, Briefcase, Droplets, Feather, Users, HeartPulse, Plane, Gift, Check, X, ChevronDown,
  PackageCheck, Star, AlertTriangle,
} from 'lucide-react';
import CheckoutFormLP from './CheckoutFormLP';
import { DELIVERY_PRICES } from './data';

const Testimonials = lazy(() => import('./Testimonials'));

// Produit de référence : on réutilise "med-alarm-v3" pour que le prix reste piloté depuis le dashboard
// et que les commandes arrivent exactement comme celles de /product-v3/med-alarm-v3.
const PRODUCT_ID = 'med-alarm-v3';
// Étiquette envoyée dans le champ `source` de chaque commande, pour distinguer la variante B dans le dashboard.
const SOURCE_TAG = 'LP med-alarm (B)';

const A = '/lp-assets/';

const minDelivery = (type: 'home' | 'desk') => Math.min(...Object.values(DELIVERY_PRICES).map(p => p[type]));

// Les pixels sont initialisés dans App.tsx *après* les effets des pages enfants :
// on attend qu'ils soient prêts avant d'envoyer un événement, sinon il est perdu à la première visite.
const whenReady = (check: () => boolean, fn: () => void, timeoutMs = 10000) => {
  if (check()) { fn(); return () => {}; }
  const started = Date.now();
  const id = setInterval(() => {
    if (check()) { clearInterval(id); fn(); }
    else if (Date.now() - started > timeoutMs) clearInterval(id);
  }, 300);
  return () => clearInterval(id);
};

const Section = ({ id, className = '', children }: { id?: string; className?: string; children: React.ReactNode }) => (
  <section id={id} className={`px-4 py-10 ${className}`}>
    <div className="max-w-xl mx-auto">{children}</div>
  </section>
);

const Title = ({ kicker, children }: { kicker?: string; children: React.ReactNode }) => (
  <div className="text-center mb-6">
    {kicker && <p className="text-[13px] font-bold text-emerald-700 mb-1">{kicker}</p>}
    <h2 className="text-[26px] leading-tight font-black text-slate-900">{children}</h2>
  </div>
);

const Img = ({ src, alt, w, h, className = '' }: { src: string; alt: string; w: number; h: number; className?: string }) => (
  <img src={A + src} alt={alt} width={w} height={h} loading="lazy" decoding="async"
    className={`w-full h-auto bg-slate-100 ${className}`} style={{ aspectRatio: `${w} / ${h}` }} />
);

const CtaButton = ({ onClick, label = 'اطلب الآن – الدفع عند الاستلام' }: { onClick: () => void; label?: string }) => (
  <button type="button" onClick={onClick}
    className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-lg font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2">
    <ShoppingCart size={20} /> {label}
  </button>
);

const FAQ_ITEMS = (homeMin: number, deskMin: number) => [
  { q: 'هل أدفع قبل الاستلام؟', a: 'لا. لا تدفع أي شيء قبل أن ترى المنتج وتتأكد منه. تدفع لعامل التوصيل عند الاستلام فقط.' },
  { q: 'كم سعر التوصيل؟', a: `حسب الولاية: يبدأ من ${deskMin} د.ج للتوصيل إلى المكتب ومن ${homeMin} د.ج للتوصيل إلى المنزل. يظهر السعر الدقيق في الاستمارة بعد اختيار ولايتك.` },
  { q: 'هل توصلون إلى ولايتي؟', a: 'نعم، التوصيل متوفر إلى جميع الولايات الـ 58.' },
  { q: 'كيف أضبط المنبه؟', a: 'الأزرار مكتوب عليها وظيفتها: TIME لضبط الساعة، ALARM لضبط المنبهات، HOUR و MINUTE لاختيار الساعة والدقيقة، و ON/OFF للتشغيل والإيقاف. يمكنك ضبط حتى 4 منبهات في اليوم.' },
  { q: 'هل البطاريات مرفقة؟', a: 'نعم، البطاريات مرفقة مع العلبة. هي بطاريات صغيرة مسطحة مثل بطاريات الساعة، وتدوم لفترة طويلة.' },
  { q: 'هل يهتز المنبه؟', a: 'لا، التنبيه يكون بالصوت فقط.' },
  { q: 'كم عدد الأقسام؟', a: '4 أقسام، مثلاً قسم لكل موعد: الصباح، الظهر، المساء، وقبل النوم.' },
  { q: 'ماذا يحدث بعد الطلب؟', a: 'يتصل بك فريقنا لتأكيد الطلب، ثم نرسله إليك. نرجو الرد على المكالمة حتى نجهز طلبك بسرعة.' },
];

export default function LandingPageLP({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  const product = config.products?.find((p: any) => p.id === PRODUCT_ID) || {
    id: PRODUCT_ID, name: 'منبه الدواء الذكي', price: 2900, oldPrice: 4200,
  };
  const price = Number(product.price);
  const oldPrice = Number(product.oldPrice);
  const showOldPrice = config.promoActive !== false && oldPrice > price;
  const usdRate = Number(config?.usdRate) > 0 ? Number(config.usdRate) : 250;
  const usdValue = Number((price / usdRate).toFixed(2));

  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const checkoutFiredRef = useRef(false);

  useEffect(() => {
    document.title = 'منبه الدواء الذكي – الدفع عند الاستلام';
  }, []);

  // ViewContent (TikTok + Meta), une seule fois, dès que les pixels sont prêts
  useEffect(() => {
    const content = { content_id: product.id, content_type: 'product', content_name: product.name };
    const stopTt = whenReady(() => !!window.ttq, () => {
      window.ttq.track('ViewContent', { contents: [content], value: usdValue, currency: 'USD' });
    });
    const stopFb = whenReady(() => !!window.fbq, () => {
      window.fbq('track', 'ViewContent', {
        content_name: product.name, content_ids: [product.id], content_type: 'product', value: usdValue, currency: 'USD',
      });
    });
    return () => { stopTt(); stopFb(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // InitiateCheckout : à la première interaction avec un formulaire
  const handleFirstInteraction = () => {
    if (checkoutFiredRef.current) return;
    checkoutFiredRef.current = true;
    const content = { content_id: product.id, content_type: 'product', content_name: product.name };
    if (window.ttq) window.ttq.track('InitiateCheckout', { contents: [content], value: usdValue, currency: 'USD' });
    if (window.fbq) window.fbq('track', 'InitiateCheckout', {
      content_ids: [product.id], content_type: 'product', value: usdValue, currency: 'USD', num_items: 1,
    });
    if (window.gtag && config?.ga4MeasurementId) window.gtag('event', 'begin_checkout', {
      currency: 'USD', value: usdValue, items: [{ item_id: product.id, item_name: product.name, price: usdValue, quantity: 1 }],
    });
  };

  const scrollToForm = (id = 'order') => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToNearestForm = () => {
    const forms = ['order', 'checkout'].map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const nearest = forms.sort((a, b) => Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top))[0];
    nearest?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Bouton collant : visible après le hero, masqué quand un formulaire est à l'écran
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const visible = new Map<Element, boolean>();
    let heroPassed = false;
    const update = () => setShowSticky(heroPassed && ![...visible.values()].some(Boolean));

    const heroObs = new IntersectionObserver(([e]) => {
      heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    });
    const formObs = new IntersectionObserver(entries => {
      entries.forEach(e => visible.set(e.target, e.isIntersecting));
      update();
    }, { threshold: 0.15 });

    const hero = document.getElementById('hero-cta');
    if (hero) heroObs.observe(hero);
    ['order', 'checkout'].forEach(id => { const el = document.getElementById(id); if (el) formObs.observe(el); });
    return () => { heroObs.disconnect(); formObs.disconnect(); };
  }, []);

  const homeMin = minDelivery('home');
  const deskMin = minDelivery('desk');

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800" dir="rtl" lang="ar">
      <div className="max-w-xl mx-auto bg-white min-h-screen shadow-xl pb-24">

        {/* 0. Bandeau */}
        <div className="bg-slate-900 text-white text-[13px] font-bold py-2 px-3 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5"><Truck size={15} /> التوصيل لـ 69 ولاية</span>
          <span className="w-px h-3.5 bg-white/30" />
          <span className="flex items-center gap-1.5"><Banknote size={15} /> الدفع عند الاستلام</span>
        </div>

        {/* 1. Hero */}
        <section className="px-4 pt-5 pb-6">
          <div className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-slate-600 mb-3">
            <span className="flex text-amber-400" aria-hidden="true">
              {[0, 1, 2, 3, 4].map(i => <Star key={i} size={14} fill="currentColor" strokeWidth={0} />)}
            </span>
            أكثر من 100 زبون راضٍ
          </div>
          <h1 className="text-[32px] leading-[1.2] font-black text-center text-slate-900">
            لا تنسَ دواءك<br /><span className="text-emerald-600">بعد اليوم</span>
          </h1>
          <p className="text-center text-[16px] font-semibold text-slate-600 mt-2">
            علبة أدوية بـ 4 أقسام ومنبّه يرنّ حتى <b className="text-slate-900">4 مرات في اليوم</b> في الوقت الذي تختاره
          </p>

          <div className="relative mt-4 rounded-3xl overflow-hidden bg-slate-100" style={{ aspectRatio: '800 / 603' }}>
            <img src={A + 'med-alarm-hero.webp'} alt="منبه الدواء الذكي – علبة أدوية بـ 4 أقسام وشاشة رقمية"
              width={800} height={603} loading="eager" fetchPriority="high" decoding="async"
              className="w-full h-full object-cover" />
            <span className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[12px] font-black px-3 py-1.5 rounded-full shadow flex items-center gap-1">
              <BellRing size={14} className="text-emerald-600" /> 4 منبهات يومية
            </span>
            <span className="absolute bottom-3 left-3 bg-white/95 text-slate-900 text-[12px] font-black px-3 py-1.5 rounded-full shadow flex items-center gap-1">
              <Battery size={14} className="text-emerald-600" /> البطاريات مرفقة
            </span>
          </div>

          <div className="mt-4 flex items-end justify-center gap-3">
            <span className="text-[40px] leading-none font-black text-emerald-700">{price}<span className="text-xl"> د.ج</span></span>
            {showOldPrice && <span className="text-lg font-bold text-slate-400 line-through mb-1">{oldPrice} د.ج</span>}
          </div>

          <ul className="mt-4 grid grid-cols-3 gap-2 text-center text-[12px] font-bold text-slate-700">
            <li className="bg-slate-50 rounded-xl py-2.5 px-1 flex flex-col items-center gap-1"><Banknote size={20} className="text-emerald-600" />الدفع عند الاستلام</li>
            <li className="bg-slate-50 rounded-xl py-2.5 px-1 flex flex-col items-center gap-1"><PackageCheck size={20} className="text-emerald-600" />افحص قبل أن تدفع</li>
            <li className="bg-slate-50 rounded-xl py-2.5 px-1 flex flex-col items-center gap-1"><PhoneCall size={20} className="text-emerald-600" />نتصل بك للتأكيد</li>
          </ul>

          <div id="hero-cta" className="mt-4">
            <CtaButton onClick={() => scrollToForm('order')} />
          </div>
        </section>

        {/* 2. Formulaire n°1 */}
        <section id="order" className="px-4 pb-8 scroll-mt-3">
          <div className="max-w-xl mx-auto">
            <CheckoutFormLP product={product} formId="order" sourceTag={SOURCE_TAG}
              onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction} />
          </div>
        </section>

        {/* 3. Problème → solution */}
        <Section className="bg-slate-50">
          <Title kicker="هل يحدث هذا معك أو مع والديك؟">نسيان الدواء مشكلة يومية</Title>
          <div className="space-y-3">
            {[
              'كثرة الأدوية والمواعيد تجعل من السهل نسيان جرعة.',
              'أحياناً لا تتذكر: هل أخذت الدواء أم لا؟',
              'في العمل أو السفر تنشغل ويمرّ الوقت.',
            ].map(t => (
              <div key={t} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-slate-200">
                <span className="shrink-0 w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center"><X size={16} /></span>
                <p className="text-[15px] font-semibold text-slate-700">{t}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-emerald-600 text-white p-5">
            <p className="text-[18px] font-black mb-1">الحل: منبه الدواء الذكي</p>
            <p className="text-[15px] font-semibold text-emerald-50">
              ضع أدويتك في الأقسام الأربعة واضبط المنبه، وسيذكّرك بالصوت في كل موعد. هكذا تعرف دائماً متى تأخذ دواءك.
            </p>
          </div>
        </Section>

        {/* 4. Comment ça marche */}
        <Section>
          <Title kicker="سهلة الاستعمال والضبط">كيف تعمل؟ 3 خطوات</Title>
          <ol className="space-y-3 mb-6">
            {[
              { t: 'ضع أدويتك', d: 'وزّع حبوبك على الأقسام الأربعة حسب المواعيد.' },
              { t: 'اضبط المنبهات', d: 'اضبط الساعة ثم حتى 4 مواعيد في اليوم بأزرار واضحة.' },
              { t: 'يرنّ في الوقت', d: 'عند كل موعد يرنّ المنبه لتتذكر دواءك.' },
            ].map((s, i) => (
              <li key={s.t} className="flex items-start gap-3">
                <span className="shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-black text-slate-900">{s.t}</p>
                  <p className="text-[14px] font-semibold text-slate-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="rounded-3xl border border-slate-200 overflow-hidden">
            <Img src="med-alarm-buttons.webp" alt="أزرار منبه الدواء: TIME و ALARM و MEMO و ON/OFF و HOUR و MINUTE" w={600} h={830} />
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 p-4 text-[13px] font-bold text-slate-700 bg-slate-50">
              {[
                'ضبط الوقت (TIME · HOUR · MINUTE)',
                'ضبط المنبه (ALARM)',
                'زر التذكيرات (MEMO)',
                'رموز المنبهات الأربعة',
                'شاشة LCD واضحة',
                'زر التشغيل والإيقاف (ON/OFF)',
              ].map((t, i) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center">{i + 1}</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* 5. Fonctionnalités */}
        <Section className="bg-slate-50">
          <Title kicker="كل ما تحتاجه في علبة صغيرة">المميزات</Title>
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: BellRing, t: '4 منبهات في اليوم', d: 'تنبيه بالصوت في كل موعد' },
              { Icon: Grid2x2, t: '4 أقسام', d: 'قسم لكل موعد' },
              { Icon: Monitor, t: 'شاشة LCD', d: 'تعرض الساعة والمنبهات' },
              { Icon: Battery, t: 'البطاريات مرفقة', d: 'تدوم لفترة طويلة' },
              { Icon: Droplets, t: 'غطاء محكم', d: 'يحمي من الهواء والغبار والرطوبة' },
              { Icon: Feather, t: 'خفيفة وصغيرة', d: 'في الجيب أو الحقيبة' },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="bg-white rounded-2xl p-4 border border-slate-200">
                <Icon size={24} className="text-emerald-600 mb-2" />
                <p className="font-black text-[15px] text-slate-900">{t}</p>
                <p className="text-[13px] font-semibold text-slate-500">{d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <figure className="rounded-3xl overflow-hidden bg-white border border-slate-200">
              <Img src="med-alarm-lcd.webp" alt="شاشة المنبه مع رموز المنبهات الأربعة" w={600} h={496} />
              <figcaption className="p-4 text-[14px] font-bold text-slate-700">
                <Clock size={16} className="inline text-emerald-600 ml-1" /> شاشة رقمية تعرض الوقت ورموز المنبهات الأربعة
              </figcaption>
            </figure>
            <div className="grid grid-cols-2 gap-3">
              <figure className="rounded-2xl overflow-hidden bg-white border border-slate-200">
                <Img src="med-alarm-open.webp" alt="علبة الدواء مفتوحة" w={297} h={297} />
                <figcaption className="p-3 text-[13px] font-bold text-slate-700 text-center">سهلة الفتح والغلق</figcaption>
              </figure>
              <figure className="rounded-2xl overflow-hidden bg-white border border-slate-200">
                <Img src="med-alarm-hand.webp" alt="علبة الدواء في اليد" w={296} h={297} />
                <figcaption className="p-3 text-[13px] font-bold text-slate-700 text-center">خفيفة الوزن</figcaption>
              </figure>
            </div>
            <figure className="rounded-3xl overflow-hidden bg-white border border-slate-200">
              <Img src="med-alarm-pocket.webp" alt="علبة الدواء في الجيب" w={459} h={464} />
              <figcaption className="p-4 text-[14px] font-bold text-slate-700">
                <Briefcase size={16} className="inline text-emerald-600 ml-1" /> صغيرة الحجم، مناسبة للحمل أثناء العمل والسفر
              </figcaption>
            </figure>
            <figure className="rounded-3xl overflow-hidden bg-white border border-slate-200">
              <Img src="med-alarm-pills.webp" alt="علبة الدواء مع الحبوب" w={479} h={479} />
              <figcaption className="p-4 text-[14px] font-bold text-slate-700">
                <ShieldCheck size={16} className="inline text-emerald-600 ml-1" /> بلاستيك طبي غير سام، مقاوم لأشعة الشمس
              </figcaption>
            </figure>
          </div>
        </Section>

        {/* 6. Pour qui */}
        <Section>
          <Title>لمن هذه العلبة؟</Title>
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: Users, t: 'لوالديك وكبار السن', d: 'تذكير بسيط بدون هاتف' },
              { Icon: HeartPulse, t: 'لمن يتبع علاجاً طويلاً', d: 'عدة أدوية في اليوم' },
              { Icon: Plane, t: 'للمشغولين والمسافرين', d: 'أدويتك معك أينما كنت' },
              { Icon: Gift, t: 'هدية مفيدة', d: 'لمن تحب وتهتم بصحته' },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="rounded-2xl p-4 bg-emerald-50 border border-emerald-100 text-center">
                <Icon size={26} className="text-emerald-700 mx-auto mb-2" />
                <p className="font-black text-[14px] text-slate-900">{t}</p>
                <p className="text-[12px] font-semibold text-slate-600 mt-0.5">{d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 7. Comparatif */}
        <Section className="bg-slate-50">
          <Title>علبة عادية أم منبه الدواء الذكي؟</Title>
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-right font-bold p-3"> </th>
                  <th className="font-bold p-3 w-24">علبة عادية</th>
                  <th className="font-black p-3 w-28 bg-emerald-600">منبه الدواء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['أقسام لتنظيم الأدوية', true, true],
                  ['تنبيه بالصوت في وقت الدواء', false, true],
                  ['حتى 4 مواعيد في اليوم', false, true],
                  ['شاشة تعرض الساعة', false, true],
                ].map(([label, a, b]) => (
                  <tr key={label as string}>
                    <td className="p-3 font-semibold text-slate-700">{label}</td>
                    <td className="p-3 text-center">{a ? <Check className="inline text-emerald-600" size={20} /> : <X className="inline text-rose-500" size={20} />}</td>
                    <td className="p-3 text-center bg-emerald-50/60">{b ? <Check className="inline text-emerald-600" size={20} /> : <X className="inline text-rose-500" size={20} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 8. Avis réels (captures existantes) */}
        <Suspense fallback={<div className="min-h-[300px]" />}>
          <Testimonials />
        </Suspense>

        {/* 9. Garantie */}
        <Section>
          <div className="rounded-3xl border-2 border-dashed border-emerald-600 p-5 text-center">
            <ShieldCheck size={36} className="text-emerald-600 mx-auto mb-2" />
            <p className="text-[20px] font-black text-slate-900">لا تدفع شيئاً قبل أن تتأكد</p>
            <p className="text-[15px] font-semibold text-slate-600 mt-1">
              تستلم المنتج، تفحصه بنفسك، ثم تدفع لعامل التوصيل. بدون أي دفع مسبق.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-4 text-[12px] font-bold text-slate-700">
              <span className="flex flex-col items-center gap-1"><PhoneCall size={20} className="text-emerald-600" />اتصال للتأكيد</span>
              <span className="flex flex-col items-center gap-1"><Truck size={20} className="text-emerald-600" />58 ولاية</span>
              <span className="flex flex-col items-center gap-1"><Banknote size={20} className="text-emerald-600" />الدفع عند الاستلام</span>
            </div>
          </div>
        </Section>

        {/* 10. Formulaire n°2 */}
        <section id="checkout" className="px-4 pb-10 scroll-mt-3">
          <div className="max-w-xl mx-auto">
            <CheckoutFormLP product={product} formId="checkout" sourceTag={SOURCE_TAG}
              onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction} />
          </div>
        </section>

        {/* 11. FAQ */}
        <Section className="bg-slate-50">
          <Title>أسئلة شائعة</Title>
          <div className="space-y-2">
            {FAQ_ITEMS(homeMin, deskMin).map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q} className="bg-white rounded-2xl border border-slate-200">
                  <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-right font-black text-[15px] text-slate-900">
                    {item.q}
                    <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && <p className="px-4 pb-4 -mt-1 text-[14px] font-semibold text-slate-600 leading-relaxed">{item.a}</p>}
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <CtaButton onClick={() => scrollToForm('checkout')} />
          </div>
        </Section>

        {/* 12. Avertissement */}
        <footer className="px-4 py-6 text-center">
          <p className="text-[12px] font-semibold text-slate-400 flex items-start justify-center gap-1.5">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            هذا المنتج أداة تذكير فقط لتنظيم مواعيد الدواء، ولا يغني عن استشارة الطبيب أو الصيدلي.
          </p>
        </footer>
      </div>

      {/* Bouton collant */}
      <div className={`fixed bottom-0 inset-x-0 z-50 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!showSticky}>
        <div className="max-w-xl mx-auto bg-white/95 backdrop-blur border-t border-slate-200 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          <button type="button" tabIndex={showSticky ? 0 : -1} onClick={scrollToNearestForm}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white text-[17px] font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2">
            <ShoppingCart size={20} /> اطلب الآن – {price} د.ج
          </button>
        </div>
      </div>
    </div>
  );
}
