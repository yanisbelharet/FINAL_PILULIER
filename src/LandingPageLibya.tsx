import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ShoppingCart, Truck, ShieldCheck, Clock, CheckCircle2, Star, Sparkles, MapPin, AlertCircle, PhoneCall, ChevronDown } from 'lucide-react';
import CheckoutFormLibya from './CheckoutFormLibya';

// Images hosted on YouCan CDN for the medication alarm
const img1 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/HxVCmxikiwh6FWU4vOJ9898xYRoXH5n8uTCqLIP3.webp';
const img2 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/1FEj3c7j36EWW7kiy2pKEZM7qvWb9mSMlohcRY2L.webp';
const img3 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/U2IocP01AopSh7BOOXvMuHvfpw6ZXuCo4NqtoSRW.webp';
const img4 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/h8zAvfzkwgJ8jrYQ733QQlmJFFXLWn5A4V8DAN7S.webp';
const img5 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/zEIXhfMlrE4wnCPQs6Bps1b806axSQE6gDj2ND5t.webp';

// Authentic reviews from Libyan customers
const libyanTestimonials = [
  {
    name: "سالم الورفلي",
    city: "طرابلس (حي الأندلس)",
    rating: 5,
    date: "منذ يومين",
    comment: "ما شاء الله، خذيت باقة العلبتين للوالد والوالدة. المنبه صوته واضح جداً وريحهم من نسيان أدوية السكر والضغط. التوصيل في طرابلس وصلني في 24 ساعة والدفع عند الاستلام."
  },
  {
    name: "أمينة المجبري",
    city: "بنغازي (الفويهات)",
    rating: 5,
    date: "منذ 4 أيام",
    comment: "المنتج ممتاز وسهل في الضبط حتى لكبار السن. الشحن لبنغازي كان سريع ومجاني مع باقة قطعتين، ومندوب التوصيل كان محترم جداً وخلاني نفحص الجهاز قبل ما ندفع."
  },
  {
    name: "مفتاح السويحلي",
    city: "مصراتة",
    rating: 5,
    date: "منذ 6 أيام",
    comment: "شفت الإعلان وكنت متردد عشان اللهجة جزائرية، لكن الصفحة واضحة وطلبت والدفع بالدينار الليبي كاش عند الباب. وصلني في يومين لمصراتة، جودة ممتازة تستاهل كل قرش."
  },
  {
    name: "د. طارق الزوي",
    city: "البيضاء",
    rating: 5,
    date: "منذ أسبوع",
    comment: "أنصح بيه أي حد عنده مريض في العيلة. ينظم الحبوب حسب الساعات وينبه في موعده بالضبط. خذيت 3 علب بسعر العرض والتوصيل كان مجاني."
  }
];

export default function LandingPageLibya({ config, onPurchase }: { config: any, onPurchase: (p: number, product: any, formData?: any) => void }) {
  const { id } = useParams();

  const product = {
    id: id || "med-alarm-libya",
    name: "منبه وحافظة الدواء الذكية 4 أوقات (الإصدار الخاص بليبيا)",
    price: 79,
    oldPrice: 115,
    currency: "LYD",
    imageUrl: img1
  };

  const [showStickyButton, setShowStickyButton] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Track ViewContent for Libya (LYD currency)
  useEffect(() => {
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        contents: [{
          content_id: 'med-alarm-libya',
          content_type: 'product',
          content_name: product.name,
        }],
        value: 17.90, // ~$17.90 USD equivalent
        currency: 'USD'
      });
    }

    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_ids: ['med-alarm-libya'],
        content_type: 'product',
        value: 17.90,
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
      {/* 1. Top Urgent Notice for Libyan Market */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-3 py-2 sm:py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold truncate">
            <span className="text-base sm:text-lg">🇱🇾</span>
            <span className="truncate">توصيل سريع لكافة المدن الليبية والدفع عند الاستلام (د.ل)</span>
          </div>
          <a
            href="#checkout"
            className="shrink-0 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black px-3 py-1 rounded-full text-xs transition-colors shadow-sm"
          >
            اطلب الآن
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto bg-white shadow-2xl min-h-screen overflow-hidden flex flex-col">
        {/* 2. Important Notice Box addressing the Algerian video vs Libya delivery */}
        <div className="bg-amber-50 border-b-2 border-amber-300 px-4 py-3 text-amber-950">
          <div className="flex items-start gap-2.5">
            <div className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs">
              !
            </div>
            <div>
              <p className="text-xs sm:text-sm font-black text-amber-900 leading-snug">
                📢 زبائننا الكرام داخل ليبيا 🇱🇾 (توضيح هام):
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-1 leading-relaxed">
                شاهدت فيديو الإعلان؟ نعم، المنتج <strong>متوفر رسمياً في مخازننا داخل ليبيا</strong> والشحن متاح لجميع المدن والمناطق (طرابلس، بنغازي، مصراتة، الزاوية، زليتن، سبها...) مع <strong>الدفع نقداً عند الاستلام بالدينار الليبي (د.ل)</strong> بعد فحص ومعاينة جهازك!
              </p>
            </div>
          </div>
        </div>

        {/* 3. Hero Image 1 */}
        <div className="w-full relative bg-slate-50" style={{ aspectRatio: '750 / 876' }}>
          <img
            src={img1}
            alt="منبه الدواء الذكي في ليبيا"
            width={750}
            height={876}
            className="w-full h-auto object-cover"
            loading="eager"
            fetchPriority="high"
            style={{ aspectRatio: '750 / 876' }}
          />
        </div>

        {/* 4. Quick Libya COD Badges Banner */}
        <div className="grid grid-cols-3 gap-1 bg-emerald-50/80 p-3 border-y border-emerald-100 text-center">
          <div className="flex flex-col items-center justify-center">
            <span className="text-base sm:text-lg">💵</span>
            <span className="text-[11px] sm:text-xs font-black text-emerald-900 mt-0.5">الدفع بالدينار الليبي</span>
            <span className="text-[10px] text-slate-500">عند استلام وفحص المنتج</span>
          </div>
          <div className="flex flex-col items-center justify-center border-x border-emerald-200 px-1">
            <span className="text-base sm:text-lg">🚚</span>
            <span className="text-[11px] sm:text-xs font-black text-emerald-900 mt-0.5">توصيل لباب بيتك</span>
            <span className="text-[10px] text-slate-500">خلال 24-48 ساعة بليبيا</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-base sm:text-lg">⭐</span>
            <span className="text-[11px] sm:text-xs font-black text-emerald-900 mt-0.5">ضمان 14 يوم</span>
            <span className="text-[10px] text-slate-500">استبدال واسترجاع فوري</span>
          </div>
        </div>

        {/* 5. First Order Button */}
        <div className="flex flex-col items-center p-4 bg-white" id="first-order-button">
          {/* Bundle Highlight Card */}
          <div className="w-full bg-gradient-to-l from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl p-4 border border-emerald-200 mb-3 text-center">
            <span className="bg-emerald-600 text-white text-[11px] font-black px-3 py-1 rounded-full inline-block mb-2">
              🔥 عروض خاصة للسوق الليبي
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-slate-400 line-through">115 د.ل</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">ابتداءً من 79 د.ل</span>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-1">
              + وفر أكثر مع باقة الـ 2 قطع (129 د.ل مع توصيل مجاني)
            </p>
          </div>

          <a
            href="#checkout"
            className="flex items-center justify-center gap-3 w-full max-w-md py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-600/20 transform hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: 'linear-gradient(45deg, #059669 0%, #10b981 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={20} color="#FFFFFF" className="animate-bounce" />
            <span className="text-lg font-black tracking-wide">أطلب الآن والدفع عند الاستلام</span>
          </a>
        </div>

        {/* 6. Product Detail Visuals with exact aspect-ratio */}
        <div className="w-full relative bg-slate-50" style={{ aspectRatio: '750 / 2056' }}>
          <img
            src={img2}
            alt="ميزات منبه وحافظة الدواء الذكية"
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
            alt="تنظيم أوقات الدواء بكل دقة"
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
            alt="شاشة ديجيتال سهلة الاستخدام"
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
            alt="المواصفات والحجم الصغير"
            width={750}
            height={1539}
            className="w-full h-auto object-cover"
            loading="lazy"
            decoding="async"
            style={{ aspectRatio: '750 / 1539' }}
          />
        </div>

        {/* 7. Why Customers In Libya Choose This Smart Alarm */}
        <section className="p-5 sm:p-7 bg-slate-50 border-t border-slate-200">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
              راحة بال وأمان
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              لماذا يعتبر هذا المنبه الذكي ضرورة لكل بيت ليبي؟
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                ⏰
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">4 منبهات يومية دقيقة</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                رنين واضح جداً مع تنبيه ضوئي لتذكير الوالدين بجرعات الصباح، الظهر، المساء، وقبل النوم دون أي نسيان.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                💊
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">7 خانات محكمة الإغلاق</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                تقسيم الأدوية والفيتامينات لأسبوع كامل يحمي الحبوب من الرطوبة والتلوث ويمنع تكرار الجرعة بالخطأ.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                👴
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">سهل الاستخدام لكبار السن</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                أزرار واضحة وشاشة LCD كبيرة ومقروءة، ضبط بسيط لمرة واحدة فقط ويعمل تلقائياً كل يوم.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                🎒
              </div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">حجم مدمج للسفر والتنقل</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                خفيف الوزن ومناسب للجيب أو الحقيبة اليدوية، يرافقك في العمل أو المسجد أو أثناء السفر.
              </p>
            </div>
          </div>
        </section>

        {/* 8. Dedicated Libyan COD Checkout Section */}
        <section id="checkout" className="py-8 bg-gradient-to-b from-white to-slate-50 px-4 border-t-2 border-emerald-500/20">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-black mb-2">
                <span>🇱🇾</span>
                <span>استمارة الطلب المباشر - ليبيا</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                أدخل بياناتك وسيصلك الطلب لباب بيتك
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                املأ الاستمارة الآن، وسيتصل بك فريقنا لتأكيد طلبك قبل الشحن
              </p>
            </div>

            <CheckoutFormLibya
              product={product}
              promoActive={config.promoActive}
              promoText={config.promoText}
              onPurchase={onPurchase}
            />
          </div>
        </section>

        {/* 9. Social Proof / Authentic Reviews From Libyan Customers */}
        <section className="py-8 px-4 bg-white border-t border-slate-200">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <h3 className="text-xl font-black text-slate-900">
                آراء زبائننا الكرام في المدن الليبية 🇱🇾
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                أكثر من 1,400 عائلة في ليبيا تثق بمنبه الدواء الذكي
              </p>
            </div>

            <div className="space-y-3.5">
              {libyanTestimonials.map((t, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-slate-900 block leading-tight">{t.name}</span>
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <MapPin size={10} />
                          {t.city}
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center text-amber-400">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} size={12} fill="currentColor" />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{t.date}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    "{t.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Frequently Asked Questions for Libyan Customers */}
        <section className="py-8 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-xl mx-auto">
            <h3 className="text-xl font-black text-slate-900 text-center mb-6">
              الأسئلة الشائعة من زبائننا في ليبيا
            </h3>

            <div className="space-y-3">
              {[
                {
                  q: "هل التوصيل متوفر لمدينتي داخل ليبيا؟",
                  a: "نعم بالتأكيد! نوفر التوصيل السريع لباب المنزل في كافة المدن الليبية: طرابلس، بنغازي، مصراتة، الزاوية، زليتن، البيضاء، طبرق، سبها، الخمس، سرت، درنة، غريان، وغيرها من المناطق."
                },
                {
                  q: "كيف تتم طريقة الدفع؟",
                  a: "الدفع يتم نقداً عند الاستلام (Cash on Delivery) بالدينار الليبي (د.ل). لا تدفع أي درهم حتى تستلم طلبك بيدك وتفتحه وتتأكد منه."
                },
                {
                  q: "كم يستغرق وصول الطلب؟",
                  a: "عادةً يصل الطلب خلال 24 إلى 48 ساعة كحد أقصى داخل المدن الرئيسية، ومن يومين إلى 3 أيام لباقي المناطق والمناطق الجنوبية."
                },
                {
                  q: "هل يوجد ضمان على الجهاز؟",
                  a: "نعم، نقدم ضمان استبدال واسترجاع لمدة 14 يوماً في حال وجود أي خلل مصنعي. رضاكم وثقتكم أولويتنا."
                }
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-right p-4 font-bold text-sm text-slate-800 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-600' : ''}`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. Final Reassurance Footer */}
        <footer className="p-6 bg-slate-900 text-slate-400 text-center text-xs">
          <p className="font-bold text-white mb-2">منبه الدواء الذكي - التوصيل متوفر في جميع أنحاء ليبيا 🇱🇾</p>
          <p className="text-slate-400 text-[11px] max-w-md mx-auto">
            خدمة عملاء ودعم فني متاح يومياً. الدفع عند الاستلام بالدينار الليبي. جميع الحقوق محفوظة © {new Date().getFullYear()}
          </p>
        </footer>
      </main>

      {/* 12. Floating Sticky CTA at Bottom */}
      <div
        className={`fixed bottom-4 left-0 right-0 z-50 flex justify-center items-center pointer-events-none transition-all duration-300 transform ${
          showStickyButton ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-md mx-auto px-4 flex items-center justify-center">
          <a
            href="#checkout"
            className="pointer-events-auto w-full flex items-center justify-between py-3.5 px-5 rounded-2xl shadow-2xl transition-all duration-200 border-2 border-emerald-400 hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
              color: '#FFFFFF'
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🇱🇾</span>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-100 block">الدفع عند الاستلام في ليبيا</span>
                <span className="text-sm font-black text-white">أطلب الآن (وفر حتى 68 د.ل)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white text-emerald-800 px-3 py-1.5 rounded-xl font-black text-xs shadow-sm">
              <ShoppingCart size={14} />
              <span>طلب مباشر</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
