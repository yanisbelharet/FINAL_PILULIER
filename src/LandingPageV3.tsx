import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';

const CheckoutForm = lazy(() => import('./CheckoutForm'));
const Testimonials = lazy(() => import('./Testimonials'));

// Images hébergées directement sur le CDN YouCan (plus besoin de les inclure dans le bundle)
const img1 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/HxVCmxikiwh6FWU4vOJ9898xYRoXH5n8uTCqLIP3.webp';
const img2 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/1FEj3c7j36EWW7kiy2pKEZM7qvWb9mSMlohcRY2L.webp';
const img3 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/U2IocP01AopSh7BOOXvMuHvfpw6ZXuCo4NqtoSRW.webp';
const img4 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/h8zAvfzkwgJ8jrYQ733QQlmJFFXLWn5A4V8DAN7S.webp';
const img5 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/zEIXhfMlrE4wnCPQs6Bps1b806axSQE6gDj2ND5t.webp';

export default function LandingPageV3({ config, onPurchase }: { config: any, onPurchase: (p: number, product: any, formData?: any) => void }) {
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
      const firstButton = document.getElementById('first-order-button');
      const checkoutForm = document.getElementById('checkout');
      let shouldShow = false;

      if (firstButton) {
        // Trigger earlier when the button is near the top of the viewport
        shouldShow = firstButton.getBoundingClientRect().bottom < 50;
      } else {
        shouldShow = window.scrollY > 400;
      }
      
      // Hide sticky button when the actual checkout form is visible on screen
      if (checkoutForm && shouldShow) {
        const rect = checkoutForm.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          shouldShow = false;
        }
      }
      
      setShowStickyButton(shouldShow);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    setTimeout(handleScroll, 100);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl min-h-screen overflow-hidden flex flex-col">
        {/* 1. Image 1 */}
        <img src={img1} alt="Product" className="w-full object-cover" loading="eager" fetchPriority="high" />

        {/* 2. Link Button - Scroll to Checkout */}
        <div className="flex justify-center" id="first-order-button">
          <a 
            href="#checkout" 
            className="flex items-center justify-center gap-[23px] w-[300px] m-[10px] py-[5px] px-[5px] rounded-[30px] border-4 border-solid border-[#7ED321] transition-all animate-horizontal-bounce shadow-[0_0_0_0_black]"
            style={{
              background: 'linear-gradient(45deg, #417505 0%, #7ED321 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={15} color="#FFFFFF" />
            <span style={{ fontSize: '17px', fontWeight: 'bold' }}>أطلب الآن</span>
          </a>
        </div>

        {/* 3. Images List */}
        <img src={img2} alt="Product details" className="w-full object-cover" loading="lazy" decoding="async" />
        <img src={img3} alt="Product details" className="w-full object-cover mt-2" loading="lazy" decoding="async" />
        <img src={img4} alt="Product details" className="w-full object-cover mt-2" loading="lazy" decoding="async" />
        <img src={img5} alt="Product details" className="w-full object-cover mt-2" loading="lazy" decoding="async" />

        {/* 4. Checkout Form */}
        <section id="checkout" className="py-8 bg-white px-4 border-t border-slate-100 mt-4">
          <div className="max-w-xl mx-auto">
            <Suspense fallback={<div className="p-8 text-center text-slate-500">جاري تحميل الاستمارة...</div>}>
              <CheckoutForm product={product} promoActive={config.promoActive} promoText={config.promoText} onPurchase={onPurchase} />
            </Suspense>
          </div>
        </section>

        {/* 5. Reviews */}
        <Suspense fallback={<div className="p-8 text-center text-slate-500">جاري تحميل الآراء...</div>}>
          <Testimonials />
        </Suspense>
      </div>

      {/* Sticky Bottom CTA */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: showStickyButton ? 0 : 100 }}
        className="fixed bottom-6 left-0 right-0 z-50 flex justify-center items-center pointer-events-none"
      >
        <div className="w-full max-w-2xl mx-auto flex items-center justify-center">
          <a 
            href="#checkout" 
            className="pointer-events-auto flex items-center justify-center gap-[23px] w-[300px] py-[8px] px-[5px] rounded-[30px] border-4 border-solid border-[#7ED321] transition-all animate-horizontal-bounce shadow-2xl"
            style={{
              background: 'linear-gradient(45deg, #417505 0%, #7ED321 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={18} color="#FFFFFF" />
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>أطلب الآن</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}