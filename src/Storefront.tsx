import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Storefront({ config }: { config: any }) {
  const visibleProducts = config.products ? config.products.filter((p: any) => p.isVisible) : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">YANIS SHOP</h1>
              <p className="text-xs text-slate-500 font-medium">متجرك الموثوق للمنتجات الذكية</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
            <a href="#" className="hover:text-indigo-600 transition-colors">الرئيسية</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">منتجاتنا</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">من نحن</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">اتصل بنا</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-indigo-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black mb-6 leading-tight"
          >
            اكتشف أحدث المنتجات <br /> لحياة أسهل وأكثر ذكاءً
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-indigo-200 text-lg max-w-2xl mx-auto mb-10"
          >
            نقدم لك أفضل الحلول الذكية التي تساعدك في حياتك اليومية بأسعار تنافسية وجودة مضمونة.
          </motion.p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-2xl font-black text-slate-900">أحدث المنتجات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleProducts.map((prod: any, idx: number) => (
            <motion.div 
              key={prod.id || idx}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="relative h-64 overflow-hidden bg-slate-100">
                {config.promoActive && (
                  <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full z-10 shadow-lg shadow-rose-200">
                    تخفيض خاص
                  </div>
                )}
                <img 
                  src={prod.imageUrl || "https://images.unsplash.com/photo-1584308666744-24d5e4708705?q=80&w=800&auto=format&fit=crop"} 
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              
              <div className="p-6 flex flex-col justify-between" style={{ minHeight: '280px' }}>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <span className="text-xs text-slate-400 font-medium mr-1">(128)</span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{prod.name}</h4>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <div className="text-2xl font-black text-indigo-600">
                        {prod.price} د.ج
                      </div>
                      {config.promoActive && prod.oldPrice && (
                        <div className="text-sm text-slate-400 line-through font-medium mt-1">
                          {prod.oldPrice} د.ج
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold border border-emerald-100">
                      <Shield size={14} />
                      <span>متوفر</span>
                    </div>
                  </div>
                  
                  <Link 
                    to={prod.customPath || `/product/${prod.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
                  >
                    <span>عرض التفاصيل والطلب</span>
                    <ArrowLeft size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white mx-auto mb-6">
            <ShoppingBag size={24} />
          </div>
          <h2 className="text-xl font-black text-white mb-4">YANIS SHOP</h2>
          <p className="text-sm max-w-md mx-auto mb-8 leading-relaxed">
            نسعى دائماً لتقديم أفضل المنتجات التي تسهل حياتكم وتلبي احتياجاتكم اليومية بأعلى جودة وأفضل سعر.
          </p>
          <div className="flex justify-center gap-6 mb-8 text-sm">
            <a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a>
            <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-white transition-colors">سياسة الاسترجاع</a>
          </div>
          <p className="text-xs opacity-60">جميع الحقوق محفوظة &copy; 2024 YANIS SHOP</p>
        </div>
      </footer>
    </div>
  );
}
