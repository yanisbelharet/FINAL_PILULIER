import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function ThankYou({ config }: { config: any }) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { orderDetails: any } | null;

  useEffect(() => {
    // If no order details, redirect to home
    if (!state?.orderDetails) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state?.orderDetails) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border-t-8 border-emerald-500"
      >
        <h1 className="text-3xl font-black text-slate-800 mb-6">✅ شكراً على طلبيتك!</h1>
        <p className="text-slate-700 mb-8 text-lg font-medium">
          نحن سعداء بانضمامك إلى عائلة عملائنا 💙
        </p>
        
        <div className="bg-emerald-50 rounded-2xl p-5 mb-8 text-right border border-emerald-100">
          <h2 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            📞 ملاحظة مهمة:
          </h2>
          <p className="text-emerald-700 leading-relaxed text-sm font-medium">
            سيقوم فريقنا بالاتصال بك خلال الساعات القادمة من أجل تأكيد الطلبية.
            نرجو منك الرد على المكالمة الهاتفية حتى نتمكن من تجهيز وإرسال طلبك في أقرب وقت.
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-2xl p-6 text-right border border-slate-100">
          <h2 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">تفاصيل الطلب</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">الاسم:</span>
              <span className="font-bold text-slate-800">{state.orderDetails.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">رقم الهاتف:</span>
              <span className="font-bold text-slate-800" dir="ltr">{state.orderDetails.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">المنتج:</span>
              <span className="font-bold text-slate-800">{state.orderDetails.productName}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 mt-2">
              <span className="text-slate-500">المجموع:</span>
              <span className="font-black text-emerald-600 text-lg">{state.orderDetails.totalPrice} د.ج</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
