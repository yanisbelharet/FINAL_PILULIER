import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, ChevronDown, Lock, Truck, Building2, AlertCircle, Check, PhoneCall, Minus, Plus } from 'lucide-react';
import { WILAYAS } from './data';
import { normalizePhone, isValidAlgerianMobile, getOrderSource } from './CheckoutFormLP';
import { da } from './pigmaFormat';

// Grand format : seau de 16 kg, livraison gratuite (prix fixés par la boutique)
export const PIGMA16_PRODUCT = { id: 'pigma-stop-fuites-16kg', name: 'Pigma Color Stop Fuites Transparent 16 kg' };
export const BUCKET_KG = 16;
export const BUCKET_PRICE = 11900;
// Prix au kg affiché par la boutique (11 900 / 16 = 743,75 DA)
export const PRICE_PER_KG_DISPLAY = 750;
// 1 kg couvre 4 m² en deux couches
export const M2_PER_KG = 4;
export const M2_PER_BUCKET = BUCKET_KG * M2_PER_KG;
export const MAX_BUCKETS = 30;

export const bucketsLabel = (n: number) => (n === 1 ? 'سطل واحد' : n === 2 ? 'زوج سطول' : `${n} سطول`);

type Field = 'name' | 'phone' | 'wilaya' | 'commune';
type Errors = Partial<Record<Field, string>>;

const CheckoutFormPigma16 = ({ count, onCountChange, sourceTag, onPurchase, onFirstInteraction }: {
  count: number;
  onCountChange: (n: number) => void;
  sourceTag: string;
  onPurchase: (p: number, product: any, formData: any) => void;
  onFirstInteraction?: () => void;
}) => {
  const isSubmittingRef = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', commune: '', deliveryType: 'home' as 'home' | 'desk' });
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

  const kg = count * BUCKET_KG;
  const total = count * BUCKET_PRICE;

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
    if (Object.keys(found).length > 0) {
      const first = (['name', 'phone', 'wilaya', 'commune'] as const).find(k => found[k]);
      document.getElementById(`pg16-${first}`)?.focus();
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setSubmitError('');

    const phone = normalizePhone(formData.phone);
    const eventId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const bundleTitle = `${count} × سطل 16 كلغ`;
    const productName = `${PIGMA16_PRODUCT.name} - ${bundleTitle} = ${kg} كلغ`;

    try {
      const response = await fetch('/api/submitOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          phone,
          quantity: count,
          price: total,
          // valeur nette (sans livraison) utilisée pour les pixels / CAPI ; ici la livraison est gratuite
          productTotal: total,
          currency: 'DZD',
          country: 'Algeria',
          bundleId: 'seau16',
          bundleTitle,
          productId: PIGMA16_PRODUCT.id,
          productName,
          eventId,
          source: `${sourceTag} · ${getOrderSource()}`,
        }),
      });

      if (response.ok) {
        onPurchase(total, { ...PIGMA16_PRODUCT, price: total, currency: 'DZD' }, { ...formData, phone, eventId, quantity: count });
        setDone({ name: formData.name.trim(), phone, label: `${bucketsLabel(count)} Stop Fuites 16 كلغ (${kg} كلغ)`, total });
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

      {/* Produit + nombre de seaux */}
      <div className="rounded-2xl border-2 border-[#1366d6] bg-sky-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[16px] font-black text-[#0B1B3F] leading-snug">سطل Stop Fuites شفاف 16 كلغ</p>
            <p className="text-[12.5px] font-semibold text-slate-500">≈ {PRICE_PER_KG_DISPLAY} د.ج للكلغ · <b className="text-emerald-600">توصيل مجاني</b></p>
          </div>
          <p className="shrink-0 text-[17px] font-black text-[#0B1B3F]">{da(BUCKET_PRICE)}</p>
        </div>
        <div className="mt-3 flex items-center justify-between bg-white rounded-xl px-3 h-14">
          <span className="text-[14px] font-bold text-slate-700">عدد السطول</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="نقّص" onClick={() => onCountChange(Math.max(1, count - 1))}
              className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center active:scale-90 transition-transform"><Minus size={18} /></button>
            <span className="text-xl font-black text-slate-900 w-7 text-center" aria-live="polite">{count}</span>
            <button type="button" aria-label="زيد" onClick={() => onCountChange(Math.min(MAX_BUCKETS, count + 1))}
              className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center active:scale-90 transition-transform"><Plus size={18} /></button>
          </div>
        </div>
        <p className="mt-2 text-center text-[12.5px] font-bold text-slate-500">{kg} كلغ · يغطي حوالي {count * M2_PER_BUCKET} م² بطبقتين</p>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="pg16-name" className="sr-only">الاسم واللقب</label>
          <div className="relative">
            <input id="pg16-name" type="text" autoComplete="name" placeholder="الاسم واللقب" aria-invalid={!!errors.name}
              className={`${fieldClass(errors.name)} pr-11 pl-3`} value={formData.name} onChange={e => update({ name: e.target.value })} />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.name} />
        </div>

        <div>
          <label htmlFor="pg16-phone" className="sr-only">رقم الهاتف</label>
          <div className="relative">
            <input id="pg16-phone" type="tel" inputMode="tel" autoComplete="tel" dir={formData.phone ? 'ltr' : 'rtl'}
              placeholder="رقم الهاتف (05 / 06 / 07)" aria-invalid={!!errors.phone}
              className={`${fieldClass(errors.phone)} pr-11 pl-3 text-right`} value={formData.phone} onChange={e => update({ phone: e.target.value })} />
            <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.phone} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pg16-wilaya" className="sr-only">الولاية</label>
            <div className="relative">
              <select id="pg16-wilaya" aria-invalid={!!errors.wilaya} value={formData.wilaya}
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
            <label htmlFor="pg16-commune" className="sr-only">البلدية</label>
            <div className="relative">
              <select id="pg16-commune" aria-invalid={!!errors.commune} value={formData.commune} disabled={!formData.wilaya}
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
            return (
              <button key={value} type="button" role="radio" aria-checked={active} onClick={() => update({ deliveryType: value })}
                className={`h-11 rounded-xl flex items-center justify-center gap-1.5 text-[14px] font-bold transition-colors ${
                  active ? 'bg-white text-[#0B1B3F] shadow-sm' : 'text-slate-500'}`}>
                <Icon size={16} /> {label} <span className="text-[12px] text-emerald-600">(مجاني)</span>
              </button>
            );
          })}
        </div>

        {/* Récapitulatif */}
        <div className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3" aria-live="polite">
          <span className="text-[13px] font-semibold text-slate-500 leading-tight">
            المجموع ({kg} كلغ)<br />
            <b className="text-emerald-600">التوصيل مجاني</b>
          </span>
          <span className="text-[26px] font-black text-[#0B4FB3]">{da(total)}</span>
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

export default CheckoutFormPigma16;
