import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ShoppingCart, Truck, ShieldCheck } from 'lucide-react';
import CheckoutFormLibya from './CheckoutFormLibya';

// Images hébergées sur le CDN YouCan
const img1 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/HxVCmxikiwh6FWU4vOJ9898xYRoXH5n8uTCqLIP3.webp';
const img2 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/1FEj3c7j36EWW7kiy2pKEZM7qvWb9mSMlohcRY2L.webp';
const img3 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/U2IocP01AopSh7BOOXvMuHvfpw6ZXuCo4NqtoSRW.webp';
const img4 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/h8zAvfzkwgJ8jrYQ733QQlmJFFXLWn5A4V8DAN7S.webp';
const img5 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/zEIXhfMlrE4wnCPQs6Bps1b806axSQE6gDj2ND5t.webp';

export default function LandingPageLibya({ config, onPurchase }: { config: any, onPurchase: (p: number, product: any, formData?: any) => void }) {
  const { id } = useParams();

  const product = {
    id: id || "med-alarm-libya",
    name: "منبه وحافظة الدواء الذكية 4 أوقات",
    price: 240,
    oldPrice: 320,
    currency: "LYD",
    imageUrl: img1
  };

  const [showStickyButton, setShowStickyButton] = useState(false);

  // Track ViewContent for Libya (USD equivalent with 9.73 LYD / 1 USD)
  useEffect(() => {
    const usdValue = Number((240 / 9.73).toFixed(2)); // ~24.67 USD
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        contents: [{
          content_id: 'med-alarm-libya',
          content_type: 'product',
          content_name: product.name,
        }],
        value: usdValue,
        currency: 'USD'
      });
    }

    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_ids: ['med-alarm-libya'],
        content_type: 'product',
        value: usdValue,
        currency: 'USD'
      });
    }
  }, [product]);

  // Observer for sticky button
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
      {/* Top Banner */}
      <div className="bg-emerald-700 text-white text-xs sm:text-sm py-2 px-4 text-center font-bold flex items-center justify-center gap-2">
        <span className="bg-amber-400 text-slate-900 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full">جديد وحصري</span>
        <span>متوفر لأول مرة في ليبيا | توصيل سريع مجاني والدفع عند الاستلام</span>
      </div>

      <main className="max-w-2xl mx-auto bg-white shadow-xl min-h-screen overflow-hidden flex flex-col">
        {/* 1. Image 1 (LCP Hero) */}
        <div className="w-full relative bg-slate-50" style={{ aspectRatio: '750 / 876' }}>
          <img
            src={img1}
            alt="منبه الدواء الذكي"
            width={750}
            height={876}
            className="w-full h-auto object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            style={{ aspectRatio: '750 / 876' }}
          />
        </div>

        {/* 2. Order CTA Button & Exclusive Badge */}
        <div className="flex flex-col items-center my-3 px-4" id="first-order-button">
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-sm">
            <span>✨</span>
            <span>منتج جديد وحصري متوفر لأول مرة في ليبيا</span>
          </div>

          <a
            href="#checkout"
            className="flex items-center justify-center gap-3 w-[300px] py-2.5 px-4 rounded-full border-4 border-solid border-[#7ED321] transition-all animate-horizontal-bounce shadow-md"
            style={{
              background: 'linear-gradient(45deg, #417505 0%, #7ED321 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={17} color="#FFFFFF" />
            <span className="text-[17px] font-bold">أطلب الآن</span>
          </a>
        </div>

        {/* 3. Product Details Images (Lazy loaded with content-visibility for ultra-fast rendering) */}
        <div className="w-full relative bg-slate-50" style={{ aspectRatio: '750 / 2056', contentVisibility: 'auto', containIntrinsicSize: '750px 2056px' }}>
          <img
            src={img2}
            alt="مواصفات منبه الدواء الذكي"
            width={750}
            height={2056}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            style={{ aspectRatio: '750 / 2056' }}
          />
        </div>

        <div className="w-full relative bg-slate-50 mt-2" style={{ aspectRatio: '750 / 629', contentVisibility: 'auto', containIntrinsicSize: '750px 629px' }}>
          <img
            src={img3}
            alt="ميزات منبه الدواء الذكي"
            width={750}
            height={629}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            style={{ aspectRatio: '750 / 629' }}
          />
        </div>

        <div className="w-full relative bg-slate-50 mt-2" style={{ aspectRatio: '750 / 813', contentVisibility: 'auto', containIntrinsicSize: '750px 813px' }}>
          <img
            src={img4}
            alt="سهولة الاستخدام"
            width={750}
            height={813}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            style={{ aspectRatio: '750 / 813' }}
          />
        </div>

        <div className="w-full relative bg-slate-50 mt-2" style={{ aspectRatio: '750 / 1539', contentVisibility: 'auto', containIntrinsicSize: '750px 1539px' }}>
          <img
            src={img5}
            alt="تفاصيل المنتج"
            width={750}
            height={1539}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            style={{ aspectRatio: '750 / 1539' }}
          />
        </div>

        {/* 4. Checkout Form */}
        <section id="checkout" className="py-8 bg-white px-4 border-t border-slate-100 mt-4">
          <div className="max-w-xl mx-auto">
            <CheckoutFormLibya
              product={product}
              promoActive={config.promoActive}
              promoText={config.promoText}
              onPurchase={onPurchase}
            />
          </div>
        </section>
      </main>

      {/* Sticky Bottom CTA */}
      <div
        className={`fixed bottom-6 left-0 right-0 z-50 flex justify-center items-center pointer-events-none transition-all duration-300 transform ${
          showStickyButton ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-2xl mx-auto flex items-center justify-center">
          <a
            href="#checkout"
            className="pointer-events-auto flex items-center justify-center gap-3 w-[300px] py-2.5 px-4 rounded-full border-4 border-solid border-[#7ED321] transition-all animate-horizontal-bounce shadow-2xl"
            style={{
              background: 'linear-gradient(45deg, #417505 0%, #7ED321 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={18} color="#FFFFFF" />
            <span className="text-[18px] font-bold">أطلب الآن</span>
          </a>
        </div>
      </div>
    </div>
  );
}
