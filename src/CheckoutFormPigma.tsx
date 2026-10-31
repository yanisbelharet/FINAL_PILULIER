import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, MapPin, ChevronDown, Lock, Truck, Building2, AlertCircle, Check, PhoneCall, Calculator } from 'lucide-react';
import { WILAYAS, DELIVERY_PRICES } from './data';
import { normalizePhone, isValidAlgerianMobile, getOrderSource } from './CheckoutFormLP';

export const PIGMA_PRODUCT = { id: 'pigma-stop-fuites-transparent', name: 'Pigma Color Stop Fuites Transparent 1,4 kg' };
// Prix normal d'une boîte de 1,4 kg (fixé par la boutique)
export const PIGMA_UNIT_PRICE = 1900;
export const PIGMA_BOX_KG = 1.4;

export type PigmaOffer = { id: string; title: string; boxes: number; paid: number; price: number; freeDelivery: boolean; badge: string };

// Les 3 offres affichées
export const PIGMA_OFFERS: PigmaOffer[] = [
  { id: 'pack1', title: 'علبة واحدة', boxes: 1, paid: 1, price: 1900, freeDelivery: false, badge: '' },
  { id: 'pack3', title: '2 علب + 1 مجانية', boxes: 3, paid: 2, price: 3800, freeDelivery: false, badge: '' },
  { id: 'pack6', title: '4 علب + 2 مجانيات', boxes: 6, paid: 4, price: 7600, freeDelivery: true, badge: 'الأكثر توفيرا' },
];
// Combinaisons proposées uniquement par la calculatrice (7 à 9 boîtes) : elles contiennent l'offre 4+2, donc livraison gratuite
export const PIGMA_COMBOS: PigmaOffer[] = [
  { id: 'combo7', title: '4 علب + 2 مجانيات + علبة', boxes: 7, paid: 5, price: 9500, freeDelivery: true, badge: '' },
  { id: 'combo9', title: '4 علب + 2 مجانيات + 2 علب + 1 مجانية', boxes: 9, paid: 6, price: 11400, freeDelivery: true, badge: '' },
];
export const getOffer = (id: string) => [...PIGMA_OFFERS, ...PIGMA_COMBOS].find(o => o.id === id) || PIGMA_OFFERS[2];

// Isolé en LTR (U+2066…U+2069), sinon « 3 800 » s'affiche « 800 3 » dans une page RTL
const fmt = (n: number) => `⁦${n.toLocaleString('fr-DZ').replace(/ | /g, ' ')}⁩`;
export const da = (n: number) => `${fmt(n)} د.ج`;
export const boxesLabel = (n: number) => (n === 1 ? 'علبة وحدة' : n === 2 ? 'جوج علب' : `${n} علب`);

const OfferCard = ({ o, active, onSelect, note }: { o: PigmaOffer; active: boolean; onSelect: (id: string) => void; note?: string }) => {
  const full = o.boxes * PIGMA_UNIT_PRICE;
  return (
    <button type="button" role="radio" aria-checked={active} onClick={() => onSelect(o.id)} data-offer={o.id}
      className={`pg-offer relative w-full rounded-2xl border-2 p-3 flex items-center gap-3 text-right transition-all ${
        active ? 'border-[#1366d6] bg-sky-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
      {(o.badge || note) && (
        <span className="absolute -top-2.5 left-3 text-[11px] font-black text-[#0B1B3F] bg-[#FFD60A] rounded-full px-2.5 py-0.5 shadow flex items-center gap-1">
          {note && <Calculator size={11} />}{o.badge || note}
        </span>
      )}
      <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? 'border-[#1366d6] bg-[#1366d6] text-white' : 'border-slate-300'}`}>
        {active && <Check size={14} strokeWidth={3} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-black text-[#0B1B3F] leading-snug">{o.title}</span>
        <span className="block text-[12.5px] font-semibold text-slate-500">
          {o.boxes === 1 ? '1,4 كلغ' : `${o.boxes} علب`} · {o.freeDelivery ? <b className="text-emerald-600">توصيل مجاني</b> : '+ التوصيل'}
        </span>
      </span>
      <span className="text-left shrink-0">
        <span className="block text-[17px] font-black text-[#0B1B3F]">{da(o.price)}</span>
        {full > o.price && <span className="block text-[11.5px] font-bold text-slate-400 line-through">{da(full)}</span>}
      </span>
    </button>
  );
};

type Field = 'name' | 'phone' | 'wilaya' | 'commune' | 'address';
type Errors = Partial<Record<Field, string>>;

const CheckoutFormPigma = ({ offerId, onOfferChange, sourceTag, onPurchase, onFirstInteraction }: {
  offerId: string;
  onOfferChange: (id: string) => void;
  sourceTag: string;
  onPurchase: (p: number, product: any, formData: any) => void;
  onFirstInteraction?: () => void;
}) => {
  const isSubmittingRef = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', commune: '', address: '', deliveryType: 'home' as 'home' | 'desk' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { name: string; phone: string; label: string; total: number }>(null);
  const [communeList, setCommuneList] = useState<{ id: number; name_ar: string }[]>([]);

  useEffect(() => {
    if (formData.wilaya) {
      import('algeria-locations').then(({ getCommunesByWilayaId }) => {
        setCommuneList(getCommunesByWilayaId(parseInt(formData.wilaya, 10)) || []);
      }).catch(err => console.error('Failed to load communes:', err));
    } else {
      setCommuneList([]);
    }
  }, [formData.wilaya]);

  useEffect(() => {
    if (done) doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [done]);

  const offer = getOffer(offerId);
  const combo = PIGMA_COMBOS.find(c => c.id === offerId);
  const wilayaPrice = formData.wilaya ? DELIVERY_PRICES[formData.wilaya] : null;
  const deliveryPrice = offer.freeDelivery ? 0 : (wilayaPrice ? wilayaPrice[formData.deliveryType] : 0);
  const totalPrice = offer.price + deliveryPrice;

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
    if (formData.deliveryType === 'home' && formData.address.trim().length < 3) e.address = 'اكتب العنوان باش يوصلك الطلب';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (['name', 'phone', 'wilaya', 'commune', 'address'] as const).find(k => found[k]);
      document.getElementById(`pg-${first}`)?.focus();
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
          address: formData.address.trim(),
          phone,
          quantity: offer.boxes,
          price: totalPrice,
          // valeur nette (sans livraison) utilisée pour les pixels / CAPI
          productTotal: offer.price,
          currency: 'DZD',
          country: 'Algeria',
          bundleId: offer.id,
          bundleTitle: offer.title,
          productId: PIGMA_PRODUCT.id,
          productName,
          eventId,
          source: `${sourceTag} · ${getOrderSource()}`,
        }),
      });

      if (response.ok) {
        // Pixels : valeur nette des produits (DZD), sans la livraison
        onPurchase(offer.price, { ...PIGMA_PRODUCT, price: offer.price, currency: 'DZD' }, { ...formData, phone, eventId, quantity: offer.boxes });
        setDone({ name: formData.name.trim(), phone, label: `${boxesLabel(offer.boxes)} Stop Fuites (${offer.title})`, total: totalPrice });
      } else {
        const data = await response.json().catch(() => null);
        isSubmittingRef.current = false;
        setSubmitError(data?.error && typeof data.error === 'string' && /[؀-ۿ]/.test(data.error)
          ? data.error
          : 'صرا مشكل في إرسال الطلب، عاود جرّب من فضلك.');
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
      <div ref={doneRef} role="status" className="pg-done bg-white rounded-[28px] p-6 text-center shadow-[0_30px_80px_-30px_rgba(6,24,58,.55)] ring-1 ring-sky-100">
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

  const fieldClass = (hasError?: string) =>
    `w-full h-[52px] bg-white border-2 rounded-2xl text-[16px] font-semibold text-slate-800 outline-none transition-colors placeholder:text-slate-400 ${
      hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-[#1366d6]'
    }`;

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-[13px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {msg}</p> : null;

  return (
    <form onSubmit={handleSubmit} onFocusCapture={onFirstInteraction} noValidate
      className="bg-white rounded-[28px] p-4 sm:p-6 shadow-[0_30px_80px_-30px_rgba(6,24,58,.55)] ring-1 ring-sky-100">
      <h2 className="text-center text-[22px] font-black text-[#0B1B3F] mb-4">اطلب دركا – الدفع عند الاستلام</h2>

      {/* Choix de l'offre */}
      <div className="space-y-3 mb-4" role="radiogroup" aria-label="اختار العرض">
        {combo && <OfferCard o={combo} active onSelect={onOfferChange} note="اقتراح الحاسبة" />}
        {PIGMA_OFFERS.map(o => <React.Fragment key={o.id}><OfferCard o={o} active={o.id === offerId} onSelect={onOfferChange} /></React.Fragment>)}
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="pg-name" className="sr-only">الاسم واللقب</label>
          <div className="relative">
            <input id="pg-name" type="text" autoComplete="name" placeholder="الاسم واللقب" aria-invalid={!!errors.name}
              className={`${fieldClass(errors.name)} pr-11 pl-3`} value={formData.name} onChange={e => update({ name: e.target.value })} />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.name} />
        </div>

        <div>
          <label htmlFor="pg-phone" className="sr-only">رقم الهاتف</label>
          <div className="relative">
            <input id="pg-phone" type="tel" inputMode="tel" autoComplete="tel" dir={formData.phone ? 'ltr' : 'rtl'}
              placeholder="رقم الهاتف (05 / 06 / 07)" aria-invalid={!!errors.phone}
              className={`${fieldClass(errors.phone)} pr-11 pl-3 text-right`} value={formData.phone} onChange={e => update({ phone: e.target.value })} />
            <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.phone} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pg-wilaya" className="sr-only">الولاية</label>
            <div className="relative">
              <select id="pg-wilaya" aria-invalid={!!errors.wilaya} value={formData.wilaya}
                className={`${fieldClass(errors.wilaya)} pr-3 pl-9 appearance-none ${formData.wilaya ? '' : 'text-slate-400'}`}
                onChange={e => update({ wilaya: e.target.value, commune: '' })}>
                <option value="" disabled>الولاية</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <ErrorText msg={errors.wilaya} />
          </div>
          <div>
            <label htmlFor="pg-commune" className="sr-only">البلدية</label>
            <div className="relative">
              <select id="pg-commune" aria-invalid={!!errors.commune} value={formData.commune} disabled={!formData.wilaya}
                className={`${fieldClass(errors.commune)} pr-3 pl-9 appearance-none disabled:bg-slate-50 ${formData.commune ? '' : 'text-slate-400'}`}
                onChange={e => update({ commune: e.target.value })}>
                <option value="" disabled>البلدية</option>
                {communeList.map(c => <option key={c.id} value={c.name_ar}>{c.name_ar}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <ErrorText msg={errors.commune} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100" role="radiogroup" aria-label="طريقة التوصيل">
          {([{ value: 'home', label: 'للدار', Icon: Truck }, { value: 'desk', label: 'للمكتب', Icon: Building2 }] as const).map(({ value, label, Icon }) => {
            const active = formData.deliveryType === value;
            const price = offer.freeDelivery ? 'مجاني' : wilayaPrice ? da(wilayaPrice[value]) : '';
            return (
              <button key={value} type="button" role="radio" aria-checked={active} onClick={() => update({ deliveryType: value })}
                className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-bold transition-colors ${
                  active ? 'bg-white text-[#0B1B3F] shadow-sm' : 'text-slate-500'}`}>
                <Icon size={16} /> {label}
                {price && <span className={`text-[12px] ${offer.freeDelivery ? 'text-emerald-600' : 'text-slate-400'}`}>({price})</span>}
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="pg-address" className="sr-only">العنوان</label>
          <div className="relative">
            <input id="pg-address" type="text" autoComplete="street-address" aria-invalid={!!errors.address}
              placeholder={formData.deliveryType === 'desk' ? 'العنوان (اختياري)' : 'العنوان (الحي، الشارع…)'}
              className={`${fieldClass(errors.address)} pr-11 pl-3`} value={formData.address} onChange={e => update({ address: e.target.value })} />
            <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.address} />
        </div>

        {/* Récapitulatif */}
        <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3" aria-live="polite">
          <span className="text-[13px] font-semibold text-slate-500 leading-tight">
            المجموع<br />
            {offer.freeDelivery ? <b className="text-emerald-600">التوصيل مجاني</b> : wilayaPrice ? `منها التوصيل ${da(deliveryPrice)}` : '+ التوصيل حسب الولاية'}
          </span>
          <span className="text-[26px] font-black text-[#0B4FB3]">{da(totalPrice)}</span>
        </div>

        {submitError && (
          <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold p-3 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> {submitError}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="pg-shine relative overflow-hidden w-full h-[58px] rounded-2xl bg-[#FFD60A] text-[#0B1B3F] text-[18px] font-black shadow-lg shadow-yellow-500/30 active:scale-[0.98] transition-transform disabled:opacity-70">
          {loading ? 'راهو يتبعث…' : 'أكّد الطلب'}
        </button>
        <p className="text-center text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
          <Lock size={14} /> ما تخلص والو دركا · نعيطولك باش نأكدو
        </p>
      </div>
    </form>
  );
};

export default CheckoutFormPigma;
