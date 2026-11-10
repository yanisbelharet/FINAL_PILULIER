// Landing page de la pub TikTok « 400 غرام مجانا » (/lp/pigma-400g).
// Même produit, mêmes prix, même envoi des commandes et mêmes événements pixel que /lp/pigma-stop-fuites,
// mais une page courte : image, formulaire tout de suite, images explicatives, FAQ. Pas de librairie en plus.
import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, ChevronDown, AlertCircle, Check, PhoneCall, Lock, ShoppingCart, MessageCircle } from 'lucide-react';
import { WILAYAS, DELIVERY_PRICES } from './data';
import { normalizePhone, isValidAlgerianMobile } from './CheckoutFormLP';
import { PIGMA_PRODUCT, getOffer, boxesLabel } from './CheckoutFormPigma';
import { da } from './pigmaFormat';
import { usePricing } from './pricing';

declare global { interface Window { ttq: any; fbq: any; gtag: any } }

const SOURCE = 'lp-400g';
const WHATSAPP = '213557920685';
const OFFERS = ['pack1', 'pack3'] as const;
const DEFAULT_OFFER = 'pack3';
const IMG = '/lp-assets/pigma400/';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'ttclid', 'fbclid', 'gclid'];

const usdRate = (config: any) => (Number(config?.usdRate) > 0 ? Number(config.usdRate) : 250);

// Exécute fn dès que check() est vrai (pixel chargé), sans bloquer l'affichage
const whenReady = (check: () => boolean, fn: () => void, timeoutMs = 10000) => {
  if (check()) { fn(); return () => {}; }
  const start = Date.now();
  const id = setInterval(() => {
    if (check()) { clearInterval(id); fn(); } else if (Date.now() - start > timeoutMs) clearInterval(id);
  }, 150);
  return () => clearInterval(id);
};

// Paramètres UTM / identifiants de clic de l'URL, gardés pour la session (transmis avec la commande)
const readUtm = (): Record<string, string> => {
  const out: Record<string, string> = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem('lp400g_utm') || '{}');
    Object.assign(out, saved);
  } catch { /* stockage indisponible */ }
  const p = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach(k => { const v = p.get(k); if (v) out[k] = v.slice(0, 200); });
  try { sessionStorage.setItem('lp400g_utm', JSON.stringify(out)); } catch { /* ignore */ }
  return out;
};

const homeMin = () => Math.min(...Object.values(DELIVERY_PRICES).map(p => p.home));

const FAQ = () => [
  { q: 'شحال تغطي العلبة؟', a: 'كل 1 كلغ يغطي حوالي 4 م² بطبقتين. يعني العلبة تاع 1,4 كلغ تغطي حوالي 5,6 م².' },
  { q: 'شحال التوصيل؟', a: `التوصيل للدار حسب الولاية، يبدا من ${homeMin()} د.ج، ويبانلك السعر كي تختار الولاية في الاستمارة. يوصلك في 24 ساعة، و48 ساعة على الأكثر.` },
  { q: 'المنتوج أصلي؟', a: 'إيه، Stop Fuites أصلي من Pigma Color. احذرو الماركات المقلدة: تستلم العلبة وتشوفها قبل ما تخلص.' },
  { q: 'كيفاش نخلص؟', a: 'الدفع عند الاستلام: ما تخلص والو دركا. تستلم الطلب، تشوفو، ومن بعد تخلص لعامل التوصيل.' },
];

// Image pleine largeur (640 px pour les petits écrans, 1080 px sinon), format 4:5
const Picture = ({ name, alt, priority = false }: { name: string; alt: string; priority?: boolean }) => (
  <img src={`${IMG}${name}.webp`} srcSet={`${IMG}${name}-640.webp 640w, ${IMG}${name}.webp 1080w`} sizes="(max-width: 576px) 100vw, 576px"
    width={1080} height={1350} alt={alt} decoding="async"
    loading={priority ? 'eager' : 'lazy'} {...(priority ? { fetchpriority: 'high' } as any : {})}
    className="block w-full h-auto bg-slate-200" />
);

type Field = 'name' | 'phone' | 'wilaya' | 'commune';
type Errors = Partial<Record<Field, string>>;

const OrderForm = ({ offerId, onOfferChange, onPurchase, onFirstInteraction }: {
  offerId: string;
  onOfferChange: (id: string) => void;
  onPurchase: (p: number, product: any, formData: any) => void;
  onFirstInteraction: () => void;
}) => {
  usePricing();
  const isSubmittingRef = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', commune: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { name: string; phone: string; label: string; total: number }>(null);
  const [communeList, setCommuneList] = useState<{ id: number; name_ar: string }[]>([]);

  useEffect(() => {
    if (!formData.wilaya) { setCommuneList([]); return; }
    import('./communes').then(({ getCommunesByWilayaId }) => {
      setCommuneList(getCommunesByWilayaId(parseInt(formData.wilaya, 10)) || []);
    }).catch(err => console.error('Failed to load communes:', err));
  }, [formData.wilaya]);

  useEffect(() => { if (done) doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [done]);

  const offer = getOffer(offerId);
  const delivery = formData.wilaya && DELIVERY_PRICES[formData.wilaya] ? DELIVERY_PRICES[formData.wilaya].home : null;
  const total = offer.price + (delivery || 0);

  const update = (patch: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
    const cleared = { ...errors };
    (Object.keys(patch) as Field[]).forEach(k => delete cleared[k]);
    setErrors(cleared);
    setSubmitError('');
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (formData.name.trim().length < 2) e.name = 'اكتب الاسم واللقب';
    const phone = normalizePhone(formData.phone);
    if (!phone) e.phone = 'اكتب رقم الهاتف';
    else if (!isValidAlgerianMobile(phone)) e.phone = 'الرقم لازم يبدا بـ 05 ولا 06 ولا 07 ومن بعد 8 أرقام';
    if (!formData.wilaya) e.wilaya = 'اختار الولاية';
    if (!formData.commune) e.commune = 'اختار البلدية';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      const first = (['name', 'phone', 'wilaya', 'commune'] as const).find(k => found[k]);
      document.getElementById(`g4-${first}`)?.focus();
      return;
    }
    isSubmittingRef.current = true;
    setLoading(true);
    setSubmitError('');
    const phone = normalizePhone(formData.phone);
    const eventId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const productName = `${PIGMA_PRODUCT.name} - ${offer.title} = ${offer.boxes} علب`;
    try {
      const response = await fetch('/api/submitOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          phone,
          deliveryType: 'home',
          quantity: offer.boxes,
          price: total,
          // valeur nette (sans livraison) utilisée pour les pixels / CAPI
          productTotal: offer.price,
          currency: 'DZD',
          country: 'Algeria',
          bundleId: offer.id,
          bundleTitle: offer.title,
          productId: PIGMA_PRODUCT.id,
          productName,
          eventId,
          source: SOURCE,
          utm: readUtm(),
        }),
      });
      if (response.ok) {
        onPurchase(offer.price, { ...PIGMA_PRODUCT, price: offer.price, currency: 'DZD' }, { ...formData, deliveryType: 'home', phone, eventId, quantity: offer.boxes });
        setDone({ name: formData.name.trim(), phone, label: `${boxesLabel(offer.boxes)} Stop Fuites (${offer.title})`, total });
      } else {
        const data = await response.json().catch(() => null);
        isSubmittingRef.current = false;
        setSubmitError(data?.error && typeof data.error === 'string' && /[؀-ۿ]/.test(data.error) ? data.error : 'صرا مشكل في إرسال الطلب، عاود جرّب من فضلك.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      isSubmittingRef.current = false;
      setSubmitError('ما قدرناش نتصلو، شوف الإنترنت وعاود جرّب.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div ref={doneRef} role="status" className="bg-white rounded-[28px] p-6 text-center shadow-xl ring-1 ring-sky-100">
        <span className="mx-auto mb-3 w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Check size={34} strokeWidth={3} />
        </span>
        <h3 className="text-[24px] font-black text-[#0B1B3F]">تم تسجيل طلبك، يعطيك الصحة {done.name}!</h3>
        <p className="mt-2 text-[15px] font-semibold text-slate-600 leading-relaxed">
          راح نعيطولك على <b dir="ltr" className="text-slate-900">{done.phone}</b> باش نأكدو الطلب. جاوب على المكالمة من فضلك باش نبعثوهولك في أقرب وقت.
        </p>
        <div className="mt-5 rounded-2xl bg-slate-50 divide-y divide-slate-200 text-[14px] text-right">
          <div className="flex justify-between gap-3 px-4 py-3"><span className="text-slate-500 font-semibold">الطلب</span><span className="font-bold text-slate-800">{done.label}</span></div>
          <div className="flex justify-between gap-3 px-4 py-3"><span className="text-slate-500 font-semibold">المجموع عند الاستلام</span><span className="font-black text-sky-800">{da(done.total)}</span></div>
        </div>
        <p className="mt-4 text-[13px] font-bold text-slate-500 flex items-center justify-center gap-1.5"><PhoneCall size={15} /> ما تخلص والو حتى تستلم</p>
      </div>
    );
  }

  const field = (err?: string) => `w-full h-14 bg-white border-2 rounded-2xl text-[17px] font-semibold text-slate-800 outline-none placeholder:text-slate-400 ${err ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#1366d6]'}`;
  const ErrorText = ({ msg }: { msg?: string }) => msg ? <p className="mt-1 text-[14px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle size={15} /> {msg}</p> : null;

  return (
    <form onSubmit={handleSubmit} onFocusCapture={onFirstInteraction} noValidate className="bg-white rounded-[28px] p-4 shadow-xl ring-1 ring-sky-100">
      <h2 className="text-center text-[22px] font-black text-[#0B1B3F] mb-4">اختار العرض واطلب دركا</h2>

      <div className="grid grid-cols-1 gap-3 mb-5" role="radiogroup" aria-label="اختار العرض">
        {OFFERS.map(id => {
          const o = getOffer(id);
          const active = id === offerId;
          return (
            <button key={id} type="button" role="radio" aria-checked={active} data-offer={id} onClick={() => onOfferChange(id)}
              className={`relative w-full rounded-2xl border-[3px] px-4 py-4 flex items-center gap-3 text-right transition-colors ${active ? 'border-[#16a34a] bg-emerald-50' : 'border-slate-200 bg-white'}`}>
              {id === 'pack3' && <span className="absolute -top-3 left-4 text-[12px] font-black bg-[#FFD60A] text-[#0B1B3F] rounded-full px-3 py-0.5 shadow">الأكثر طلبا</span>}
              <span className={`shrink-0 w-7 h-7 rounded-full border-[3px] flex items-center justify-center ${active ? 'border-[#16a34a] bg-[#16a34a]' : 'border-slate-300'}`}>
                {active && <Check size={16} strokeWidth={4} className="text-white" />}
              </span>
              <span className="flex-1 text-[18px] font-black text-[#0B1B3F] leading-snug">{id === 'pack1' ? 'علبة واحدة 1,4 كلغ' : '2 علب + 1 مجانية'}</span>
              <span className="shrink-0 text-[20px] font-black text-[#0B4FB3]">{da(o.price)}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="g4-name" className="block mb-1 text-[15px] font-bold text-slate-700">الاسم واللقب</label>
          <div className="relative">
            <input id="g4-name" type="text" autoComplete="name" placeholder="الاسم واللقب" aria-invalid={!!errors.name}
              className={`${field(errors.name)} pr-11 pl-3`} value={formData.name} onChange={e => update({ name: e.target.value })} />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
          <ErrorText msg={errors.name} />
        </div>
        <div>
          <label htmlFor="g4-phone" className="block mb-1 text-[15px] font-bold text-slate-700">رقم الهاتف</label>
          <div className="relative">
            <input id="g4-phone" type="tel" inputMode="tel" autoComplete="tel" dir={formData.phone ? 'ltr' : 'rtl'} placeholder="05 / 06 / 07" aria-invalid={!!errors.phone}
              className={`${field(errors.phone)} pr-11 pl-3 text-right`} value={formData.phone} onChange={e => update({ phone: e.target.value })} />
            <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          </div>
          <ErrorText msg={errors.phone} />
        </div>
        <div>
          <label htmlFor="g4-wilaya" className="block mb-1 text-[15px] font-bold text-slate-700">الولاية</label>
          <div className="relative">
            <select id="g4-wilaya" aria-invalid={!!errors.wilaya} value={formData.wilaya} onChange={e => update({ wilaya: e.target.value, commune: '' })}
              className={`${field(errors.wilaya)} pr-3 pl-9 appearance-none ${formData.wilaya ? '' : 'text-slate-400'}`}>
              <option value="" disabled>اختار الولاية</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={19} />
          </div>
          <ErrorText msg={errors.wilaya} />
        </div>
        <div>
          <label htmlFor="g4-commune" className="block mb-1 text-[15px] font-bold text-slate-700">البلدية</label>
          <div className="relative">
            <select id="g4-commune" aria-invalid={!!errors.commune} value={formData.commune} disabled={!formData.wilaya} onChange={e => update({ commune: e.target.value })}
              className={`${field(errors.commune)} pr-3 pl-9 appearance-none disabled:bg-slate-50 ${formData.commune ? '' : 'text-slate-400'}`}>
              <option value="" disabled>{formData.wilaya ? 'اختار البلدية' : 'اختار الولاية أولا'}</option>
              {communeList.map(c => <option key={c.id} value={c.name_ar}>{c.name_ar}</option>)}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={19} />
          </div>
          <ErrorText msg={errors.commune} />
        </div>

        {/* Total */}
        <div className="rounded-2xl bg-sky-50 px-4 py-3" aria-live="polite">
          <div className="flex justify-between text-[15px] font-semibold text-slate-600">
            <span>{boxesLabel(offer.boxes)}</span><span className="font-bold text-slate-800">{da(offer.price)}</span>
          </div>
          <div className="flex justify-between text-[15px] font-semibold text-slate-600 mt-1">
            <span>التوصيل للدار</span><span className="font-bold text-slate-800">{delivery !== null ? da(delivery) : 'اختار الولاية'}</span>
          </div>
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-sky-100">
            <span className="text-[16px] font-black text-[#0B1B3F]">المجموع</span>
            <span className="text-[30px] leading-none font-black text-[#0B4FB3]">{da(total)}</span>
          </div>
        </div>

        {submitError && (
          <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold p-3 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> {submitError}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full min-h-[62px] rounded-2xl bg-[#16a34a] text-white text-[19px] font-black shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-transform disabled:opacity-70 px-3">
          {loading ? 'راهو يتبعث…' : 'أكّد الطلب – الدفع عند الاستلام'}
        </button>
        <p className="text-center text-[14px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
          <Lock size={14} /> ما تخلص والو دركا · نعيطولك باش نأكدو
        </p>
      </div>
    </form>
  );
};

export default function LandingPage400g({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  usePricing();
  const [offerId, setOfferId] = useState<string>(DEFAULT_OFFER);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(true);
  const checkoutFiredRef = useRef(false);
  const viewFiredRef = useRef({ tt: false, fb: false });
  const rate = usdRate(config);
  const offer = getOffer(offerId);

  useEffect(() => { document.title = 'Stop Fuites شفاف – 1,4 كلغ بسعر 1 كلغ'; readUtm(); }, []);

  // ViewContent (TikTok + Meta) une seule fois dès que les pixels sont prêts — comme /lp/pigma-stop-fuites
  useEffect(() => {
    const value = Number((getOffer('pack1').price / rate).toFixed(2));
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

  // AddToCart à chaque choix d'offre
  const selectOffer = (id: string) => {
    setOfferId(id);
    const o = getOffer(id);
    const value = Number((o.price / rate).toFixed(2));
    const content = { content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name, quantity: o.boxes };
    if (window.ttq) window.ttq.track('AddToCart', { contents: [content], value, currency: 'USD' });
    if (window.fbq) window.fbq('track', 'AddToCart', { content_ids: [PIGMA_PRODUCT.id], content_type: 'product', content_name: o.title, value, currency: 'USD', num_items: o.boxes });
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

  // Bouton collant et bulle WhatsApp : masqués quand le formulaire est à l'écran
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

  const sections = [
    { name: 'quantite', title: 'قارن قبل ما تشري', alt: 'مقارنة: علبة Pigma Color تاع 1,4 كلغ قدام علبة عادية تاع 1 كلغ' },
    { name: 'surface', title: 'العلبة تغطي 5,6 م² بطبقتين', alt: 'العلبة تاع 1,4 كلغ تغطي 5,6 م² بطبقتين' },
    { name: 'prix', title: 'غالي؟ لا… اقتصادي 💯', alt: 'جدول المقارنة: الكمية، المساحة والماركة' },
    { name: 'confiance', title: '', alt: 'Stop Fuites أصلي من Pigma Color: جودة مضمونة، الدفع عند الاستلام، التوصيل لكل الولايات' },
  ];

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-[#0B1B3F] font-sans text-slate-800 pb-24">
      <div className="bg-[#FFD60A] text-[#0B1B3F] text-center text-[14px] font-black py-2 px-3">الدفع عند الاستلام · توصيل 69 ولاية</div>

      <main className="max-w-xl mx-auto">
        <Picture name="hero-400g" alt="Stop Fuites شفاف 1,4 كلغ من Pigma Color: 400 غرام مجانا" priority />
        <header className="px-4 pt-5 pb-6 text-center text-white">
          <h1 className="text-[30px] leading-[1.25] font-black">
            <span className="text-[#FFD60A]">1,4 كلغ</span> بسعر 1 كلغ – <span className="text-[#FFD60A]">400غ مجانا</span> 🎁
          </h1>
          <p className="mt-3 text-[17px] font-semibold text-sky-100">طلاء شفاف يسكّر على القطرة – Pigma Color أصلي</p>
        </header>

        <section id="order" className="px-3 pb-8 scroll-mt-2">
          <OrderForm offerId={offerId} onOfferChange={selectOffer} onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction} />
        </section>

        <div className="bg-white">
          {sections.map(s => (
            <section key={s.name} className="pt-6">
              {s.title && <h2 className="px-4 pb-3 text-center text-[24px] font-black text-[#0B1B3F]">{s.title}</h2>}
              <Picture name={s.name} alt={s.alt} />
            </section>
          ))}

          <div className="px-4 py-8">
            <button type="button" onClick={toForm}
              className="w-full min-h-[60px] rounded-2xl bg-[#16a34a] text-white text-[20px] font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              <ShoppingCart size={22} /> اطلب الآن
            </button>
          </div>

          <section className="px-4 pb-10">
            <h2 className="text-center text-[22px] font-black text-[#0B1B3F] mb-4">أسئلة متكررة</h2>
            <div className="space-y-2">
              {FAQ().map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="rounded-2xl border border-slate-200 overflow-hidden">
                    <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-4 text-right text-[17px] font-black text-[#0B1B3F]">
                      {f.q}
                      <ChevronDown size={20} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && <p className="px-4 pb-4 text-[16px] font-medium text-slate-600 leading-relaxed">{f.a}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="px-4 pb-6 text-center text-[12px] text-slate-400">
            Pigma Color و Stop Fuites علامات تجارية لأصحابها. YANIS SHOP بائع للمنتج.
          </footer>
        </div>
      </main>

      {/* Barre fixe : bouton de commande + WhatsApp à côté (la bulle ne recouvre jamais un bouton),
          visible tant que le formulaire n'est pas à l'écran */}
      <div className={`fixed bottom-0 inset-x-0 z-40 transition-transform duration-300 ${formVisible ? 'translate-y-full' : 'translate-y-0'}`} aria-hidden={formVisible}>
        <div className="max-w-xl mx-auto bg-[#0B1B3F]/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex items-center gap-2">
          <button type="button" tabIndex={formVisible ? -1 : 0} onClick={toForm}
            className="flex-1 h-[56px] rounded-2xl bg-[#16a34a] text-white text-[18px] font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <ShoppingCart size={20} /> اطلب الآن – {da(offer.price)}
          </button>
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('السلام عليكم، عندي سؤال على Stop Fuites (عرض 400 غرام مجانا)')}`} target="_blank" rel="noopener noreferrer"
            tabIndex={formVisible ? -1 : 0} aria-label="تواصل معنا على واتساب"
            className="shrink-0 w-[56px] h-[56px] rounded-2xl bg-[#25D366] text-white flex items-center justify-center">
            <MessageCircle size={26} fill="currentColor" />
          </a>
        </div>
      </div>
    </div>
  );
}
