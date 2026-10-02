import React, { useState, useRef } from 'react';
import { ShoppingCart, ShieldCheck, Truck, User, Phone, MapPin, CheckCircle2, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CheckoutFormLibyaProps {
  product: any;
  promoActive?: boolean;
  promoText?: string;
  onPurchase: (p: number, product: any, formData: any) => void;
}

export default function CheckoutFormLibya({ product, promoActive = true, promoText, onPurchase }: CheckoutFormLibyaProps) {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  const pricePerItem = 240;

  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const totalPrice = pricePerItem * quantity;

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.length > 0 && cleaned.length < 8) {
      return 'يرجى إدخال رقم هاتف صحيح';
    }
    return '';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, phone: val });
    if (val.length >= 8) {
      setPhoneError(validatePhone(val));
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    if (!formData.name.trim()) {
      alert('يرجى إدخال الاسم');
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 8) {
      setPhoneError('يرجى إدخال رقم هاتف صحيح');
      return;
    }

    if (!formData.address.trim()) {
      alert('يرجى إدخال العنوان أو المدينة');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    const eventId = `ORDER_LY_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const orderPayload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      secondaryPhone: '',
      address: formData.address.trim(),
      city: formData.address.trim(),
      wilaya: formData.address.trim(),
      commune: formData.address.trim(),
      deliveryType: 'home',
      quantity,
      price: totalPrice,
      currency: 'LYD',
      country: 'Libya',
      productId: product?.id || 'med-alarm-libya',
      productName: product?.name || 'منبه الدواء الذكي',
      eventId,
      source: 'LandingPageLibya - Libya COD'
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
        onPurchase(totalPrice, { ...product, currency: 'LYD', price: totalPrice }, orderPayload);
        navigate('/thank-you', {
          state: {
            orderDetails: {
              name: formData.name,
              phone: formData.phone,
              city: formData.address,
              address: formData.address,
              productName: product?.name || 'منبه الدواء الذكي',
              quantity,
              totalPrice,
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
    <div className="relative bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-200">
      {/* Price & Delivery Badge Banner */}
      <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-200/60">
          <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-900 text-[11px] font-black px-2.5 py-0.5 rounded-full">
            ✨ منتج جديد وحصري في ليبيا
          </span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
            <Truck size={13} />
            التوصيل مجاني
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-0.5">السعر:</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{totalPrice} د.ل</span>
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-emerald-800 block">الدفع عند الاستلام</span>
            <span className="text-[11px] text-slate-500">معاينة قبل الدفع</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quantity Selector */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
          <span className="text-sm font-bold text-slate-700">الكمية:</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="text-lg font-bold leading-none">-</span>
            </button>
            <span className="text-lg font-black text-slate-800 w-6 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="text-lg font-bold leading-none">+</span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            الاسم بالكامل <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="الاسم الكامل"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium"
            />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          </div>
        </div>

        {/* Primary Phone Number */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            رقم الهاتف <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              dir="ltr"
              placeholder="09X XXXXXXX"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 text-left focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-bold tracking-wider"
            />
            <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          {phoneError && (
            <p className="text-rose-600 text-xs font-bold mt-1 text-right">{phoneError}</p>
          )}
        </div>

        {/* Address as simple Text Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            العنوان (المدينة والحي بالتفصيل) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="اكتب مدينتك والحي بالتفصيل..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl pr-10 pl-3 py-3 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-sm font-medium"
            />
            <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" size={17} />
          </div>
        </div>

        {/* Order Summary & Pricing Details */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 mt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">سعر المنتج:</span>
            <span className="font-bold text-slate-900">{totalPrice} د.ل</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">مصاريف التوصيل:</span>
            <span className="font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded text-xs">
              مجاناً (0 د.ل)
            </span>
          </div>

          <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
            <div>
              <span className="text-base font-black text-slate-900 block">المبلغ الإجمالي:</span>
              <span className="text-xs text-slate-500 font-medium">الدفع نقداً عند الاستلام</span>
            </div>
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600">{totalPrice}</span>
              <span className="text-sm font-bold text-emerald-800 mr-1">د.ل</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-base sm:text-lg py-4 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-4"
        >
          <ShoppingCart size={20} />
          <span>{loading ? 'جاري إرسال الطلب...' : 'إضغط هنا لطلب المنتج'}</span>
        </button>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2 bg-slate-50 rounded-xl">
            <ShieldCheck size={18} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">معاينة قبل الدفع</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <Truck size={18} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">توصيل مجاني</span>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <Gift size={18} className="mx-auto text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold text-slate-700 block">ضمان واستبدال</span>
          </div>
        </div>
      </form>
    </div>
  );
}
