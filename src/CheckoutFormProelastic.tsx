import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, ShieldCheck, Truck, User, Phone, MapPin, CheckCircle2, AlertTriangle, Sparkles, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WILAYAS, DELIVERY_PRICES } from './data';

interface CheckoutFormProelasticProps {
  onPurchase: (price: number, product: any, formData: any) => void;
}

export type ProelasticPackage = '1kg' | '3kg_offer' | '5kg_bucket' | 'large_qty';

export default function CheckoutFormProelastic({ onPurchase }: CheckoutFormProelasticProps) {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Selected package
  const [selectedPackage, setSelectedPackage] = useState<ProelasticPackage>('3kg_offer');
  const [largeQtyNotes, setLargeQtyNotes] = useState('');

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

  // Pricing based on selected offer
  const getProductPrice = () => {
    switch (selectedPackage) {
      case '1kg':
        return 1900;
      case '3kg_offer': // Buy 2 get 1 free = 3800 DZD
        return 3800;
      case '5kg_bucket': // Buy 3kg get 2kg free = 5700 DZD
        return 5700;
      case 'large_qty':
        return 0; // Custom pricing via phone confirmation
    }
  };

  const productPrice = getProductPrice();
  const wilayaPrice = formData.wilaya ? DELIVERY_PRICES[formData.wilaya] : null;
  const deliveryPrice = selectedPackage === 'large_qty' ? 0 : (wilayaPrice ? wilayaPrice[formData.deliveryType] : 0);
  const totalPrice = productPrice + deliveryPrice;

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.length > 0 && cleaned.length < 9) {
      return 'يرجى إدخال رقم هاتف جزائري صحيح (مثال: 05 / 06 / 07)';
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

  const getPackageDetails = () => {
    switch (selectedPackage) {
      case '1kg':
        return { name: 'علبة 1 كلغ PROELASTIC الأصلي', coverage: 'تغطي حوالي 2 م²', qty: 1 };
      case '3kg_offer':
        return { name: 'عرض 2 كلغ + 1 كلغ مجاناً (3 كلغ)', coverage: 'تغطي حوالي 6 م²', qty: 3 };
      case '5kg_bucket':
        return { name: 'سطل 5 كلغ (3 كلغ + 2 كلغ مجاناً)', coverage: 'تغطي حوالي 10 م²', qty: 5 };
      case 'large_qty':
        return { name: 'كميات كبيرة (20 كلغ أو أكثر للمشاريع)', coverage: 'سعر خاص واستشارة هاتفية مخصصة', qty: 20 };
    }
  };

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

    const eventId = `ORDER_DZ_PROELASTIC_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const pkg = getPackageDetails();

    const orderPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      secondaryPhone: '',
      wilaya: formData.wilaya,
      commune: formData.commune || 'غير محدد',
      address: formData.address.trim() || `${formData.wilaya} - ${formData.commune || ''}`,
      city: formData.commune || formData.wilaya,
      deliveryType: formData.deliveryType,
      quantity: pkg.qty,
      price: totalPrice,
      currency: 'DZD',
      country: 'Algeria',
      productId: 'proelastic-profinish',
      productName: `PROELASTIC Profinish - ${pkg.name}`,
      notes: selectedPackage === 'large_qty' ? `طلب كمية كبيرة: ${largeQtyNotes || 'تأكيد هاتفي مطلوب'}` : `العرض: ${pkg.name}`,
      eventId,
      source: 'LandingPageProelastic - YANIS SHOP'
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
        onPurchase(totalPrice, {
          id: 'proelastic-profinish',
          name: `PROELASTIC Profinish - ${pkg.name}`,
          price: totalPrice,
          currency: 'DZD'
        }, orderPayload);

        navigate('/thank-you', {
          state: {
            orderDetails: {
              name: formData.name,
              phone: formData.phone,
              wilaya: formData.wilaya,
              commune: formData.commune,
              productName: `طلاء PROELASTIC الأصلي (${pkg.name})`,
              totalPrice: selectedPackage === 'large_qty' ? 'سعر مخصص (سنتصل بك)' : `${totalPrice} د.ج`,
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
    <div className="relative bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-blue-200">
      {/* Authentic Guarantee Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 mb-6 shadow-md border border-blue-700">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-sm">
            <Sparkles size={14} />
            المنتج الأصلي 100%
          </span>
          <span className="text-xs font-bold text-blue-200">
            ضمان YANIS SHOP منذ 3 سنوات
          </span>
        </div>
        <p className="text-xs text-blue-100 leading-relaxed">
          نحن نوفر لك علبة <strong>PROELASTIC الأصلية</strong> المعتمدة من شركة <strong>Profinish الجزائرية</strong> مباشرة، مع إمكانية فحص ومعاينة المنتج قبل الدفع.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Package Selection */}
        <div>
          <label className="block text-sm font-black text-slate-900 mb-2.5">
            1. اختر العرض المناسب لك: <span className="text-rose-600">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Offer 1: 1kg */}
            <div
              onClick={() => setSelectedPackage('1kg')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedPackage === '1kg'
                  ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">علبة 1 كلغ</span>
                <span className="text-base font-black text-blue-700">1900 د.ج</span>
              </div>
              <p className="text-xs text-slate-500">تغطي مساحة ~2 متر مربع (طبقتين)</p>
            </div>

            {/* Offer 2: 2kg + 1kg FREE (3kg) - MOST POPULAR */}
            <div
              onClick={() => setSelectedPackage('3kg_offer')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedPackage === '3kg_offer'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="absolute -top-2.5 left-4 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                الأكثر طلباً (1 كلغ مجاناً 🎁)
              </span>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">2 كلغ + 1 كلغ مجاناً</span>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-700">3800 د.ج</span>
                  <span className="text-[11px] text-slate-400 line-through mr-1.5">5700 د.ج</span>
                </div>
              </div>
              <p className="text-xs text-emerald-800 font-medium">مجموع 3 كلغ تغطي ~6 م² (وفر 1900 د.ج)</p>
            </div>

            {/* Offer 3: 5kg Bucket (Buy 3kg get 2kg FREE) - BEST VALUE */}
            <div
              onClick={() => setSelectedPackage('5kg_bucket')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedPackage === '5kg_bucket'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="absolute -top-2.5 left-4 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                أكبر توفير (2 كلغ مجاناً 🔥)
              </span>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">سطل كامل 5 كلغ</span>
                <div className="text-right">
                  <span className="text-base font-black text-indigo-700">5700 د.ج</span>
                  <span className="text-[11px] text-slate-400 line-through mr-1.5">9500 د.ج</span>
                </div>
              </div>
              <p className="text-xs text-indigo-900 font-medium">سطل 5 كلغ بسعر 3 كلغ فقط (تغطي ~10 م²)</p>
            </div>

            {/* Offer 4: Large Quantity / Projects 20kg */}
            <div
              onClick={() => setSelectedPackage('large_qty')}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedPackage === 'large_qty'
                  ? 'border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">كميات كبيرة (20 كلغ+)</span>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  سعر مخصص
                </span>
              </div>
              <p className="text-xs text-slate-500">للمشاريع والمساحات الكبيرة (اتصال وتأكيد خاص)</p>
            </div>
          </div>

          {selectedPackage === 'large_qty' && (
            <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs">
              <label className="block font-bold text-purple-950 mb-1">
                حدد الكمية أو مساحة السطح التقريبية التي تحتاجها:
              </label>
              <input
                type="text"
                placeholder="مثال: أحتاج علبة 20 كلغ لسطح مساحته 40 متر مربع..."
                value={largeQtyNotes}
                onChange={(e) => setLargeQtyNotes(e.target.value)}
                className="w-full bg-white border border-purple-300 rounded-lg p-2 text-slate-800 outline-none focus:border-purple-600"
              />
              <p className="text-[11px] text-purple-700 mt-1">
                📞 سنتصل بك هاتفياً فور تسجيل الطلب لنمنحك أفضل سعر جملة مخصص لمشروعك.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Customer Details */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <label className="block text-sm font-black text-slate-900">
            2. معلومات التوصيل:
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
                placeholder="مثال: محمد بن علي"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium"
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
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 text-left focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-bold tracking-wider"
              />
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
            {phoneError && (
              <p className="text-rose-600 text-xs font-bold mt-1 text-right">{phoneError}</p>
            )}
          </div>

          {/* Wilaya Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الولاية (58 ولاية) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.wilaya}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-3 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-bold cursor-pointer"
              >
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Commune Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البلدية <span className="text-rose-500">*</span>
              </label>
              {communeList.length > 0 ? (
                <select
                  required
                  value={formData.commune}
                  onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-3 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-bold cursor-pointer"
                >
                  <option value="">اختر البلدية</option>
                  {communeList.map((c) => (
                    <option key={c.id} value={c.name_ar}>{c.name_ar}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="اكتب اسم البلدية"
                  value={formData.commune}
                  onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-3 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
                />
              )}
            </div>
          </div>

          {/* Delivery Type Option */}
          {selectedPackage !== 'large_qty' && wilayaPrice && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نوع التوصيل:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setFormData({ ...formData, deliveryType: 'home' })}
                  className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                    formData.deliveryType === 'home'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs block">توصيل لباب المنزل</span>
                  <span className="text-sm font-black text-blue-700">{wilayaPrice.home} د.ج</span>
                </div>

                <div
                  onClick={() => setFormData({ ...formData, deliveryType: 'desk' })}
                  className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                    formData.deliveryType === 'desk'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs block">استلام من المكتب</span>
                  <span className="text-sm font-black text-blue-700">{wilayaPrice.desk} د.ج</span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              العنوان أو الحي بالتفصيل <span className="text-slate-400 font-normal">(اختياري)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="اكتب الحي أو رقم الشارع لتسهيل وصول الموزع..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-2.5 focus:border-blue-600 focus:bg-white outline-none transition-all text-sm font-medium"
              />
              <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
        </div>

        {/* Step 3: Order Summary & Pricing */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 mt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">المنتج والعرض:</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{getPackageDetails().name}</span>
          </div>

          {selectedPackage !== 'large_qty' ? (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">سعر المنتج:</span>
                <span className="font-bold text-slate-900">{productPrice} د.ج</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 font-medium">مصاريف التوصيل ({formData.wilaya}):</span>
                <span className="font-bold text-blue-700">{deliveryPrice} د.ج</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <div>
                  <span className="text-base font-black text-slate-900 block">المبلغ الإجمالي:</span>
                  <span className="text-xs text-slate-500 font-medium">الدفع نقداً عند الاستلام</span>
                </div>
                <div className="text-left">
                  <span className="text-2xl sm:text-3xl font-black text-blue-700">{totalPrice}</span>
                  <span className="text-sm font-bold text-blue-900 mr-1">د.ج</span>
                </div>
              </div>
            </>
          ) : (
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <div>
                <span className="text-base font-black text-purple-900 block">سعر خاص للمشاريع:</span>
                <span className="text-xs text-purple-700">اتصال مباشر لتأكيد التخفيض الأقصى</span>
              </div>
              <span className="text-sm font-black text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
                تأكيد هاتفي
              </span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 hover:from-blue-800 hover:to-indigo-700 text-white font-black text-base sm:text-lg py-4 px-6 rounded-2xl shadow-xl shadow-blue-700/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {selectedPackage === 'large_qty' ? (
            <>
              <PhoneCall size={20} />
              <span>{loading ? 'جاري التسجيل...' : 'أطلب الآن واستفد من سعر الجملة الخاص'}</span>
            </>
          ) : (
            <>
              <ShoppingCart size={20} />
              <span>{loading ? 'جاري إرسال الطلب...' : 'إضغط هنا لطلب PROELASTIC الأصلي'}</span>
            </>
          )}
        </button>

        {/* Security / Verification badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2 bg-slate-50 rounded-xl">
            <ShieldCheck size={18} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">معاينة قبل الدفع</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <Truck size={18} className="mx-auto text-blue-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">توصيل 58 ولاية</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <CheckCircle2 size={18} className="mx-auto text-indigo-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">المنتج الأصلي 100%</span>
          </div>
        </div>
      </form>
    </div>
  );
}
