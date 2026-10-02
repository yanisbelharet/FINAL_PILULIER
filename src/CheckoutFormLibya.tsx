import React, { useState, useRef } from 'react';
import { ShoppingCart, ShieldCheck, Clock, Truck, User, Phone, MapPin, ChevronDown, CheckCircle2, Gift, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LIBYA_CITIES, LIBYAN_BUNDLES, LibyanBundle } from './libyaData';

interface CheckoutFormLibyaProps {
  product: any;
  promoActive?: boolean;
  promoText?: string;
  onPurchase: (p: number, product: any, formData: any) => void;
}

export default function CheckoutFormLibya({ product, promoActive, promoText, onPurchase }: CheckoutFormLibyaProps) {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Default to the Recommended 2-pack bundle
  const [selectedBundle, setSelectedBundle] = useState<LibyanBundle>(LIBYAN_BUNDLES[1]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    secondaryPhone: '',
    city: 'طرابلس (Tripoli)',
    address: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const deliveryPrice = selectedBundle.deliveryFee;
  const totalPrice = selectedBundle.price + deliveryPrice;

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').replace(/-/g, '');
    // Libyan mobile phones typically: 091, 092, 093, 094, 095 followed by 7 digits (10 digits total)
    // or international +218 9...
    if (cleaned.length > 0 && !/^(\+?218|00218)?0?9[1-689]\d{7}$/.test(cleaned) && cleaned.length < 9) {
      return 'يرجى إدخال رقم هاتف ليبي صحيح (مثال: 0912345678)';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!formData.name.trim()) {
      alert('يرجى إدخال الاسم بالكامل');
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 8) {
      setPhoneError('يرجى إدخال رقم هاتف صحيح للتواصل');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    const eventId = `ORDER_LY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const orderPayload = {
      name: formData.name,
      phone: formData.phone,
      secondaryPhone: formData.secondaryPhone,
      city: formData.city,
      wilaya: formData.city, // For backward compatibility with admin dashboard
      commune: formData.address || formData.city,
      address: formData.address,
      deliveryType: 'home',
      quantity: selectedBundle.quantity,
      bundleId: selectedBundle.id,
      bundleTitle: selectedBundle.title,
      price: totalPrice,
      currency: 'LYD',
      country: 'Libya',
      productId: product?.id || 'med-alarm-v3',
      productName: `${product?.name || 'منبه الدواء الذكي'} (${selectedBundle.title})`,
      eventId,
      source: 'LandingPageV3 - Libya COD'
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
        onPurchase(totalPrice, { ...product, currency: 'LYD' }, orderPayload);
        navigate('/thank-you', {
          state: {
            orderDetails: {
              name: formData.name,
              phone: formData.phone,
              city: formData.city,
              address: formData.address,
              productName: `${product?.name || 'منبه الدواء الذكي'} (${selectedBundle.title})`,
              quantity: selectedBundle.quantity,
              totalPrice: totalPrice,
              currency: 'د.ل',
              country: 'Libya'
            }
          }
        });
      } else {
        isSubmittingRef.current = false;
        alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      isSubmittingRef.current = false;
      alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-3xl p-5 sm:p-7 shadow-xl border-2 border-emerald-500/20">
      {/* Top Libya Flag & COD Header Badge */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-2xl mb-6 shadow-md text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">🇱🇾</span>
          <span className="font-black text-lg sm:text-xl tracking-tight">طلب حصري للمدن والمناطق الليبية</span>
          <span className="text-2xl">🇱🇾</span>
        </div>
        <p className="text-emerald-100 text-xs sm:text-sm font-medium">
          الدفع نقداً عند الاستلام بالدينار الليبي (د.ل) بعد فحص ومعاينة المنتج لباب منزلك
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Choose Your Bundle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-black text-slate-800 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-black">1</span>
              اختر العرض المناسب لك:
            </label>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              تخفيضات موسمية
            </span>
          </div>

          <div className="space-y-3">
            {LIBYAN_BUNDLES.map((bundle) => {
              const isSelected = selectedBundle.id === bundle.id;
              return (
                <div
                  key={bundle.id}
                  onClick={() => setSelectedBundle(bundle)}
                  className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Badge */}
                  {bundle.badge && (
                    <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Sparkles size={12} />
                      {bundle.badge}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    {/* Radio & Title */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-base sm:text-lg ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {bundle.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {bundle.subtitle}
                        </p>
                        {bundle.freeDelivery ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-md mt-1">
                            <Truck size={12} />
                            توصيل مجاني لكافة مدن ليبيا
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                            + 10 د.ل فقط رسوم التوصيل
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="text-left shrink-0">
                      <div className="flex items-baseline gap-1.5 justify-end">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700">
                          {bundle.price}
                        </span>
                        <span className="text-xs font-black text-emerald-800">د.ل</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end text-xs text-slate-400 line-through">
                        <span>{bundle.oldPrice} د.ل</span>
                      </div>
                      <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded block text-center mt-1">
                        وفر {bundle.savings} د.ل
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Customer Contact & Libyan Location Details */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-black text-slate-800 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-black">2</span>
              بيانات المستلم وعنوان التوصيل:
            </label>
          </div>

          <div className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                الاسم الثلاثي أو الكامل <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد علي الفرجاني"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium"
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            {/* Libyan Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                رقم الهاتف (ليبي) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="091 234 5678"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-12 pl-3 py-3 text-left focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-bold tracking-wider"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <span className="text-base">🇱🇾</span>
                  <Phone className="text-emerald-600" size={16} />
                </div>
              </div>
              {phoneError && (
                <p className="text-rose-600 text-xs font-bold mt-1 text-right">{phoneError}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                * يدعم شبكات ليبيانا والمدار والجيل الجديد (091، 092، 094، 093، 095)
              </p>
            </div>

            {/* Secondary Phone (Optional but very useful in Libya) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                رقم هاتف إضافي أو واتساب <span className="text-slate-400 font-normal">(اختياري لتسهيل التواصل)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="092 000 0000"
                  value={formData.secondaryPhone}
                  onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-2.5 text-left focus:border-emerald-600 focus:bg-white outline-none transition-all text-sm font-medium"
                />
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            {/* City Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                المدينة / المنطقة <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-10 py-3 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none text-sm font-bold"
                >
                  {LIBYA_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" size={18} />
                <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Detailed Address / Landmark */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                العنوان بالتفصيل أو أقرب نقطة دالة <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: الحي، اسم الشارع، أو بقرب مدرسة / صيدلية / مسجد معين..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Pricing Details */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">العرض المختار:</span>
            <span className="font-bold text-slate-900">{selectedBundle.title}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">سعر المنتجات:</span>
            <span className="font-bold text-slate-900">{selectedBundle.price} د.ل</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">رسوم التوصيل لـ {formData.city.split(' ')[0]}:</span>
            {selectedBundle.freeDelivery ? (
              <span className="font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                مجاناً (0 د.ل)
              </span>
            ) : (
              <span className="font-bold text-slate-900">{selectedBundle.deliveryFee} د.ل</span>
            )}
          </div>

          {selectedBundle.savings > 0 && (
            <div className="flex justify-between items-center text-xs text-amber-700 bg-amber-50 p-2 rounded-lg font-bold">
              <span>مجموع ما وفرته في هذا الطلب:</span>
              <span>وفرت {selectedBundle.savings} د.ل 🎉</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
            <div>
              <span className="text-base font-black text-slate-900 block">المبلغ الإجمالي للدفع:</span>
              <span className="text-xs text-slate-500 font-medium">نقداً عند الاستلام بالدينار الليبي</span>
            </div>
            <div className="text-left">
              <span className="text-3xl font-black text-emerald-600">{totalPrice}</span>
              <span className="text-sm font-bold text-emerald-800 mr-1">د.ل</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-lg py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          <ShoppingCart size={22} className="animate-bounce" />
          <span>{loading ? 'جاري تسجيل طلبك...' : 'تأكيد الطلب الآن (الدفع عند الاستلام)'}</span>
        </button>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2 bg-slate-50 rounded-xl">
            <ShieldCheck size={20} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">معاينة قبل الدفع</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <Truck size={20} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">توصيل لباب بيتك</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <Gift size={20} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">ضمان استبدال 14 يوم</span>
          </div>
        </div>
      </form>
    </div>
  );
}
