// /lp/pigma-diagnostic : questionnaire en 5 étapes (problème → surface → méthode → application → offre + formulaire).
// Source des commandes : « lp-diagnostic » ; le résumé des réponses part avec la commande (Telegram, Sheet, Firestore).
// Pixels : uniquement TikTok PIGMA1, comme /lp/pigma-main (voir index.html, App.tsx et api/submitOrder.ts).
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Banknote, Truck, Check, Droplets, PaintRoller, Sparkles, CloudRain, Sun, Eye, Info, MessageCircle, Ruler, Layers, Target, ShowerHead, Home, Building, HelpCircle, Gift, PhoneCall } from 'lucide-react';
import CheckoutFormPigma, { PIGMA_PRODUCT, pigmaUnitPrice, PIGMA_BOX_KG, getOffer, da, boxesLabel } from './CheckoutFormPigma';
import { usePricing } from './pricing';

const SOURCE = 'lp-diagnostic';
const WHATSAPP = '213557920685';
const M2_PER_BOX = PIGMA_BOX_KG * 4; // 5,6 m² par boîte en deux couches
const MAX_M2 = 70;                    // au-delà : prix spécial sur WhatsApp
const MAX_BOXES = 12;                 // offre max : 8 + 4 gratuites
const offerForBoxes = (n: number) => (n <= 1 ? 'pack1' : n <= 3 ? 'pack3' : n <= 6 ? 'pack6' : n === 7 ? 'combo7' : n <= 9 ? 'combo9' : 'combo12');
const usdRate = (config: any) => (Number(config?.usdRate) > 0 ? Number(config.usdRate) : 250);
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'ttclid', 'fbclid', 'gclid'];

const readUtm = (): Record<string, string> => {
  const out: Record<string, string> = {};
  try { Object.assign(out, JSON.parse(sessionStorage.getItem('lpdiag_utm') || '{}')); } catch { /* ignore */ }
  const p = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach(k => { const v = p.get(k); if (v) out[k] = v.slice(0, 200); });
  try { sessionStorage.setItem('lpdiag_utm', JSON.stringify(out)); } catch { /* ignore */ }
  return out;
};

const whenReady = (check: () => boolean, fn: () => void, timeoutMs = 10000) => {
  if (check()) { fn(); return () => {}; }
  const start = Date.now();
  const id = setInterval(() => { if (check()) { clearInterval(id); fn(); } else if (Date.now() - start > timeoutMs) clearInterval(id); }, 150);
  return () => clearInterval(id);
};

type ProblemId = 'terrasse' | 'plafond' | 'mur' | 'sdb' | 'balcon' | 'autre';
type Problem = { id: ProblemId; title: string; sub: string; img?: string; Icon?: React.ElementType; where: string; surfaceQ: string; tips: React.ReactNode[] };

// Chaque problème : où appliquer le produit et conseils propres à ce cas
const PROBLEMS: Problem[] = [
  { id: 'terrasse', title: 'تسربات في السطح ولا التيراس', sub: 'الماء يدخل من السطح كي تطيح الشتا', img: '/images/pigma/terrace-tiles-rain-sm.webp',
    where: 'السطح', surfaceQ: 'شحال مساحة السطح ولا التيراس؟',
    tips: [<>ركّز على <b>الشقوق، الزوايا وحواف الحيوط</b> وين يتلاقى السطح مع الحيط: من تما يدخل الماء أكثر.</>, <>نحّي الماء الراكد والغبرة من الكارلاج قبل ما تبدا.</>] },
  { id: 'plafond', title: 'القطرة تطيح من السقف داخل الدار', sub: 'بقع، صفورية ولا قطرة في السقف', img: '/images/pigma/damp-ceiling-sm.webp',
    where: 'السطح اللي فوق البيت', surfaceQ: 'شحال مساحة السطح اللي فوق البيت المتضررة؟',
    tips: [<><b>ما تدهنش السقف من الداخل</b>: الماء جاي من الفوق. الدهان يتحط على <b>السطح من برا</b> فوق البيت المتضررة.</>, <>البلاصة اللي تقطر من الداخل ماشي ديما هي البلاصة اللي يدخل منها الماء من الفوق، لهذا ننصحو بدهان السطح كامل.</>] },
  { id: 'mur', title: 'رطوبة ولا تقشير في الحيط', sub: 'الحيط يشرب الماء والدهان يتقشر', img: '/images/pigma/peeling-paint-sm.webp',
    where: 'الحيط من برا', surfaceQ: 'شحال مساحة الحيط اللي فيه المشكل؟',
    tips: [<>ادهن <b>الوجه البراني تاع الحيط</b> اللي تضربو الشتا، باش تسكّر الطريق على الماء.</>, <>نحّي الدهان اللي راهو يتقشر وخلّي الحيط ينشف مليح قبل ما تبدا.</>] },
  { id: 'sdb', title: 'الحمام، الكوزينة ولا الفايونس', sub: 'الماء يدخل بين الفايونس والجوانات', Icon: ShowerHead,
    where: 'الفايونس والجوانات', surfaceQ: 'شحال مساحة الأرضية ولا الحيط اللي تحب تدهنو؟',
    tips: [<>ركّز على <b>الجوانات</b> وحواف البانيو والدوش.</>, <>المنتوج شفاف: يبقى شكل الفايونس كيما هو.</>, <>ما تستعملش الحمام 24 ساعة من بعد الطبقة الثانية.</>] },
  { id: 'balcon', title: 'البالكون ولا العتبات', sub: 'الماء يدخل من البالكون للبيت اللي تحتو', Icon: Building,
    where: 'البالكون', surfaceQ: 'شحال مساحة البالكون؟',
    tips: [<>ركّز على <b>الزاوية بين الأرضية والحيط</b> وتحت العتبة تاع الباب.</>] },
  { id: 'autre', title: 'حاجة أخرى', sub: 'سطح قرميد، حيط سور، ...', Icon: HelpCircle,
    where: 'البلاصة', surfaceQ: 'شحال المساحة اللي تحب تدهنها؟',
    tips: [<>إذا ما راكش متأكد، ابعثلنا تصويرة على واتساب ونقولولك.</>] },
];

const STEP_LABELS = ['المشكل', 'المساحة', 'الطريقة', 'التطبيق', 'العرض'];

const Choice: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; className?: string }> = ({ active, onClick, children, className = '' }) => (
  <button type="button" role="radio" aria-checked={active} onClick={onClick}
    className={`w-full rounded-2xl border-2 text-right transition-all active:scale-[0.99] ${active ? 'border-[#1366d6] bg-sky-50 shadow-sm' : 'border-slate-200 bg-white'} ${className}`}>
    {children}
  </button>
);

const NextBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className="mt-5 w-full h-[56px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[18px] font-black shadow-lg shadow-yellow-500/25 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:shadow-none">
    {children}
  </button>
);

export default function LandingPageDiagnostic({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  usePricing();
  const [step, setStep] = useState(0);
  const [problem, setProblem] = useState<ProblemId | ''>('');
  const [area, setArea] = useState(0);
  const [method, setMethod] = useState<'full' | 'partial' | ''>('');
  const [zone, setZone] = useState(5);
  const [offerId, setOfferId] = useState('pack3');
  const topRef = useRef<HTMLDivElement>(null);
  const viewFiredRef = useRef(false);
  const cartFiredRef = useRef(false);
  const checkoutFiredRef = useRef(false);
  const rate = usdRate(config);

  const P = PROBLEMS.find(p => p.id === problem);
  // zone partielle : on ajoute 50 cm de chaque côté autour de la zone, sans dépasser la surface totale
  const zoneWithMargin = Math.min(area, Math.round(Math.pow(Math.sqrt(zone) + 1, 2)));
  const paintArea = method === 'partial' ? zoneWithMargin : area;
  const tooBig = paintArea > MAX_M2;
  const boxes = paintArea > 0 ? Math.min(Math.ceil(paintArea / M2_PER_BOX - 1e-9), MAX_BOXES) : 0;
  const suggested = getOffer(offerForBoxes(Math.max(boxes, 1)));
  const diagnostic = P ? `${P.title} · ${area} م² · ${method === 'partial' ? `غير البلاصة (${zone} م²)` : 'كامل المساحة'} · ${boxes} علب` : '';

  useEffect(() => { document.title = 'شنو المشكل تاعك؟ – Stop Fuites شفاف من Pigma Color'; readUtm(); }, []);

  useEffect(() => {
    const value = Number((pigmaUnitPrice() / rate).toFixed(2));
    return whenReady(() => !!window.ttq, () => {
      if (viewFiredRef.current) return; viewFiredRef.current = true;
      window.ttq.track('ViewContent', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name }], value, currency: 'USD' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' }));
  };

  const trackCart = (id: string) => {
    const o = getOffer(id);
    if (window.ttq) window.ttq.track('AddToCart', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name, quantity: o.boxes }], value: Number((o.price / rate).toFixed(2)), currency: 'USD' });
  };
  const selectOffer = (id: string) => { setOfferId(id); trackCart(id); };

  const showOffer = () => {
    const id = suggested.id;
    setOfferId(id);
    if (!cartFiredRef.current) { cartFiredRef.current = true; trackCart(id); }
    go(4);
  };

  const handleFirstInteraction = () => {
    if (checkoutFiredRef.current) return;
    checkoutFiredRef.current = true;
    const o = getOffer(offerId);
    if (window.ttq) window.ttq.track('InitiateCheckout', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name }], value: Number((o.price / rate).toFixed(2)), currency: 'USD' });
  };

  const waLink = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const setAreaSafe = (v: number) => setArea(Math.min(1000, Math.max(0, Math.round(v) || 0)));

  return (
    <div className="min-h-screen bg-[#F3F7FB] font-sans text-slate-800 overflow-x-hidden" dir="rtl" lang="ar">
      <div className="bg-[#FFD60A] text-[#0B1B3F] text-[12px] font-black py-2 px-2 flex items-center justify-center gap-2 whitespace-nowrap">
        <span className="flex items-center gap-1"><Banknote size={15} /> الدفع عند الاستلام</span>
        <span className="w-px h-3.5 bg-[#0B1B3F]/30" />
        <span className="flex items-center gap-1"><Truck size={15} /> توصيل 69 ولاية</span>
        <span className="w-px h-3.5 bg-[#0B1B3F]/30" />
        {/* WhatsApp dans la barre du haut : ne recouvre jamais un bouton ou une carte */}
        <a href={waLink('السلام عليكم، عندي سؤال على Stop Fuites الشفاف')} target="_blank" rel="noopener noreferrer" aria-label="تواصل معنا على واتساب"
          className="flex items-center gap-1 rounded-full bg-[#25D366] text-white px-2 py-0.5"><MessageCircle size={14} fill="currentColor" /> واتساب</a>
      </div>

      <header ref={topRef} className="bg-[#0B1B3F] text-white scroll-mt-0">
        <div className="max-w-xl mx-auto px-4 pt-4 pb-5">
          {step === 0 ? (
            <div className="text-center">
              <h1 className="text-[25px] leading-[1.3] font-black">عندك مشكل تاع <span className="text-[#FFD60A]">ماء ولا رطوبة</span>؟</h1>
              <p className="mt-1.5 text-[14.5px] font-semibold text-sky-100/85">جاوب على 3 أسئلة، ونقولولك كيفاش تحلو وشحال يلزمك بالضبط</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => go(step - 1)} aria-label="رجوع" className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><ArrowRight size={20} /></button>
              <p className="flex-1 font-black text-[15px]">Stop Fuites شفاف – Pigma Color</p>
            </div>
          )}
          {/* progression */}
          <div className="mt-4 flex items-center gap-1.5" aria-label={`المرحلة ${step + 1} من ${STEP_LABELS.length}`}>
            {STEP_LABELS.map((l, i) => (
              <div key={l} className="flex-1">
                <div className={`h-1.5 rounded-full ${i <= step ? 'bg-[#FFD60A]' : 'bg-white/15'}`} />
                <p className={`mt-1 text-center text-[11px] font-bold ${i === step ? 'text-[#FFD60A]' : 'text-sky-100/55'}`}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-3 pt-5 pb-16">
        {/* 1. Problème */}
        {step === 0 && (
          <section>
            <h2 className="text-[21px] font-black text-[#0B1B3F]">واش هو المشكل تاعك؟</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="المشكل">
              {PROBLEMS.map((p, i) => (
                <Choice key={p.id} active={problem === p.id} onClick={() => { setProblem(p.id); setTimeout(() => go(1), 180); }} className="overflow-hidden">
                  {p.img ? (
                    <img src={p.img} alt="" width={480} height={480} loading={i < 4 ? 'eager' : 'lazy'} decoding="async" className="w-full aspect-[16/10] object-cover bg-slate-100" />
                  ) : (
                    <span className="w-full aspect-[16/10] bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">{p.Icon && <p.Icon size={40} className="text-[#1366d6]" />}</span>
                  )}
                  <span className="block p-2.5">
                    <span className="block text-[14.5px] font-black text-[#0B1B3F] leading-snug">{p.title}</span>
                    <span className="block mt-0.5 text-[12px] font-semibold text-slate-500 leading-snug">{p.sub}</span>
                  </span>
                </Choice>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[12px] font-bold text-slate-500">
              <span className="flex flex-col items-center gap-1"><Banknote size={20} className="text-[#1366d6]" /> الدفع عند الاستلام</span>
              <span className="flex flex-col items-center gap-1"><Truck size={20} className="text-[#1366d6]" /> 24 حتى 48 ساعة</span>
              <span className="flex flex-col items-center gap-1"><Check size={20} className="text-[#1366d6]" /> منتوج أصلي</span>
            </div>
          </section>
        )}

        {/* 2. Surface */}
        {step === 1 && P && (
          <section>
            <h2 className="text-[21px] font-black text-[#0B1B3F]">{P.surfaceQ}</h2>
            <p className="mt-1 text-[13.5px] font-semibold text-slate-500">المساحة الكاملة، حتى إذا المشكل غير في بلاصة وحدة.</p>
            <div className="mt-4 rounded-[24px] bg-white ring-1 ring-slate-200 p-4">
              <div className="flex items-center justify-center gap-3">
                <input id="dg-area" type="number" inputMode="decimal" min={1} max={1000} placeholder="0" value={area || ''} onChange={e => setAreaSafe(Number(e.target.value))}
                  aria-label="المساحة بالمتر المربع" className="w-32 h-16 rounded-2xl border-2 border-slate-200 focus:border-[#1366d6] text-[32px] font-black text-center text-[#0B1B3F] outline-none" />
                <span className="text-[24px] font-black text-[#0B1B3F]">م²</span>
              </div>
              <input type="range" min={1} max={MAX_M2} step={1} value={Math.min(Math.max(area, 1), MAX_M2)} onChange={e => setAreaSafe(Number(e.target.value))}
                aria-label="المساحة" className="mt-4 w-full accent-[#1366d6] h-2" />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[10, 20, 40, 60].map(v => (
                  <button key={v} type="button" onClick={() => setArea(v)} className={`px-3.5 h-9 rounded-full text-[13.5px] font-black ${area === v ? 'bg-[#1366d6] text-white' : 'bg-slate-100 text-slate-700'}`}>{v} م²</button>
                ))}
              </div>
            </div>
            <LengthWidth onArea={setArea} />
            <NextBtn onClick={() => go(2)} disabled={!area}>التالي</NextBtn>
          </section>
        )}

        {/* 3. Méthode */}
        {step === 2 && P && (
          <section>
            <h2 className="text-[21px] font-black text-[#0B1B3F]">كيفاش تحب تدهن؟</h2>
            <div className="mt-3 space-y-2.5" role="radiogroup" aria-label="طريقة التطبيق">
              <Choice active={method === 'full'} onClick={() => setMethod('full')} className="p-4">
                <span className="flex items-start gap-3">
                  <Layers size={26} className="shrink-0 mt-0.5 text-[#1366d6]" />
                  <span>
                    <span className="flex items-center gap-2 text-[16px] font-black text-[#0B1B3F]">كامل {P.where} ({area} م²) <span className="text-[11px] bg-emerald-500 text-white rounded-full px-2 py-0.5">ننصحو بيه</span></span>
                    <span className="block mt-1 text-[13px] font-semibold text-slate-500 leading-relaxed">الماء كي تسكّرلو بلاصة يقلّب على طريق أخرى. كي تدهن كلش تسكّر عليه نهائيا.</span>
                  </span>
                </span>
              </Choice>
              <Choice active={method === 'partial'} onClick={() => setMethod('partial')} className="p-4">
                <span className="flex items-start gap-3">
                  <Target size={26} className="shrink-0 mt-0.5 text-[#1366d6]" />
                  <span>
                    <span className="block text-[16px] font-black text-[#0B1B3F]">غير البلاصة اللي فيها المشكل</span>
                    <span className="block mt-1 text-[13px] font-semibold text-slate-500 leading-relaxed">إذا تعرف بالضبط منين يدخل الماء (شق، زاوية...).</span>
                  </span>
                </span>
              </Choice>
            </div>
            {method === 'partial' && (
              <div className="mt-3 rounded-[24px] bg-white ring-1 ring-slate-200 p-4">
                <p className="font-black text-[15px] text-[#0B1B3F]">شحال مساحة البلاصة تقريبا؟</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[2, 5, 10, 20].filter(v => v < area || v === 2).map(v => (
                    <button key={v} type="button" onClick={() => setZone(v)} className={`h-11 rounded-xl text-[14px] font-black ${zone === v ? 'bg-[#1366d6] text-white' : 'bg-slate-100 text-slate-700'}`}>{v} م²</button>
                  ))}
                </div>
                <input type="range" min={1} max={Math.max(area, 1)} value={Math.min(zone, area)} onChange={e => setZone(Number(e.target.value))} aria-label="مساحة البلاصة" className="mt-4 w-full accent-[#1366d6] h-2" />
                <p className="mt-2 text-[13px] font-semibold text-slate-500 flex items-start gap-1.5"><Info size={15} className="shrink-0 mt-0.5 text-[#1366d6]" />
                  <span>البلاصة: {Math.min(zone, area)} م². زيدنا <b>50 سم من كل جهة</b> باش ما يدخلش الماء من الحواف، يعني تدهن حوالي <b>{zoneWithMargin} م²</b>.</span></p>
              </div>
            )}
            <NextBtn onClick={() => go(3)} disabled={!method}>التالي</NextBtn>
          </section>
        )}

        {/* 4. Application */}
        {step === 3 && P && (
          <section>
            <h2 className="text-[21px] font-black text-[#0B1B3F]">كيفاش تطبّقو على {P.where}</h2>
            <p className="mt-1 text-[13.5px] font-semibold text-slate-500">ساهلة، تقدر تديرها وحدك بالرولو ولا البينسو.</p>
            <img src="/images/pigma/roller-apply-sm.webp" alt="دهان Stop Fuites بالرولو على السطح" width={480} height={480} decoding="async" className="mt-3 w-full aspect-[16/9] object-cover rounded-2xl bg-slate-100" />
            <ol className="mt-4 space-y-3">
              {[
                { Icon: Sparkles, t: 'نقّي ونشّف', d: <>نحّي الغبرة والدسم. لازم تكون البلاصة <b>ناشفة 100%</b>.</> },
                { Icon: Droplets, t: 'طبقة تحضير مخففة', d: <>زيد <b>10 حتى 20% ماء</b>، وخلّيها تنشف <b>6 ساعات</b>.</> },
                { Icon: PaintRoller, t: 'الطبقة الأولى', d: <>صافية بلا ماء، بالرولو ولا البينسو.</> },
                { Icon: PaintRoller, t: 'الطبقة الثانية', d: <>من بعد <b>6 ساعات</b>، بعكس اتجاه الأولى. ومن بعد خلّيها <b>24 ساعة</b> باش تنشف.</> },
              ].map((s, i) => (
                <li key={s.t} className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-slate-200 p-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-[#0B1B3F] text-[#FFD60A] font-black flex items-center justify-center text-[18px]">{i + 1}</span>
                  <div className="min-w-0"><p className="font-black text-[15.5px] text-[#0B1B3F]">{s.t}</p><p className="text-[14px] font-semibold text-slate-600 leading-relaxed">{s.d}</p></div>
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-2xl bg-sky-50 ring-1 ring-sky-100 p-4">
              <p className="font-black text-[15px] text-[#0B1B3F] flex items-center gap-1.5"><Info size={17} className="text-[#1366d6]" /> نصائح خاصة بالمشكل تاعك</p>
              <ul className="mt-2 space-y-2 text-[14px] font-semibold text-slate-700 leading-relaxed list-disc pr-5">
                {P.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
            <ul className="mt-3 rounded-2xl bg-[#0B1B3F] text-white p-4 space-y-2 text-[13.5px] font-semibold text-sky-100/90">
              <li className="flex gap-2"><CloudRain size={17} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">بلا شتا</b> 24 حتى 48 ساعة من بعد الدهان.</span></li>
              <li className="flex gap-2"><Sun size={17} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">بين 5° و 35°</b>، خير وقت الصباح بكري.</span></li>
              <li className="flex gap-2"><Eye size={17} className="shrink-0 mt-0.5 text-[#7DD9FF]" /><span><b className="text-white">أبيض كي تدهنو؟ عادي</b>، يولي شفاف كي ينشف.</span></li>
            </ul>
            <NextBtn onClick={showOffer}>شوف شحال يلزمك</NextBtn>
          </section>
        )}

        {/* 5. Offre + formulaire */}
        {step === 4 && P && (
          <section>
            <div className="rounded-[24px] bg-white ring-1 ring-slate-200 p-4">
              <p className="text-[13px] font-bold text-slate-500">التشخيص تاعك</p>
              <ul className="mt-2 space-y-1.5 text-[14px] font-semibold text-slate-700">
                <li className="flex items-center gap-2"><Home size={16} className="text-[#1366d6]" /> {P.title}</li>
                <li className="flex items-center gap-2"><Ruler size={16} className="text-[#1366d6]" /> المساحة: {area} م²</li>
                <li className="flex items-center gap-2"><Layers size={16} className="text-[#1366d6]" /> {method === 'partial' ? `غير البلاصة: حوالي ${zoneWithMargin} م² (مع الحواف)` : `كامل المساحة: ${area} م²`}</li>
              </ul>
              <button type="button" onClick={() => go(1)} className="mt-2 text-[13px] font-bold text-[#1366d6] underline">بدّل الأجوبة</button>
            </div>

            {tooBig ? (
              <div className="mt-4 rounded-[24px] bg-[#FFD60A] text-[#0B1B3F] p-5">
                <p className="text-[18px] font-black">المساحة أكثر من {MAX_M2} م²</p>
                <p className="mt-1 text-[14.5px] font-bold">للكميات الكبيرة نعطيوك سعر خاص بيك. ابعثلنا على واتساب، ولا اطلب أكبر عرض تحت (8 + 4 مجانيات).</p>
                <a href={waLink(`السلام عليكم، حاب سعر خاص لـ Stop Fuites الشفاف. ${diagnostic}`)} target="_blank" rel="noopener noreferrer"
                  className="mt-3 h-12 rounded-xl bg-[#0B1B3F] text-white font-black flex items-center justify-center gap-2"><MessageCircle size={19} /> اطلب سعرك على واتساب</a>
              </div>
            ) : (
              <div className="mt-4 rounded-[24px] bg-[#0B1B3F] text-white p-5 text-center">
                <p className="text-[14px] font-bold text-sky-100/80">باش تدهن {paintArea} م² بطبقتين يلزمك</p>
                <p className="mt-1 text-[44px] leading-none font-black text-[#FFD60A]">{boxes} <span className="text-[22px]">{boxes === 1 ? 'علبة' : 'علب'}</span></p>
                <p className="mt-1 text-[12.5px] font-semibold text-sky-100/65">العلبة 1,4 كلغ تغطي حوالي 5,6 م²</p>
                <div className="mt-4 rounded-2xl bg-white text-[#0B1B3F] p-4 text-right">
                  <p className="flex items-center gap-1.5 text-[12.5px] font-black text-[#1366d6]"><Gift size={15} /> العرض المقترح ليك</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[17px] font-black leading-snug">{suggested.title}</p>
                      <p className="text-[13px] font-bold text-slate-500">{boxesLabel(suggested.boxes)} · {suggested.freeDelivery ? <span className="text-emerald-600">توصيل مجاني</span> : '+ التوصيل حسب الولاية'}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-[22px] font-black">{da(suggested.price)}</p>
                      {suggested.boxes * pigmaUnitPrice() > suggested.price && <p className="text-[12px] font-bold text-slate-400 line-through">{da(suggested.boxes * pigmaUnitPrice())}</p>}
                    </div>
                  </div>
                  {suggested.boxes > boxes && <p className="mt-2 text-[12.5px] font-bold text-emerald-700">فيه {suggested.boxes - boxes} {suggested.boxes - boxes === 1 ? 'علبة زايدة' : 'علب زايدين'} مجانا، تقدر تعاود بيهم الحواف ولا تخليهم للعام الجاي.</p>}
                </div>
              </div>
            )}

            <div id="order" className="mt-5 scroll-mt-2">
              <p className="mb-2 text-center text-[15px] font-black text-[#0B1B3F]">دخّل المعلومات تاعك باش تستلم الطلبية</p>
              <CheckoutFormPigma offerId={offerId} onOfferChange={selectOffer} sourceTag="LP pigma-diagnostic" onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction}
                source={SOURCE} extraPayload={() => ({ utm: readUtm(), diagnostic })} highlightOffer={{ id: suggested.id, badge: 'المقترح ليك' }} />
              <p className="mt-3 text-center text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5"><PhoneCall size={14} /> نعيطولك باش نأكدو، والدفع عند الاستلام</p>
            </div>
          </section>
        )}
      </main>

    </div>
  );
}

// Aide : longueur × largeur → surface
function LengthWidth({ onArea }: { onArea: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const [l, setL] = useState('');
  const [w, setW] = useState('');
  const num = (v: string) => Number(v.replace(',', '.')) || 0;
  useEffect(() => { const a = num(l) * num(w); if (a > 0) onArea(Math.ceil(a)); }, [l, w]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="mt-3 w-full text-center text-[14px] font-bold text-[#1366d6] underline">ما تعرفش المساحة؟ نحسبوها بالطول والعرض</button>;
  return (
    <div className="mt-3 rounded-2xl bg-sky-50 ring-1 ring-sky-100 p-3 flex items-center justify-center gap-2 text-[15px] font-black text-[#0B1B3F]">
      <input inputMode="decimal" aria-label="الطول بالمتر" placeholder="الطول" value={l} onChange={e => setL(e.target.value)} className="w-20 h-11 rounded-xl border-2 border-slate-200 text-center outline-none focus:border-[#1366d6]" />
      <span>م ×</span>
      <input inputMode="decimal" aria-label="العرض بالمتر" placeholder="العرض" value={w} onChange={e => setW(e.target.value)} className="w-20 h-11 rounded-xl border-2 border-slate-200 text-center outline-none focus:border-[#1366d6]" />
      <span>م</span>
    </div>
  );
}
