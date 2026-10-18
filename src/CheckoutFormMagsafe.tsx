import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, ShieldCheck, Truck, User, Phone, MapPin, CheckCircle2, Sparkles, Smartphone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WILAYAS, DELIVERY_PRICES } from './data';

interface CheckoutFormMagsafeProps {
  onPurchase: (price: number, product: any, formData: any) => void;
}

export default function CheckoutFormMagsafe({ onPurchase }: CheckoutFormMagsafeProps) {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Offers: 1 piece (2900), 2 pieces (4900), 3 pieces (6500)
  const [selectedBundle, setSelectedBundle] = useState<1 | 2 | 3>(1);
  const [selectedColor, setSelectedColor] = useState<'titanium' | 'silver' | 'black'>('titanium');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wilaya: '16 - الجزائر',
    commune: '',
    deliveryType: 'home' as 'home' | 'desk',
    address: '',
  });

  const [communeList, setCommuneList] = useState<{ id: number; name_ar: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Dynamically load communes
  useEffect(() => {
    if (formData.wilaya) {
      import('algeria-locations').then(({ getCommunesByWilayaId }) => {
        const wilayaId = parseInt(formData.wilaya, 10);
        const list = getCommunesByWilayaId(wilayaId);
        setCommuneList(list || []);
      }).catch(err => {
        console.error("Failed to load communes:", err);
      });
    } else {
      setCommuneList([]);
    }
  }, [formData.wilaya]);

  const getProductPrice = () => {
    if (selectedBundle === 1) return 2900;
    if (selectedBundle === 2) return 4900;
    return 6500;
  };

  const productPrice = getProductPrice();
  const wilayaPrice = formData.wilaya ? DELIVERY_PRICES[formData.wilaya] : null;
  const deliveryPrice = wilayaPrice ? wilayaPrice[formData.deliveryType] : 0;
  const totalPrice = productPrice + deliveryPrice;

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.length > 0 && cleaned.length < 9) {
      return 'يرجى إدخال رقم هاتف صحيح (05 / 06 / 07)';
    }
    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, phone: val });
    if (val.length >= 9) {
      setPhoneError(validatePhone(val));
    } else {
      setPhoneError('');
    }
  };

  const colorMap = {
    titanium: 'رمادي تيتانيوم (Titanium Grey)',
    silver: 'فضي ميتاليك (Metallic Silver)',
    black: 'أسود مطفي فاخر (Matte Black)'
  };
  const colorLabel = colorMap[selectedColor];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!formData.name.trim()) {
      alert('يرجى إدخال الاسم الكامل');
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 9) {
      setPhoneError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    if (!formData.wilaya) {
      alert('يرجى اختيار الولاية');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    const eventId = `ORDER_MAGSAFE_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const orderPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      secondaryPhone: '',
      wilaya: formData.wilaya,
      commune: formData.commune || 'غير محدد',
      address: formData.address.trim() || `${formData.wilaya} - ${formData.commune || ''}`,
      city: formData.commune || formData.wilaya,
      deliveryType: formData.deliveryType,
      quantity: selectedBundle,
      price: totalPrice,
      // valeur nette (sans livraison) utilisée pour les pixels / CAPI
      productTotal: productPrice,
      currency: 'DZD',
      country: 'Algeria',
      productId: 'magsafe-ring-stand',
      productName: `حامل ومقبض MagSafe المغناطيسي المزدوج 360° للآيفون (${selectedBundle} قطع - اللون: ${colorLabel})`,
      notes: `اللون: ${colorLabel} - باقة: ${selectedBundle} قطع - المعاينة قبل الدفع`,
      eventId,
      source: 'LandingPageMagsafe - YANIS SHOP'
    };

    try {
      const response = await fetch('/api/submitOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (response.ok) {
        // Pixels : valeur nette des produits, sans la livraison
        onPurchase(productPrice, {
          id: 'magsafe-ring-stand',
          name: `حامل ومقبض MagSafe المغناطيسي المزدوج 360° للآيفون`,
          price: productPrice,
          currency: 'DZD'
        }, orderPayload);

        navigate('/thank-you', {
          state: {
            orderDetails: {
              name: formData.name,
              phone: formData.phone,
              wilaya: formData.wilaya,
              commune: formData.commune,
              productName: `حامل ومقبض MagSafe المغناطيسي المزدوج 360° للآيفون (${colorLabel})`,
              totalPrice: `${totalPrice} د.ج`,
            }
          }
        });
      } else {
        alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
      }
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('حدث خطأ في الاتصال، يرجى إعادة المحاولة.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200">
      {/* Premium Badge Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-900 text-white rounded-2xl p-4 mb-6 shadow-md border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-sm">
            <Sparkles size={13} />
            إصدار بريميوم أصلي
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-semibold">
            <Smartphone size={14} className="text-blue-400" />
            مخصص لأجهزة iPhone MagSafe
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          مغناطيس مزدوج فائق القوة N52 مصنوع من سبائك الألومنيوم والزنك الفاخرة، دوران 360 درجة، وتثبيت فوري على أسطح المعادن ومعدات الجيم.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Package Selection */}
        <div>
          <label className="block text-sm font-black text-slate-900 mb-2.5">
            1. اختر باقة العرض المناسبة لك: <span className="text-rose-600">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Offer 1: 1 piece */}
            <div
              onClick={() => setSelectedBundle(1)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedBundle === 1
                  ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900/10'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold text-slate-500 mb-1">1 قطعة</div>
              <div className="text-lg font-black text-slate-900">2900 د.ج</div>
              <div className="text-[11px] text-slate-400 line-through">4500 د.ج</div>
              <p className="text-[11px] text-slate-500 mt-1">حامل MagSafe كامل + حلقة معدنية إضافية مجاناً</p>
            </div>

            {/* Offer 2: 2 pieces (RECOMMENDED) */}
            <div
              onClick={() => setSelectedBundle(2)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedBundle === 2
                  ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                الأكثر طلباً (وفر 900 د.ج 🎁)
              </span>
              <div className="text-xs font-bold text-indigo-700 mb-1 mt-0.5">2 قطع (Duo Pack)</div>
              <div className="text-lg font-black text-indigo-900">4900 د.ج</div>
              <div className="text-[11px] text-slate-400 line-through">5800 د.ج</div>
              <p className="text-[11px] text-indigo-800 font-medium mt-1">2450 د.ج فقط للقطعة الواحدة</p>
            </div>

            {/* Offer 3: 3 pieces */}
            <div
              onClick={() => setSelectedBundle(3)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedBundle === 3
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                أكبر توفير (وفر 2200 د.ج 🔥)
              </span>
              <div className="text-xs font-bold text-emerald-700 mb-1 mt-0.5">3 قطع (Family Pack)</div>
              <div className="text-lg font-black text-emerald-900">6500 د.ج</div>
              <div className="text-[11px] text-slate-400 line-through">8700 د.ج</div>
              <p className="text-[11px] text-emerald-800 font-medium mt-1">2166 د.ج فقط للقطعة الواحدة</p>
            </div>
          </div>
        </div>

        {/* Step 2: Color Choice */}
        <div>
          <label className="block text-sm font-black text-slate-900 mb-2">
            2. اختر اللون المفضل: <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedColor('titanium')}
              className={`p-3 rounded-2xl border-2 text-right transition-all flex items-center justify-between cursor-pointer ${
                selectedColor === 'titanium'
                  ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-zinc-600 border-2 border-zinc-400 shadow-xs inline-block"></span>
                <div>
                  <div className="text-xs font-bold">رمادي تيتانيوم</div>
                  <div className={`text-[10px] ${selectedColor === 'titanium' ? 'text-slate-300' : 'text-slate-400'}`}>Titanium Grey</div>
                </div>
              </div>
              {selectedColor === 'titanium' && <Check size={16} className="text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedColor('silver')}
              className={`p-3 rounded-2xl border-2 text-right transition-all flex items-center justify-between cursor-pointer ${
                selectedColor === 'silver'
                  ? 'border-slate-900 bg-slate-100 text-slate-900 shadow-md font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 border-2 border-slate-300 shadow-xs inline-block"></span>
                <div>
                  <div className="text-xs font-bold">فضي ميتاليك</div>
                  <div className="text-[10px] text-slate-400">Metallic Silver</div>
                </div>
              </div>
              {selectedColor === 'silver' && <Check size={16} className="text-slate-900" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedColor('black')}
              className={`p-3 rounded-2xl border-2 text-right transition-all flex items-center justify-between cursor-pointer ${
                selectedColor === 'black'
                  ? 'border-zinc-950 bg-black text-white shadow-md font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-black border-2 border-zinc-700 shadow-xs inline-block"></span>
                <div>
                  <div className="text-xs font-bold">أسود مطفي</div>
                  <div className={`text-[10px] ${selectedColor === 'black' ? 'text-zinc-300' : 'text-slate-400'}`}>Matte Black</div>
                </div>
              </div>
              {selectedColor === 'black' && <Check size={16} className="text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Step 3: Delivery Info */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-sm font-black text-slate-900">
            3. معلومات التوصيل:
          </label>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الاسم واللقب بالكامل <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="مثال: يانيس بن علي"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-sm font-medium"
              />
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم الهاتف <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="05 / 06 / 07 XX XX XX XX"
                value={formData.phone}
                onChange={handlePhoneChange}
                className={`w-full bg-slate-50 border ${
                  phoneError ? 'border-rose-500' : 'border-slate-300'
                } text-slate-900 rounded-xl pr-10 pl-3 py-3 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-sm font-medium text-right`}
              />
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            </div>
            {phoneError && <p className="text-rose-600 text-[11px] mt-1 font-semibold">{phoneError}</p>}
          </div>

          {/* Wilaya Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الولاية (58 ولاية) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.wilaya}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
              <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            </div>
          </div>

          {/* Commune */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البلدية <span className="text-rose-500">*</span>
            </label>
            {communeList.length > 0 ? (
              <select
                required
                value={formData.commune}
                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-4 pl-3 py-3 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
              >
                <option value="">اختر البلدية...</option>
                {communeList.map((c) => (
                  <option key={c.id} value={c.name_ar}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                placeholder="اكتب اسم البلدية"
                value={formData.commune}
                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-4 pl-3 py-3 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10 outline-none transition-all text-sm font-medium"
              />
            )}
          </div>

          {/* Delivery Type Option */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              مكان استلام الطرد:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.deliveryType === 'home'
                    ? 'border-slate-900 bg-slate-50 font-bold text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={formData.deliveryType === 'home'}
                    onChange={() => setFormData({ ...formData, deliveryType: 'home' })}
                    className="accent-slate-900"
                  />
                  <span className="text-xs">توصيل لباب المنزل</span>
                </div>
                <span className="text-xs font-black text-slate-800">
                  {wilayaPrice ? `${wilayaPrice.home} د.ج` : '-'}
                </span>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.deliveryType === 'desk'
                    ? 'border-slate-900 bg-slate-50 font-bold text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={formData.deliveryType === 'desk'}
                    onChange={() => setFormData({ ...formData, deliveryType: 'desk' })}
                    className="accent-slate-900"
                  />
                  <span className="text-xs">استلام من المكتب</span>
                </div>
                <span className="text-xs font-black text-slate-800">
                  {wilayaPrice ? `${wilayaPrice.desk} د.ج` : '-'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Order Price Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 mt-4">
          <div className="flex justify-between text-xs text-slate-600">
            <span>سعر المنتج ({selectedBundle} قطع):</span>
            <span className="font-bold text-slate-900">{productPrice} د.ج</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>تكلفة التوصيل ({formData.deliveryType === 'home' ? 'لباب المنزل' : 'للمكتب'}):</span>
            <span className="font-bold text-slate-900">{deliveryPrice} د.ج</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="text-sm font-black text-slate-900">المجموع الإجمالي الواجب دفعه:</span>
            <span className="text-2xl font-black text-emerald-600">{totalPrice} د.ج</span>
          </div>
          <p className="text-[11px] text-slate-500 text-center pt-1 font-medium">
            🛡️ الدفع نقداً عند الاستلام بعد فتح وفحص الطرد والتأكد من المنتج
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl text-white font-black text-lg sm:text-xl shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <span>جاري إرسال طلبك...</span>
          ) : (
            <>
              <ShoppingCart size={22} />
              <span>تأكيد الطلب الآن ({totalPrice} د.ج)</span>
            </>
          )}
        </button>

        {/* Trust Badges under Form */}
        <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-slate-100">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-700">معاينة قبل الدفع</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Truck size={18} className="text-blue-600" />
            <span className="text-[10px] font-bold text-slate-700">توصيل سريع 58 ولاية</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 size={18} className="text-amber-600" />
            <span className="text-[10px] font-bold text-slate-700">جودة أصلية مضمونة</span>
          </div>
        </div>
      </form>
    </div>
  );
}
