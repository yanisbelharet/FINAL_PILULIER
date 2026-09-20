import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingCart } from 'lucide-react';
import { CheckoutForm, Testimonials } from './LandingPage';

// Images hébergées directement sur le CDN YouCan (plus besoin de les inclure dans le bundle)
const img1 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/HxVCmxikiwh6FWU4vOJ9898xYRoXH5n8uTCqLIP3.webp';
const img2 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/1FEj3c7j36EWW7kiy2pKEZM7qvWb9mSMlohcRY2L.webp';
const img3 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/U2IocP01AopSh7BOOXvMuHvfpw6ZXuCo4NqtoSRW.webp';
const img4 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/h8zAvfzkwgJ8jrYQ733QQlmJFFXLWn5A4V8DAN7S.webp';
const img5 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/zEIXhfMlrE4wnCPQs6Bps1b806axSQE6gDj2ND5t.webp';

export default function LandingPageV4({ config, onPurchase }: { config: any, onPurchase: (p: number, product: any, formData?: any) => void }) {
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

  // Use IntersectionObserver instead of scroll listener to eliminate layout shifts
  useEffect(() => {
    const firstButton = document.getElementById('first-order-button');
    const checkoutForm = document.getElementById('checkout');

    if (!window.IntersectionObserver) {
      const handleScroll = () => {
        setShowStickyButton(window.scrollY > 400);
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }

    let isButtonPassed = false;
    let isCheckoutVisible = false;

    const updateState = () => {
      setShowStickyButton(isButtonPassed && !isCheckoutVisible);
    };

    const buttonObserver = new IntersectionObserver(
      ([entry]) => {
        isButtonPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        updateState();
      },
      { threshold: 0 }
    );

    const checkoutObserver = new IntersectionObserver(
      ([entry]) => {
        isCheckoutVisible = entry.isIntersecting;
        updateState();
      },
      { threshold: 0.05 }
    );

    if (firstButton) buttonObserver.observe(firstButton);
    if (checkoutForm) checkoutObserver.observe(checkoutForm);

    return () => {
      buttonObserver.disconnect();
      checkoutObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white shadow-2xl min-h-screen overflow-hidden flex flex-col">
        {/* 1. Image 1 */}
        <div className="w-full relative bg-slate-50" style={{ aspectRatio: '750 / 876' }}>
          <img 
            src={img1} 
            alt="Product" 
            width={750} 
            height={876} 
            className="w-full h-auto object-cover" 
            loading="eager" 
            fetchPriority="high" 
            style={{ aspectRatio: '750 / 876' }}
          />
        </div>

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
        <div className="w-full relative bg-slate-50" style={{ aspectRatio: '750 / 2056' }}>
          <img 
            src={img2} 
            alt="Product details" 
            width={750} 
            height={2056} 
            className="w-full h-auto object-cover" 
            loading="lazy" 
            decoding="async" 
            style={{ aspectRatio: '750 / 2056' }}
          />
        </div>

        <div className="w-full relative bg-slate-50 mt-2" style={{ aspectRatio: '750 / 629' }}>
          <img 
            src={img3} 
            alt="Product details" 
            width={750} 
            height={629} 
            className="w-full h-auto object-cover" 
            loading="lazy" 
            decoding="async" 
            style={{ aspectRatio: '750 / 629' }}
          />
        </div>

        <div className="w-full relative bg-slate-50 mt-2" style={{ aspectRatio: '750 / 813' }}>
          <img 
            src={img4} 
            alt="Product details" 
            width={750} 
            height={813} 
            className="w-full h-auto object-cover" 
            loading="lazy" 
            decoding="async" 
            style={{ aspectRatio: '750 / 813' }}
          />
        </div>

        <div className="w-full relative bg-slate-50 mt-2" style={{ aspectRatio: '750 / 1539' }}>
          <img 
            src={img5} 
            alt="Product details" 
            width={750} 
            height={1539} 
            className="w-full h-auto object-cover" 
            loading="lazy" 
            decoding="async" 
            style={{ aspectRatio: '750 / 1539' }}
          />
        </div>

        {/* 4. Checkout Form */}
        <section id="checkout" className="py-8 bg-white px-4 border-t border-slate-100 mt-4">
          <div className="max-w-xl mx-auto">
            <CheckoutForm product={product} promoActive={config.promoActive} promoText={config.promoText} onPurchase={onPurchase} />
          </div>
        </section>

        {/* 5. Reviews */}
        <Testimonials />
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