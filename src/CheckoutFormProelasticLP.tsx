import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, ChevronDown, Minus, Plus, Lock, Truck, Building2, AlertCircle, Check } from 'lucide-react';
import { WILAYAS, DELIVERY_PRICES } from './data';
import { normalizePhone, isValidAlgerianMobile, getOrderSource } from './CheckoutFormLP';

export const PROELASTIC_PRODUCT = { id: 'proelastic-profinish', name: 'PROELASTIC Profinish' };

// Offres : 1 kg couvre ~2 m²
export const PROELASTIC_PACKAGES = [
  { id: '1kg', title: '1 كلغ', kg: 1, paidKg: 1, price: 1900, badge: '' },
  { id: '3kg_offer', title: '3 كلغ', kg: 3, paidKg: 2, price: 3800, badge: '1 كلغ مجاناً' },
  { id: '5kg_bucket', title: '5 كلغ', kg: 5, paidKg: 3, price: 5700, badge: '2 كلغ مجاناً' },
] as const;
export type ProelasticPackageId = typeof PROELASTIC_PACKAGES[number]['id'];
export const KG_COVERAGE_M2 = 2;

type Errors = Partial<Record<'name' | 'phone' | 'wilaya' | 'commune', string>>;

const CheckoutFormProelasticLP = ({ packageId, onPackageChange, packCount, onPackCountChange, sourceTag, onPurchase, onFirstInteraction }: {
  packageId: ProelasticPackageId;
  onPackageChange: (id: ProelasticPackageId) => void;
  packCount: number;
  onPackCountChange: (n: number) => void;
  sourceTag: string;
  onPurchase: (p: number, product: any, formData: any) => void;
  onFirstInteraction?: () => void;
}) => {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({ name: '', phone: '', wilaya: '', commune: '', deliveryType: 'home' as 'home' | 'desk' });
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const pkg = PROELASTIC_PACKAGES.find(p => p.id === packageId) || PROELASTIC_PACKAGES[0];
  const totalKg = pkg.kg * packCount;
  const subtotal = pkg.price * packCount;
  const wilayaPrice = formData.wilaya ? DELIVERY_PRICES[formData.wilaya] : null;
  const deliveryPrice = wilayaPrice ? wilayaPrice[formData.deliveryType] : 0;
  const totalPrice = subtotal + deliveryPrice;

  const update = (patch: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...patch }));
    const cleared = { ...errors };
    (Object.keys(patch) as (keyof Errors)[]).forEach(k => delete cleared[k]);
    setErrors(cleared);
    setSubmitError('');
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (formData.name.trim().length < 2) e.name = 'يرجى إدخال الاسم الكامل';
    const phone = normalizePhone(formData.phone);
    if (!phone) e.phone = 'يرجى إدخال رقم الهاتف';
    else if (!isValidAlgerianMobile(phone)) e.phone = 'رقم الهاتف غير صحيح (مثال: 0555123456)';
    if (!formData.wilaya) e.wilaya = 'يرجى اختيار الولاية';
    if (!formData.commune) e.commune = 'يرجى اختيار البلدية';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const firstField = (['name', 'phone', 'wilaya', 'commune'] as const).find(k => found[k]);
      document.getElementById(`pe-${firstField}`)?.focus();
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setSubmitError('');

    const phone = normalizePhone(formData.phone);
    const eventId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const offerLabel = `${pkg.title}${pkg.badge ? ` (${pkg.badge})` : ''}${packCount > 1 ? ` × ${packCount}` : ''}`;
    const productName = `${PROELASTIC_PRODUCT.name} - ${offerLabel} = ${totalKg} كلغ`;

    try {
      const response = await fetch('/api/submitOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          phone,
          quantity: totalKg,
          price: totalPrice,
          // valeur nette (sans livraison) utilisée pour les pixels / CAPI
          productTotal: subtotal,
          currency: 'DZD',
          country: 'Algeria',
          bundleId: pkg.id,
          bundleTitle: offerLabel,
          productId: PROELASTIC_PRODUCT.id,
          productName,
          eventId,
          source: `${sourceTag} · ${getOrderSource()}`
        }),
      });

      if (response.ok) {
        // Pixels : valeur nette des produits, sans la livraison
        onPurchase(subtotal, { ...PROELASTIC_PRODUCT, price: subtotal, currency: 'DZD' }, { ...formData, phone, eventId, quantity: totalKg });
        navigate('/thank-you', { state: { orderDetails: { name: formData.name.trim(), phone, productName, totalPrice } } });
      } else {
        const data = await response.json().catch(() => null);
        isSubmittingRef.current = false;
        setSubmitError(data?.error && typeof data.error === 'string' && /[؀-ۿ]/.test(data.error)
          ? data.error
          : 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      isSubmittingRef.current = false;
      setSubmitError('تعذر الاتصال، تحقق من الإنترنت ثم أعد المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (hasError?: string) =>
    `w-full h-12 bg-white border-2 rounded-xl text-[15px] font-semibold text-slate-800 outline-none transition-colors placeholder:text-slate-400 ${
      hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-sky-600'
    }`;

  const ErrorText = ({ msg, id }: { msg?: string; id: string }) =>
    msg ? <p id={id} className="mt-1 text-[13px] font-bold text-rose-600 flex items-center gap-1"><AlertCircle size={14} /> {msg}</p> : null;

  return (
    <form onSubmit={handleSubmit} onFocusCapture={onFirstInteraction} noValidate
      className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_20px_60px_-20px_rgba(2,32,71,0.45)] ring-1 ring-sky-100">
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-[#0A1F44]">اطلب PROELASTIC الأصلي</h2>
        <p className="text-sm font-semibold text-slate-500 mt-1">الدفع عند الاستلام · نتصل بك لتأكيد الطلب</p>
      </div>

      {/* Choix de l'offre */}
      <div className="space-y-2 mb-4" role="radiogroup" aria-label="اختر العرض">
        {PROELASTIC_PACKAGES.map(p => {
          const active = p.id === packageId;
          return (
            <button key={p.id} type="button" role="radio" aria-checked={active} onClick={() => onPackageChange(p.id)}
              className={`relative w-full rounded-2xl border-2 p-3 flex items-center gap-3 text-right transition-all ${
                active ? 'border-sky-600 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white'
              }`}>
              <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? 'border-sky-600 bg-sky-600 text-white' : 'border-slate-300'}`}>
                {active && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="text-[17px] font-black text-[#0A1F44]">{p.title}</span>
                  {p.badge && <span className="text-[11px] font-black text-white bg-amber-500 rounded-full px-2 py-0.5">🎁 {p.badge}</span>}
                </span>
                <span className="block text-[12px] font-semibold text-slate-500">
                  {p.badge ? `تدفع ${p.paidKg} كلغ فقط · ` : ''}يغطي ~{p.kg * KG_COVERAGE_M2} م²
                </span>
              </span>
              <span className="text-left shrink-0">
                <span className="block text-[17px] font-black text-[#0A1F44]">{p.price} د.ج</span>
                {p.badge && <span className="block text-[11px] font-bold text-slate-400 line-through">{p.kg * 1900} د.ج</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="pe-name" className="sr-only">الاسم الكامل</label>
          <div className="relative">
            <input id="pe-name" type="text" autoComplete="name" placeholder="الاسم الكامل" aria-invalid={!!errors.name}
              className={`${fieldClass(errors.name)} pr-11 pl-3`} value={formData.name} onChange={e => update({ name: e.target.value })} />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.name} id="pe-name-err" />
        </div>

        <div>
          <label htmlFor="pe-phone" className="sr-only">رقم الهاتف</label>
          <div className="relative">
            <input id="pe-phone" type="tel" inputMode="tel" autoComplete="tel" dir={formData.phone ? 'ltr' : 'rtl'}
              placeholder="رقم الهاتف (مثال: 0555123456)" aria-invalid={!!errors.phone}
              className={`${fieldClass(errors.phone)} pr-11 pl-3 text-right`} value={formData.phone} onChange={e => update({ phone: e.target.value })} />
            <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.phone} id="pe-phone-err" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pe-wilaya" className="sr-only">الولاية</label>
            <div className="relative">
              <select id="pe-wilaya" aria-invalid={!!errors.wilaya} value={formData.wilaya}
                className={`${fieldClass(errors.wilaya)} pr-3 pl-9 appearance-none ${formData.wilaya ? '' : 'text-slate-400'}`}
                onChange={e => update({ wilaya: e.target.value, commune: '' })}>
                <option value="" disabled>الولاية</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <ErrorText msg={errors.wilaya} id="pe-wilaya-err" />
          </div>
          <div>
            <label htmlFor="pe-commune" className="sr-only">البلدية</label>
            <div className="relative">
              <select id="pe-commune" aria-invalid={!!errors.commune} value={formData.commune} disabled={!formData.wilaya}
                className={`${fieldClass(errors.commune)} pr-3 pl-9 appearance-none disabled:bg-slate-50 ${formData.commune ? '' : 'text-slate-400'}`}
                onChange={e => update({ commune: e.target.value })}>
                <option value="" disabled>البلدية</option>
                {communeList.map(c => <option key={c.id} value={c.name_ar}>{c.name_ar}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <ErrorText msg={errors.commune} id="pe-commune-err" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="طريقة التوصيل">
          {([{ value: 'home', label: 'إلى المنزل', Icon: Truck }, { value: 'desk', label: 'إلى المكتب', Icon: Building2 }] as const).map(({ value, label, Icon }) => {
            const active = formData.deliveryType === value;
            return (
              <button key={value} type="button" role="radio" aria-checked={active} onClick={() => update({ deliveryType: value })}
                className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center leading-tight transition-colors ${
                  active ? 'border-sky-600 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600'}`}>
                <span className="flex items-center gap-1.5 text-[14px] font-bold"><Icon size={16} /> {label}</span>
                <span className="text-[12px] font-semibold opacity-80">{wilayaPrice ? `${wilayaPrice[value]} د.ج` : 'حسب الولاية'}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 h-14">
          <span className="text-[14px] font-bold text-slate-700">عدد العروض</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="إنقاص" onClick={() => onPackCountChange(Math.max(1, packCount - 1))}
              className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"><Minus size={18} /></button>
            <span className="text-xl font-black text-slate-900 w-6 text-center" aria-live="polite">{packCount}</span>
            <button type="button" aria-label="زيادة" onClick={() => onPackCountChange(Math.min(20, packCount + 1))}
              className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"><Plus size={18} /></button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-[14px]">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-500 font-semibold">PROELASTIC {totalKg} كلغ (~{totalKg * KG_COVERAGE_M2} م²)</span>
            <span className="font-bold text-slate-800">{subtotal} د.ج</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-500 font-semibold">التوصيل</span>
            <span className="font-bold text-slate-800">{wilayaPrice ? `${deliveryPrice} د.ج` : 'اختر الولاية'}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-sky-50 rounded-b-xl">
            <span className="font-black text-slate-900">المجموع</span>
            <span className="text-2xl font-black text-sky-800">{totalPrice} د.ج</span>
          </div>
        </div>

        {submitError && (
          <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold p-3 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> {submitError}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="pe-shine relative overflow-hidden w-full h-14 rounded-2xl bg-gradient-to-l from-sky-600 to-cyan-500 text-white text-lg font-black shadow-lg shadow-sky-600/30 active:scale-[0.99] transition-transform disabled:opacity-70">
          {loading ? 'جاري إرسال الطلب...' : 'اطلب الآن – الدفع عند الاستلام'}
        </button>
        <p className="text-center text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
          <Lock size={14} /> لا تدفع شيئاً الآن · افحص المنتج ثم ادفع
        </p>
      </div>
    </form>
  );
};

export default CheckoutFormProelasticLP;
