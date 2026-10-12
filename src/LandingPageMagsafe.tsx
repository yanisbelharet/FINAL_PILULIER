import React, { useState, useEffect } from 'react';
import { ShoppingCart, ShieldCheck, Truck, Sparkles, Smartphone, CheckCircle2, RotateCw, Magnet, Layers, Video, Dumbbell, Award, Star, ChevronDown, Check } from 'lucide-react';
import CheckoutFormMagsafe from './CheckoutFormMagsafe';

const imgHero = '/images/magsafe_hero_stand.jpg';
const imgGym = '/images/magsafe_magnetic_gym.jpg';
const imgGrip = '/images/magsafe_hand_grip.jpg';
const imgDetail = '/images/magsafe_colors_detail.jpg';

interface LandingPageMagsafeProps {
  onPurchase: (price: number, product: any, formData: any) => void;
}

export default function LandingPageMagsafe({ onPurchase }: LandingPageMagsafeProps) {
  const [showStickyButton, setShowStickyButton] = useState(false);

  // Track ViewContent event
  useEffect(() => {
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        contents: [{
          content_id: 'magsafe-ring-stand',
          content_type: 'product',
          content_name: 'حامل ومقبض MagSafe المغناطيسي المزدوج 360° للآيفون',
        }],
        value: 22.0,
        currency: 'USD'
      });
    }

    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'حامل ومقبض MagSafe المغناطيسي المزدوج 360° للآيفون',
        content_ids: ['magsafe-ring-stand'],
        content_type: 'product',
        value: 22.0,
        currency: 'USD'
      });
    }
  }, []);

  // Sticky CTA button observer
  useEffect(() => {
    const handleScroll = () => {
      const checkoutEl = document.getElementById('checkout');
      if (checkoutEl) {
        const rect = checkoutEl.getBoundingClientRect();
        setShowStickyButton(window.scrollY > 400 && rect.top > window.innerHeight);
      } else {
        setShowStickyButton(window.scrollY > 400);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 font-sans text-slate-100" dir="rtl">
      {/* Top Luxury Announcement Bar */}
      <div className="bg-gradient-to-r from-zinc-900 via-neutral-900 to-black text-slate-200 text-xs sm:text-sm py-2.5 px-4 text-center font-bold flex items-center justify-center gap-2 border-b border-zinc-800 shadow-md">
        <span className="bg-amber-400 text-black text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
          حصري في الجزائر
        </span>
        <span className="text-zinc-300">
          إصدار بريميوم فاخر مخصص لأجهزة <strong className="text-white">iPhone MagSafe</strong> | توصيل سريع لـ 58 ولاية مع المعاينة قبل الدفع
        </span>
      </div>

      <main className="max-w-2xl mx-auto bg-slate-900 shadow-2xl min-h-screen overflow-hidden flex flex-col border-x border-zinc-800">
        {/* Apple-Style Minimalist Luxury Header */}
        <div className="pt-6 pb-4 px-5 text-center bg-gradient-to-b from-black to-slate-900 border-b border-zinc-800/80">
          <div className="inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 text-zinc-300 px-3.5 py-1 rounded-full text-xs font-bold mb-3 shadow-inner">
            <Sparkles size={14} className="text-amber-400" />
            <span>التصميم المعدني الأحدث لعام 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 tracking-tight">
            حامل ومقبض الهاتف المغناطيسي المزدوج <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-zinc-200 to-zinc-400">
              360° Dual-Sided MagSafe Stand
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            مقبض أصبع مريح، ستاند مكتبي دوّار 360°، ومغناطيس خارق يلتصق على الآيفون وعلى أي سطح معدني (الجيم، المطبخ، والسيارة)!
          </p>
        </div>

        {/* 1. Hero Product Image */}
        <div className="w-full relative bg-zinc-950 border-b border-zinc-800">
          <img
            src={imgHero}
            alt="حامل ومقبض MagSafe المغناطيسي المزدوج للآيفون"
            width={768}
            height={768}
            className="w-full h-auto object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-zinc-700 shadow-lg">
            <Award size={13} className="text-amber-400" />
            <span>سبائك ألومنيوم طيران CNC + مغناطيس N52</span>
          </div>
        </div>

        {/* 2. Top Order CTA & Price Pill */}
        <div className="flex flex-col items-center my-5 px-4">
          <div className="flex items-center gap-3 mb-3 bg-zinc-800/80 border border-zinc-700 px-4 py-2 rounded-2xl shadow-inner">
            <div className="text-right">
              <span className="text-xs text-zinc-400 block font-medium">السعر الترويجي الخاص:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-400">2900 د.ج</span>
                <span className="text-sm text-zinc-500 line-through">4500 د.ج</span>
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-700"></div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
              توفير 1600 د.ج
            </span>
          </div>

          <a
            href="#checkout"
            className="flex items-center justify-center gap-3 w-[310px] py-3.5 px-5 rounded-full border-2 border-solid border-amber-400/80 transition-all shadow-xl hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000000'
            }}
          >
            <ShoppingCart size={20} color="#000000" />
            <span className="text-[18px] font-black tracking-tight">أطلب الآن (الدفع عند الاستلام)</span>
          </a>
          <span className="text-[11px] text-zinc-400 mt-2 font-medium">⚡ الكمية محدودة جداً لهذا الإصدار</span>
        </div>

        {/* 3. The 3-in-1 Superpower Features */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-y border-zinc-800 space-y-4">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              لماذا يحتاجه كل مستخدم آيفون؟
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white">
              3 أجهزة ذكية في إكسسوار فاخر واحد
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Feature 1 */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 border border-amber-500/20">
                <Magnet size={22} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1">مغناطيس مزدوج الوجهين (Dual-Sided N52)</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  الوجه الداخلي يلتصق بآيفونك عبر MagSafe دون ترك أي بقايا أو غراء. والوجه الخارجي يلتصق <strong>بأي سطح معدني</strong> (حديد أجهزة الجيم، ثلاجة المطبخ، حوامل السيارة، الرفوف المعدنية)!
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 border border-blue-500/20">
                <RotateCw size={22} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1">ستاند مكتبي حر 360° مع مفصلة مزدوجة</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  اضبط زاوية الرؤية بدقة متناهية. يعمل كستاند عمودي (Portrait) لمكالمات الفيديو وTikTok وReels، أو أفقي (Landscape) لمشاهدة الأفلام واليوتيوب بثبات كامل.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 border border-emerald-500/20">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1">مقبض إصبع مريح مانع للسقوط (Anti-Drop)</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  تصفح واكتب الرسائل والتقط السيلفي بيد واحدة حتى على شاشات Pro Max الكبيرة دون أي خوف من انزلاق الهاتف أو سقوطه على الأرض.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Lifestyle Demonstration: Hands-Free at the Gym & Kitchen */}
        <div className="p-5 sm:p-6 bg-black border-b border-zinc-800">
          <div className="text-center mb-4">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">
              تصوير ومتابعة بدون حامل ثلاثي
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              ثبت آيفونك على أي حديد في الجيم أو المطبخ فوراً!
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              بفضل المغناطيس الخارجي المدمج، لن تحتاج لوضع هاتفك على الأرض أو البحث عن مسند. ثبته على عمود الجيم وسجل تمارينك أو تابع المؤقت بسهولة!
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative">
            <img
              src={imgGym}
              alt="تثبيت الآيفون مغناطيسياً في الجيم بدون حامل"
              width={768}
              height={768}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 text-white text-xs">
              <span className="font-bold text-amber-400 block mb-0.5">ثبات مغناطيسي جبار:</span>
              <span className="text-zinc-300">يلتصق بقوة دون اهتزاز حتى عند لمس الشاشة وتغيير المقاطع.</span>
            </div>
          </div>
        </div>

        {/* 5. One-Hand Grip Demonstration */}
        <div className="p-5 sm:p-6 bg-zinc-900 border-b border-zinc-800">
          <div className="text-center mb-4">
            <h3 className="text-base sm:text-lg font-black text-white">
              راحة مطلقة وتحكم سلس بيد واحدة
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              حلقة ناعمة الحواف مريحة للإصبع تمنع إجهاد اليد أثناء الاستخدام الطويل
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
            <img
              src={imgGrip}
              alt="إمساك الآيفون بيد واحدة بأمان تام مع مقبض MagSafe"
              width={768}
              height={768}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>

        {/* 6. Precision Craftsmanship & Luxury Finishes */}
        <div className="p-5 sm:p-6 bg-black border-b border-zinc-800">
          <div className="text-center mb-4">
            <span className="text-zinc-400 font-bold text-xs uppercase tracking-wider block mb-1">
              تصنيع فائق الدقة
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              ألوان وتفاصيل تليق بفخامة الآيفون
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              متوفر باللونين الأكثر طلباً: <strong>رمادي تيتانيوم (Titanium Grey)</strong> و <strong>فضي ميتاليك (Silver)</strong>
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 mb-4">
            <img
              src={imgDetail}
              alt="تفاصيل حامل ومقبض MagSafe المعدني بالألوان الفاخرة"
              width={768}
              height={768}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center text-xs">
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <span className="font-bold text-white block mb-0.5">سماكة فائقة النحافة</span>
              <span className="text-zinc-400">ينطوي مسطحاً ولا يعيق وضع الهاتف في الجيب</span>
            </div>
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <span className="font-bold text-white block mb-0.5">سهل الفك والتركيب</span>
              <span className="text-zinc-400">ينفصل في ثانية واحدة عند الرغبة في الشحن اللاسلكي</span>
            </div>
          </div>
        </div>

        {/* 7. iPhone Compatibility Guide */}
        <div className="p-5 sm:p-6 bg-zinc-900/80 border-b border-zinc-800">
          <div className="text-center mb-4">
            <Smartphone size={24} className="mx-auto text-blue-400 mb-1" />
            <h3 className="text-base sm:text-lg font-black text-white">
              توافق شامل مع جميع هواتف الآيفون
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="font-bold text-white">iPhone 16 / 15 / 14 / 13 / 12 (Pro, Max, Plus)</span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold text-[11px]">
                تثبيت MagSafe مباشر 100%
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="font-bold text-white">الكفرات وحافظات الحماية (MagSafe Cases)</span>
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold text-[11px]">
                متوافق تماماً
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
              <span className="font-bold text-white">أي هاتف أو كفر عادي آخر</span>
              <span className="bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-bold text-[11px]">
                حلقة مغناطيسية مهداة مجاناً 🎁
              </span>
            </div>
          </div>
        </div>

        {/* 8. Customer Reviews */}
        <div className="p-5 sm:p-6 bg-black border-b border-zinc-800">
          <div className="text-center mb-4">
            <div className="flex justify-center gap-1 text-amber-400 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <h3 className="text-base font-black text-white">
              تقييمات وتجارب المشترين في الجزائر
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-white">أمين ك. (الجزائر العاصمة) — iPhone 15 Pro</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded">مشتري مؤكد</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                "جودة الألومنيوم والمغناطيس خيالية! يلتصق في التيليفون بقوة كبيرة وما يطيحش، وزيد نلصقو في ماشينات الجيم باه نتفرج التمارين. أفضل أكسسوار شريتو للآيفون."
              </p>
            </div>

            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-white">إسلام م. (وهران) — iPhone 16 Pro Max</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded">مشتري مؤكد</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                "الـ Pro Max كبير وثقيل في اليد، هذا الستاند حل المشكل نهائياً. نحط صبعي فيه ونكتب بلا خوف، والستاند 360 درجة نخدم بيه في البيرو. شكراً على سرعة التوصيل."
              </p>
            </div>
          </div>
        </div>

        {/* 9. Checkout Form Section */}
        <section id="checkout" className="py-8 bg-zinc-950 px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <span className="bg-amber-400 text-black text-xs font-black px-3.5 py-1 rounded-full shadow-xs">
                استمارة الحجز والطلب المباشر
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2 mb-1">
                أطلب حامل MagSafe الفاخر الآن
              </h2>
              <p className="text-xs text-zinc-400">
                املأ معلوماتك أدناه وسيصلك الموزع حتى باب منزلك مع الدفع عند الاستلام
              </p>
            </div>

            <CheckoutFormMagsafe onPurchase={onPurchase} />
          </div>
        </section>
      </main>

      {/* Sticky Bottom CTA */}
      <div
        className={`fixed bottom-6 left-0 right-0 z-50 flex justify-center items-center pointer-events-none transition-all duration-300 transform ${
          showStickyButton ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-2xl mx-auto flex items-center justify-center px-4">
          <a
            href="#checkout"
            className="pointer-events-auto flex items-center justify-center gap-3 w-full max-w-[320px] py-3.5 px-5 rounded-full border-2 border-solid border-amber-400 transition-all shadow-2xl hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000000'
            }}
          >
            <ShoppingCart size={20} color="#000000" />
            <span className="text-[18px] font-black tracking-tight">أطلب حامل MagSafe الآن (2900 دج)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
