import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, ChevronDown, Minus, Plus, Lock, Truck, Building2, AlertCircle } from 'lucide-react';
import { WILAYAS, DELIVERY_PRICES } from './data';

// Convertit les chiffres arabes-indiens (٠-٩) et nettoie le numéro : "+213 555 12 34 56" -> "0555123456"
export const normalizePhone = (raw: string) => {
  let p = raw.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[\s.\-()]/g, '');
  if (p.startsWith('+213')) p = '0' + p.slice(4);
  else if (p.startsWith('00213')) p = '0' + p.slice(5);
  else if (p.startsWith('213') && p.length === 12) p = '0' + p.slice(3);
  return p;
};

export const isValidAlgerianMobile = (p: string) => /^0[567]\d{8}$/.test(p);

const getOrderSource = () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('ttclid')) return 'TikTok Ads';
  if (urlParams.has('fbclid')) return 'Facebook Ads';
  const utmSource = urlParams.get('utm_source');
  if (utmSource) return utmSource;
  const ref = document.referrer.toLowerCase();
  if (ref.includes('tiktok.com')) return 'TikTok Organic';
  if (ref.includes('google.')) return 'Google Organic';
  if (ref.includes('facebook.com') || ref.includes('instagram.com')) return 'Facebook/Insta Organic';
  return 'Direct / Libre';
};

type Errors = Partial<Record<'name' | 'phone' | 'wilaya' | 'commune', string>>;

const CheckoutFormLP = ({ product, formId, sourceTag, onPurchase, onFirstInteraction }: {
  product: any;
  formId: string;
  sourceTag: string;
  onPurchase: (p: number, product: any, formData: any) => void;
  onFirstInteraction?: () => void;
}) => {
  const navigate = useNavigate();
  const productPrice = Number(product.price);
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    deliveryType: 'home' as 'home' | 'desk',
    quantity: 1,
  });
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

  const wilayaPrice = formData.wilaya ? DELIVERY_PRICES[formData.wilaya] : null;
  const deliveryPrice = wilayaPrice ? wilayaPrice[formData.deliveryType] : 0;
  const subtotal = productPrice * formData.quantity;
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
      document.getElementById(`${formId}-${firstField}`)?.focus();
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setSubmitError('');

    const phone = normalizePhone(formData.phone);
    const eventId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
      const response = await fetch('/api/submitOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          phone,
          price: totalPrice,
          productId: product.id,
          productName: product.name,
          eventId,
          source: `${sourceTag} · ${getOrderSource()}`
        }),
      });

      if (response.ok) {
        onPurchase(totalPrice, product, { ...formData, phone, eventId });
        navigate('/thank-you', {
          state: {
            orderDetails: {
              name: formData.name.trim(),
              phone,
              productName: product.name,
              totalPrice
            }
          }
        });
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
      hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-600'
    }`;

  const ErrorText = ({ msg, id }: { msg?: string; id: string }) =>
    msg ? (
      <p id={id} className="mt-1 text-[13px] font-bold text-rose-600 flex items-center gap-1">
        <AlertCircle size={14} /> {msg}
      </p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={onFirstInteraction}
      noValidate
      className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-emerald-600 shadow-[0_10px_40px_-12px_rgba(5,150,105,0.35)]"
    >
      <div className="text-center mb-4">
        <h2 className="text-xl font-black text-slate-900">اطلب الآن والدفع عند الاستلام</h2>
        <p className="text-sm font-semibold text-slate-500 mt-1">املأ معلوماتك وسنتصل بك لتأكيد الطلب</p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor={`${formId}-name`} className="sr-only">الاسم الكامل</label>
          <div className="relative">
            <input
              id={`${formId}-name`}
              type="text"
              autoComplete="name"
              placeholder="الاسم الكامل"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? `${formId}-name-err` : undefined}
              className={`${fieldClass(errors.name)} pr-11 pl-3`}
              value={formData.name}
              onChange={e => update({ name: e.target.value })}
            />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.name} id={`${formId}-name-err`} />
        </div>

        <div>
          <label htmlFor={`${formId}-phone`} className="sr-only">رقم الهاتف</label>
          <div className="relative">
            <input
              id={`${formId}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir={formData.phone ? 'ltr' : 'rtl'}
              placeholder="رقم الهاتف (مثال: 0555123456)"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? `${formId}-phone-err` : undefined}
              className={`${fieldClass(errors.phone)} pr-11 pl-3 text-right`}
              value={formData.phone}
              onChange={e => update({ phone: e.target.value })}
            />
            <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          </div>
          <ErrorText msg={errors.phone} id={`${formId}-phone-err`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${formId}-wilaya`} className="sr-only">الولاية</label>
            <div className="relative">
              <select
                id={`${formId}-wilaya`}
                aria-invalid={!!errors.wilaya}
                className={`${fieldClass(errors.wilaya)} pr-3 pl-9 appearance-none ${formData.wilaya ? '' : 'text-slate-400'}`}
                value={formData.wilaya}
                onChange={e => update({ wilaya: e.target.value, commune: '' })}
              >
                <option value="" disabled>الولاية</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <ErrorText msg={errors.wilaya} id={`${formId}-wilaya-err`} />
          </div>
          <div>
            <label htmlFor={`${formId}-commune`} className="sr-only">البلدية</label>
            <div className="relative">
              <select
                id={`${formId}-commune`}
                aria-invalid={!!errors.commune}
                className={`${fieldClass(errors.commune)} pr-3 pl-9 appearance-none disabled:bg-slate-50 ${formData.commune ? '' : 'text-slate-400'}`}
                value={formData.commune}
                onChange={e => update({ commune: e.target.value })}
                disabled={!formData.wilaya}
              >
                <option value="" disabled>البلدية</option>
                {communeList.map(c => <option key={c.id} value={c.name_ar}>{c.name_ar}</option>)}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <ErrorText msg={errors.commune} id={`${formId}-commune-err`} />
          </div>
        </div>

        {/* Type de livraison */}
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="طريقة التوصيل">
          {([
            { value: 'home', label: 'إلى المنزل', Icon: Truck },
            { value: 'desk', label: 'إلى المكتب', Icon: Building2 },
          ] as const).map(({ value, label, Icon }) => {
            const active = formData.deliveryType === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => update({ deliveryType: value })}
                className={`h-14 rounded-xl border-2 flex flex-col items-center justify-center leading-tight transition-colors ${
                  active ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <span className="flex items-center gap-1.5 text-[14px] font-bold"><Icon size={16} /> {label}</span>
                <span className="text-[12px] font-semibold opacity-80">
                  {wilayaPrice ? `${wilayaPrice[value]} د.ج` : 'حسب الولاية'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quantité */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 h-14">
          <span className="text-[15px] font-bold text-slate-700">الكمية</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="إنقاص الكمية"
              onClick={() => update({ quantity: Math.max(1, formData.quantity - 1) })}
              className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Minus size={18} />
            </button>
            <span className="text-xl font-black text-slate-900 w-6 text-center" aria-live="polite">{formData.quantity}</span>
            <button
              type="button"
              aria-label="زيادة الكمية"
              onClick={() => update({ quantity: Math.min(10, formData.quantity + 1) })}
              className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Récapitulatif toujours visible */}
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-[14px]">
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-500 font-semibold">المنتج ({formData.quantity} × {productPrice} د.ج)</span>
            <span className="font-bold text-slate-800">{subtotal} د.ج</span>
          </div>
          <div className="flex justify-between px-4 py-2.5">
            <span className="text-slate-500 font-semibold">التوصيل</span>
            <span className="font-bold text-slate-800">{wilayaPrice ? `${deliveryPrice} د.ج` : 'اختر الولاية'}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 rounded-b-xl">
            <span className="font-black text-slate-900">المجموع</span>
            <span className="text-2xl font-black text-emerald-700">{totalPrice} د.ج</span>
          </div>
        </div>

        {submitError && (
          <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold p-3 flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-lg font-black shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري إرسال الطلب...' : 'اطلب الآن – الدفع عند الاستلام'}
        </button>
        <p className="text-center text-[13px] font-semibold text-slate-500 flex items-center justify-center gap-1.5">
          <Lock size={14} /> لا تدفع شيئاً الآن · افحص المنتج ثم ادفع
        </p>
      </div>
    </form>
  );
};

export default CheckoutFormLP;
