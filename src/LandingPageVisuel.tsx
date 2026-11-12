// /lp/pigma-visuel : landing page faite de 5 visuels (générés par IA) avec des zones cliquables posées sur les boutons et les cartes d'offres.
// Source des commandes : « lp-visuel ». Pixels : uniquement TikTok PIGMA1 (comme /lp/pigma-main et /lp/pigma-diagnostic).
import React, { useState, useEffect, useRef } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import CheckoutFormPigma, { PIGMA_PRODUCT, pigmaUnitPrice, getOffer } from './CheckoutFormPigma';
import { usePricing } from './pricing';

const SOURCE = 'lp-visuel';
const A = '/lp-assets/pigma-visuel/';
const W = 1131, H = 2000; // repère des coordonnées des zones (taille des visuels d'origine)
const usdRate = (config: any) => (Number(config?.usdRate) > 0 ? Number(config.usdRate) : 250);
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'ttclid', 'fbclid', 'gclid'];

const readUtm = (): Record<string, string> => {
  const out: Record<string, string> = {};
  try { Object.assign(out, JSON.parse(sessionStorage.getItem('lpvisuel_utm') || '{}')); } catch { /* ignore */ }
  const p = new URLSearchParams(window.location.search);
  UTM_KEYS.forEach(k => { const v = p.get(k); if (v) out[k] = v.slice(0, 200); });
  try { sessionStorage.setItem('lpvisuel_utm', JSON.stringify(out)); } catch { /* ignore */ }
  return out;
};

const whenReady = (check: () => boolean, fn: () => void, timeoutMs = 10000) => {
  if (check()) { fn(); return () => {}; }
  const start = Date.now();
  const id = setInterval(() => { if (check()) { clearInterval(id); fn(); } else if (Date.now() - start > timeoutMs) clearInterval(id); }, 150);
  return () => clearInterval(id);
};

// zone cliquable [x1, y1, x2, y2] en pixels du visuel d'origine → position en %
type Box = [number, number, number, number];
const pos = ([x1, y1, x2, y2]: Box): React.CSSProperties => ({
  left: `${(x1 / W) * 100}%`, top: `${(y1 / H) * 100}%`, width: `${((x2 - x1) / W) * 100}%`, height: `${((y2 - y1) / H) * 100}%`,
});

const Visual: React.FC<{ name: string; alt: string; priority?: boolean; children?: React.ReactNode; id?: string }> = ({ name, alt, priority, children, id }) => (
  <section id={id} className="relative">
    <img src={`${A}${name}.webp`} srcSet={`${A}${name}-640.webp 640w, ${A}${name}.webp 1080w`} sizes="(max-width: 576px) 100vw, 576px"
      width={1080} height={1910} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"
      className="block w-full h-auto select-none" draggable={false} />
    {children}
  </section>
);

// Cartes d'offres sur le visuel 5 (dans l'ordre : 1 boîte, 2+1, 4+2)
const OFFER_ZONES: { id: string; box: Box; label: string }[] = [
  { id: 'pack1', box: [72, 300, 1060, 684], label: 'علبة وحدة' },
  { id: 'pack3', box: [72, 735, 1060, 1135], label: '2 علب + 1 مجانية' },
  { id: 'pack6', box: [72, 1188, 1060, 1560], label: '4 علب + 2 مجانيات، توصيل مجاني' },
];

export default function LandingPageVisuel({ config, onPurchase }: { config: any; onPurchase: (p: number, product: any, formData?: any) => void }) {
  usePricing();
  const [offerId, setOfferId] = useState('pack3');
  const viewFiredRef = useRef(false);
  const checkoutFiredRef = useRef(false);
  const rate = usdRate(config);

  useEffect(() => { document.title = 'وداعاً للتسربات والرطوبة – Stop Fuites شفاف من Pigma Color'; readUtm(); }, []);

  useEffect(() => {
    const value = Number((pigmaUnitPrice() / rate).toFixed(2));
    return whenReady(() => !!window.ttq, () => {
      if (viewFiredRef.current) return; viewFiredRef.current = true;
      window.ttq.track('ViewContent', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name }], value, currency: 'USD' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollTo = (id: string) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const selectOffer = (id: string) => {
    setOfferId(id);
    const o = getOffer(id);
    if (window.ttq) window.ttq.track('AddToCart', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name, quantity: o.boxes }], value: Number((o.price / rate).toFixed(2)), currency: 'USD' });
  };

  const handleFirstInteraction = () => {
    if (checkoutFiredRef.current) return;
    checkoutFiredRef.current = true;
    const o = getOffer(offerId);
    if (window.ttq) window.ttq.track('InitiateCheckout', { contents: [{ content_id: PIGMA_PRODUCT.id, content_type: 'product', content_name: PIGMA_PRODUCT.name }], value: Number((o.price / rate).toFixed(2)), currency: 'USD' });
  };

  const zoneBtn = 'absolute rounded-[3%] cursor-pointer active:bg-white/15 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#FFD60A]';

  return (
    <div className="min-h-screen bg-[#0B1B3F] font-sans" dir="rtl" lang="ar">
      <div className="max-w-xl mx-auto bg-[#0B1B3F]">
        {/* 1. Accroche → bouton « اطلب الآن » */}
        <Visual name="1-accroche" alt="وداعاً للتسربات والرطوبة: Stop Fuites عازل مائي شفاف من Pigma Color. الدفع عند الاستلام، توصيل 24-48 ساعة، منتوج أصلي" priority>
          <button type="button" aria-label="اطلب الآن" onClick={() => scrollTo('offres')} className={`${zoneBtn} rounded-full`} style={pos([52, 1808, 1080, 1952])} />
        </Visual>

        {/* 2. Problème → « الحل ساهل » descend aux avantages */}
        <Visual name="2-probleme" alt="كل شتا نفس المشكل؟ تقطار الماء، الرطوبة في السقف، شقوق في السطح، الدهان يتقشر">
          <button type="button" aria-label="الحل ساهل وما يكلفكش بزاف" onClick={() => scrollTo('avantages')} className={`${zoneBtn} rounded-full`} style={pos([66, 1722, 1066, 1990])} />
        </Visual>

        {/* 3. Avantages */}
        <Visual id="avantages" name="3-avantages" alt="علاش Stop Fuites؟ شفاف 100% ما يبدلش لون الكارلاج، مطاطي ما يتشققش، يقاوم الشتا والشمس، للسطح والتيراس والحمام والحيوط" />

        {/* 4. Application */}
        <Visual name="4-application" alt="كيفاش تستعملو؟ 1: نقّي ونشّف السطح مليح. 2: طبقة تحضير مخففة بالماء. 3: زوج طبقات، 6 ساعات بيناتهم. 1,4 كلغ = حوالي 5,6 م² بطبقتين" />

        {/* 5. Offres : chaque carte choisit l'offre, « اطلب الآن » descend au formulaire */}
        <Visual id="offres" name="5-offres" alt="اختار العرض تاعك: علبة وحدة 1900 دج، 2 + 1 مجانية 3800 دج، 4 + 2 مجانية 7600 دج مع توصيل مجاني">
          <div role="radiogroup" aria-label="اختار العرض">
            {OFFER_ZONES.map(z => {
              const active = offerId === z.id;
              return (
                <button key={z.id} type="button" role="radio" aria-checked={active} aria-label={z.label}
                  onClick={() => { selectOffer(z.id); scrollTo('order'); }}
                  className={`${zoneBtn} rounded-[5%] transition-shadow ${active ? 'ring-[5px] ring-[#FFD60A] shadow-[0_0_0_9px_rgba(255,214,10,.25)]' : ''}`} style={pos(z.box)}>
                  {active && <span className="absolute -top-3 left-3 w-9 h-9 rounded-full bg-[#FFD60A] text-[#0B1B3F] flex items-center justify-center shadow-lg"><Check size={22} strokeWidth={3.5} /></span>}
                </button>
              );
            })}
          </div>
          <button type="button" aria-label="اطلب الآن" onClick={() => scrollTo('order')} className={`${zoneBtn} rounded-full`} style={pos([64, 1804, 1070, 1962])} />
        </Visual>

        {/* Formulaire */}
        <section id="order" className="px-3 pt-4 pb-10 scroll-mt-1">
          <CheckoutFormPigma offerId={offerId} onOfferChange={selectOffer} sourceTag="LP pigma-visuel" onPurchase={onPurchase} onFirstInteraction={handleFirstInteraction}
            source={SOURCE} extraPayload={() => ({ utm: readUtm() })} highlightOffer={{ id: 'pack3', badge: 'الأكثر طلبا' }} />
          <p className="mt-6 text-center text-[11.5px] font-semibold text-sky-100/50 flex items-center justify-center gap-1">
            <ShieldCheck size={13} /> Pigma Color و Stop Fuites علامات تجارية لأصحابها. YANIS SHOP بائع للمنتج.
          </p>
        </section>
      </div>
    </div>
  );
}
