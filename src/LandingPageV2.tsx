import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { CheckoutForm, Testimonials } from './LandingPage';

export default function LandingPageV2({ config, onPurchase }: { config: any, onPurchase: (p: number, product: any, formData?: any) => void }) {
  const { id } = useParams();
  const product = config.products ? config.products.find((p: any) => p.id === id) : null;
  
  if (!product) return <Navigate to="/" />;

  const [showStickyButton, setShowStickyButton] = useState(false);

  useEffect(() => {
    if (product && window.ttq) {
      window.ttq.track('ViewContent', {
        contents: [{
          content_id: product.id,
          content_type: 'product',
          content_name: product.name,
        }],
        value: product.price,
        currency: 'DZD'
      });
    }
  }, [product]);

  useEffect(() => {
    const handleScroll = () => {
      const checkoutForm = document.getElementById('checkout');
      let pastCheckout = false;

      if (checkoutForm) {
        // Show sticky button when we've scrolled PAST the checkout form
        // checkoutForm.getBoundingClientRect().bottom < window.innerHeight means the bottom of the form is visible, 
        // let's say when the bottom is above the viewport ( < 0 ) or mostly above.
        // Let's just say < 0 so it appears when the form is hidden.
        pastCheckout = checkoutForm.getBoundingClientRect().bottom < 0;
      } else {
        pastCheckout = window.scrollY > 400;
      }
      
      setShowStickyButton(pastCheckout);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setTimeout(handleScroll, 100);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl min-h-screen overflow-hidden flex flex-col">
        <img fetchPriority="high" loading="eager" src="https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/UcuCAbqBuLvphQwpgudEKiSTjNT7tkDWqG2nmVoF.webp" alt="Product" className="w-full object-cover" />

        <section id="checkout" className="py-8 bg-white px-4 border-t border-slate-100">
          <div className="max-w-xl mx-auto">
            <CheckoutForm product={product} promoActive={config.promoActive} promoText={config.promoText} onPurchase={onPurchase} />
          </div>
        </section>

        <div className="px-4 pb-8 flex justify-center">
          <a 
            href="#checkout" 
            className="w-full max-w-sm flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-[#417505] to-[#7ED321] text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            <ShoppingCart size={20} />
            أطلب الآن
          </a>
        </div>

        <img loading="lazy" src="https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/2G9Lpmj05VJfKGMUI8OFXtwK0j6KZHqkUDez5iJd.webp" alt="Product 2" className="w-full object-cover mt-2" />
        <img loading="lazy" src="https://cdn.youcan.shop/stores/defae844a0bbda3e5af90b6e7c10442b/others/K7xCrltppCNd4UVbJGSOqObap2IJ85nFDeub8El2.jpg" alt="Product 3" className="w-full object-cover mt-2" />
        <img loading="lazy" src="https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/9S9lQftX0vkGaYO3eBDEhZKZz3A7ASO4qX28iDo1.webp" alt="Product 4" className="w-full object-cover mt-2" />
        <img loading="lazy" src="https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/pZB4Jdism3G9XRZxfww4wFkEggmMA8PndiOsWMHi.webp" alt="Product 5" className="w-full object-cover mt-2" />

        <Testimonials />

        <footer className="text-center py-10 bg-slate-50 text-slate-500 font-medium border-t border-slate-100">
          <p className="mb-2">جميع الحقوق محفوظة &copy; 2024</p>
          <div className="flex justify-center gap-4 text-sm opacity-70">
            <a href="#" className="hover:text-slate-800">سياسة الخصوصية</a>
            <a href="#" className="hover:text-slate-800">شروط الاستخدام</a>
          </div>
        </footer>
      </div>

      {/* Sticky Bottom CTA */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: showStickyButton ? 0 : 100 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] z-50 flex justify-center items-center gap-4"
      >
        <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-4 px-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">سارع بالطلب</span>
            <span className="text-rose-600 font-black text-sm">تبقى 5 قطع فقط!</span>
          </div>
          <a 
            href="#checkout" 
            className="flex-1 flex items-center justify-center gap-3 py-3.5 px-6 bg-gradient-to-r from-[#417505] to-[#7ED321] text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
          >
            <ShoppingCart size={22} />
            <span>اطلب واغتنم التخفيض</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
