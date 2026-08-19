import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle2, ShieldCheck, Clock, Plane, Smartphone, Check, Star, Shield, AlertCircle, Timer, User, Phone, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WILAYAS, DELIVERY_PRICES } from './data';
import { getCommunesByWilayaId } from 'algeria-locations';
const CheckoutForm = ({ product, promoActive, promoText, onPurchase }: { product: any, promoActive?: boolean, promoText?: string, onPurchase: (p: number, product: any, formData: any) => void }) => {
  const navigate = useNavigate();
  const { price: productPrice, oldPrice: productOldPrice } = product;
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    wilaya: string;
    commune: string;
    deliveryType: 'home' | 'desk';
    quantity: number;
  }>({
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    deliveryType: 'home',
    quantity: 1,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const wilayaPrice = formData.wilaya ? DELIVERY_PRICES[formData.wilaya] : null;
  const deliveryPrice = wilayaPrice ? wilayaPrice[formData.deliveryType] : 0;
  const totalPrice = productPrice + deliveryPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const eventId = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
      const response = await fetch('/api/submitOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: totalPrice,
          productId: product.id,
          productName: product.name,
          eventId
        }),
      });
      
      if (response.ok) {
        onPurchase(productPrice, product, { ...formData, eventId });
        navigate('/thank-you', {
          state: {
            orderDetails: {
              name: formData.name,
              phone: formData.phone,
              productName: product.name,
              totalPrice: totalPrice
            }
          }
        });
      } else {
        alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative bg-[#FEFEFE] rounded-[20px] p-4 sm:p-6 shadow-sm border-[4px] border-double border-[#F5A623]">
      {promoActive && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-rose-500 text-white px-6 py-1.5 rounded-full text-sm font-black shadow-md whitespace-nowrap animate-bounce flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          {promoText || 'عرض ترويجي محدود!'}
        </div>
      )}
      
      <div className="mb-4 bg-emerald-50/50 rounded-lg p-3 border border-emerald-100 shadow-sm flex items-center justify-between">
        <span className="text-sm font-bold text-slate-600">السعر الإجمالي:</span>
        <div className="flex items-center gap-3">
          {promoActive && productOldPrice && productOldPrice > productPrice && (
            <span className="text-sm font-bold text-slate-400 line-through decoration-slate-300 decoration-2">{productOldPrice} د.ج</span>
          )}
          <span className="text-2xl font-black text-[#417505]">{productPrice} د.ج</span>
        </div>
      </div>
      
      <div className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input 
              type="text" 
              required
              placeholder="الاسم الكامل" 
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-[#1e293b] rounded-lg pr-10 pl-3 py-2.5 focus:border-[#417505] focus:ring-1 focus:ring-[#417505] outline-none transition-all text-sm font-medium shadow-sm hover:border-[#94a3b8]"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          </div>
          <div className="relative">
            <input 
              type="tel" 
              required
              dir="rtl"
              placeholder="رقم الهاتف" 
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-[#1e293b] rounded-lg pr-10 pl-3 py-2.5 text-right focus:border-[#417505] focus:ring-1 focus:ring-[#417505] outline-none transition-all text-sm font-medium shadow-sm hover:border-[#94a3b8]"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-600" size={18} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select 
              required
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-[#1e293b] rounded-lg pr-3 pl-10 py-2.5 focus:border-[#417505] focus:ring-1 focus:ring-[#417505] outline-none transition-all appearance-none text-sm font-medium shadow-sm hover:border-[#94a3b8]"
              value={formData.wilaya}
              onChange={(e) => setFormData({...formData, wilaya: e.target.value, commune: ''})}
            >
              <option value="" disabled>اختر الولاية</option>
              {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
          <div className="relative">
            <select 
              required
              className="w-full bg-[#f8fafc] border border-[#cbd5e1] text-[#1e293b] rounded-lg pr-3 pl-10 py-2.5 focus:border-[#417505] focus:ring-1 focus:ring-[#417505] outline-none transition-all appearance-none text-sm font-medium shadow-sm hover:border-[#94a3b8] disabled:opacity-50 disabled:bg-slate-100"
              value={formData.commune}
              onChange={(e) => setFormData({...formData, commune: e.target.value})}
              disabled={!formData.wilaya}
            >
              <option value="" disabled>إختر البلدية</option>
              {formData.wilaya && getCommunesByWilayaId(parseInt(formData.wilaya, 10)).map(c => (
                <option key={c.id} value={c.name_ar}>{c.name_ar}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>
        
        {formData.wilaya && wilayaPrice && (
          <div className="mt-5 space-y-3">
            <label className={`flex items-center justify-between p-4 cursor-pointer transition-all border-2 rounded-xl ${formData.deliveryType === 'home' ? 'border-[#417505] bg-emerald-50/30 shadow-sm' : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8]'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.deliveryType === 'home' ? 'border-[#417505]' : 'border-[#cbd5e1]'}`}>
                  {formData.deliveryType === 'home' && <div className="w-2.5 h-2.5 bg-[#417505] rounded-full" />}
                </div>
                <span className={`font-bold text-[15px] ${formData.deliveryType === 'home' ? 'text-[#417505]' : 'text-slate-700'}`}>التوصيل لباب المنزل</span>
              </div>
              <span className="font-black text-slate-800 text-[16px]">{wilayaPrice.home} د.ج</span>
              <input 
                  type="radio" 
                  name="deliveryType" 
                  value="home" 
                  checked={formData.deliveryType === 'home'}
                  onChange={() => setFormData({...formData, deliveryType: 'home'})}
                  className="hidden"
                />
            </label>
            
            <label className={`flex items-center justify-between p-4 cursor-pointer transition-all border-2 rounded-xl ${formData.deliveryType === 'desk' ? 'border-[#417505] bg-emerald-50/30 shadow-sm' : 'border-[#cbd5e1] bg-white hover:border-[#94a3b8]'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.deliveryType === 'desk' ? 'border-[#417505]' : 'border-[#cbd5e1]'}`}>
                  {formData.deliveryType === 'desk' && <div className="w-2.5 h-2.5 bg-[#417505] rounded-full" />}
                </div>
                <span className={`font-bold text-[15px] ${formData.deliveryType === 'desk' ? 'text-[#417505]' : 'text-slate-700'}`}>التوصيل للمكتب (Stop Desk)</span>
              </div>
              <span className="font-black text-slate-800 text-[16px]">{wilayaPrice.desk} د.ج</span>
              <input 
                  type="radio" 
                  name="deliveryType" 
                  value="desk" 
                  checked={formData.deliveryType === 'desk'}
                  onChange={() => setFormData({...formData, deliveryType: 'desk'})}
                  className="hidden"
                />
            </label>
          </div>
        )}

        {formData.wilaya && wilayaPrice && (
          <div className="bg-gradient-to-l from-emerald-50 to-white rounded-xl p-5 border border-emerald-100 mt-6 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <ShoppingCart size={16} />
              </div>
              <span className="text-xl font-bold text-slate-800">المبلغ الإجمالي:</span>
            </div>
            <span className="text-3xl font-black text-[#417505]">{totalPrice} د.ج</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#417505] to-[#7ED321] hover:from-[#7ED321] hover:to-[#417505] text-white font-bold text-[14px] py-[14px] px-6 rounded-md shadow-sm transition-all flex justify-center items-center mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري إرسال الطلب...' : 'إضغط هنا لطلب المنتج'}
        </button>
      </div>
    </form>
  );
};

export default CheckoutForm;
