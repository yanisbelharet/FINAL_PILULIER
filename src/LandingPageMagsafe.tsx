import React, { useState, useEffect } from 'react';
import { ShoppingCart, ShieldCheck, Truck, Sparkles, Smartphone, CheckCircle2, RotateCw, Magnet, Layers, Video, Dumbbell, Award, Star, Heart, Check, ArrowDown, ChevronRight, HelpCircle } from 'lucide-react';
import CheckoutFormMagsafe from './CheckoutFormMagsafe';

const galleryImages = [
  {
    src: '/images/magsafe_hero.jpg',
    title: 'المظهر الرئيسي الفاخر',
    desc: 'تصميم معدني رفيع ومزدوج المغناطيس متوافق كلياً مع iPhone MagSafe'
  },
  {
    src: '/images/magsafe_gym_metal.jpg',
    title: 'مغناطيس مزدوج للأسطح المعدنية',
    desc: 'يثبت فورياً على معدات الجيم، ثلاجة المطبخ، والسيارة بدون أي حامل إضافي'
  },
  {
    src: '/images/magsafe_angles_stand.jpg',
    title: 'دوران 360° وطي متعدد الزوايا',
    desc: 'ستاند أفقي للمشاهدة ورأسي لمكالمات الفيديو والتيك توك بثبات فائق'
  },
  {
    src: '/images/magsafe_finger_grip.jpg',
    title: 'حلقة مسكة يد آمنة مانعة للسقوط',
    desc: 'تحكم سهل بيد واحدة والتقاط صور السيلفي بأمان تام'
  },
  {
    src: '/images/magsafe_ultrathin.jpg',
    title: 'فائق النحافة وخفيف الوزن',
    desc: 'ينطوي بشكل مسطح تماماً على ظهر الهاتف ليدخل الجيب بسلاسة'
  },
  {
    src: '/images/magsafe_gallery_1.jpg',
    title: 'تفاصيل الخامات والمتانة',
    desc: 'سبائك ألومنيوم وزنك فاخرة ومفاصل ميكانيكية متينة تدوم طويلاً'
  }
];

interface LandingPageMagsafeProps {
  onPurchase: (price: number, product: any, formData: any) => void;
}

export default function LandingPageMagsafe({ onPurchase }: LandingPageMagsafeProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
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
        <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
          الإصدار الفاخر المزدوج 2026
        </span>
        <span className="text-zinc-300">
          مخصص لأجهزة <strong className="text-white">iPhone MagSafe</strong> | توصيل سريع لـ 58 ولاية مع المعاينة قبل الدفع
        </span>
      </div>

      <main className="max-w-2xl mx-auto bg-slate-900 shadow-2xl min-h-screen overflow-hidden flex flex-col border-x border-zinc-800">
        {/* Header Section */}
        <div className="pt-6 pb-4 px-5 text-center bg-gradient-to-b from-black via-zinc-950 to-slate-900 border-b border-zinc-800">
          <div className="inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold mb-3 shadow-inner">
            <Sparkles size={14} className="text-amber-400" />
            <span>حامل ومقبض مغناطيسي مزدوج فائق النحافة 360°</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 tracking-tight">
            حامل ومقبض MagSafe المغناطيسي المزدوج <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
              دوران 360° وتثبيت فوري على أسطح المعادن
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            مغناطيس مزدوج الوجهين N52 قوي، مسكة يد آمنة للأصبع، ستاند مكتبي أفقي ورأسي، وتصميم معدني فائق النحافة يطوى بشكل مسطح تماماً!
          </p>
        </div>

        {/* 1. Main Interactive Image Gallery */}
        <div className="w-full relative bg-zinc-950 border-b border-zinc-800">
          <div className="relative aspect-square max-h-[500px] w-full overflow-hidden bg-black flex items-center justify-center">
            <img
              src={galleryImages[activeImageIndex].src}
              alt={galleryImages[activeImageIndex].title}
              width={800}
              height={800}
              className="w-full h-full object-contain transition-all duration-300"
              loading="eager"
              fetchPriority="high"
            />
            <div className="absolute bottom-3 right-3 left-3 bg-black/80 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-between border border-zinc-700/80 shadow-lg">
              <span className="font-bold text-amber-300">{galleryImages[activeImageIndex].title}</span>
              <span className="text-[11px] text-zinc-400">{activeImageIndex + 1} / {galleryImages.length}</span>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="p-3 bg-zinc-950 border-t border-zinc-850 flex gap-2 overflow-x-auto scrollbar-thin">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20 scale-105'
                    : 'border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-700'
                }`}
              >
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 2. Top Order CTA & Price Pill */}
        <div className="flex flex-col items-center my-5 px-4">
          <div className="flex items-center gap-3 mb-3 bg-zinc-800/90 border border-zinc-700 px-4 py-2.5 rounded-2xl shadow-inner">
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
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            <span className="text-[18px] font-black tracking-tight">أطلب الآن (الدفع عند الاستلام)</span>
          </a>
          <span className="text-[11px] text-zinc-400 mt-2 font-medium">⚡ المعاينة قبل الدفع متوفرة مع شحن لـ 58 ولاية</span>
        </div>

        {/* 3. The 4 Core Real Product Features */}
        <div className="p-5 sm:p-6 bg-zinc-900/90 border-y border-zinc-800 space-y-4">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              المواصفات الحقيقية للمنتج
            </span>
            <h3 className="text-lg sm:text-xl font-black text-white">
              لماذا يُعد هذا الحامل الإكسسوار الأفضل لهاتفك الآيفون؟
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {/* Feature 1: Double Sided Magnetic */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 border border-amber-500/20">
                <Magnet size={24} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1 flex items-center gap-2">
                  <span>مغناطيس مزدوج الوجهين N52 فائق القوة</span>
                  <span className="text-[10px] font-bold bg-amber-950 text-amber-400 px-2 py-0.5 rounded-full">Dual Magnetic</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  الوجه الأول يلتصق بقوة هائلة على ظهر الآيفون وحافظات MagSafe، والوجه الآخر يلتصق فوراً <strong>بأي سطح معدني أو حديدي</strong>: مثل حديد أجهزة الجيم لتسجيل تمارينك، ثلاجة المطبخ أثناء الطبخ، والسيارة بدون الحاجة لحامل إضافي!
                </p>
              </div>
            </div>

            {/* Feature 2: 360 Rotation and 180 Flip */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 border border-blue-500/20">
                <RotateCw size={24} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1 flex items-center gap-2">
                  <span>دوران حر 360° وطي بمحورين 180°</span>
                  <span className="text-[10px] font-bold bg-blue-950 text-blue-400 px-2 py-0.5 rounded-full">360° Stand</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  يتحول بثوانٍ إلى ستاند مكتبي فائق الثبات؛ يدعم الوضع الأفقي (Landscape) لمشاهدة الأفلام واليوتيوب، والوضع الرأسي (Portrait) لمكالمات FaceTime وبثوث تيك توك وزووم.
                </p>
              </div>
            </div>

            {/* Feature 3: Finger Ring Grip */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 border border-emerald-500/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1 flex items-center gap-2">
                  <span>حلقة إصبع أمان مضادة للسقوط والانزلاق</span>
                  <span className="text-[10px] font-bold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full">Anti-Drop</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  احمِ هاتفك من السقوط العفوي المكلف! توفر حلقة الإصبع قبضة مريحة ومحكمة تمكنك من استعمال شاشة الهاتف بيد واحدة والتقاط السيلفي والتنقل بكل ثقة وراحة.
                </p>
              </div>
            </div>

            {/* Feature 4: Ultra Thin Sleek Profile */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3.5">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 border border-purple-500/20">
                <Layers size={24} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm mb-1 flex items-center gap-2">
                  <span>تصميم فائق النحافة (Ultra-Thin) وخفيف الوزن</span>
                  <span className="text-[10px] font-bold bg-purple-950 text-purple-400 px-2 py-0.5 rounded-full">Pocket-Friendly</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ينطوي بشكل مسطح تماماً على ظهر الهاتف بسماكة مليمترات قليلة، مما يجعله مريحاً للغاية في الجيب دون أي بروز مزعج أو زيادة في الوزن.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Showcase: Real Gym & Metal Adsorption */}
        <div className="p-5 sm:p-6 bg-black border-b border-zinc-800">
          <div className="text-center mb-4">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">
              حرية كاملة بدون أي حامل
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              ثبّت هاتفك على أي سطح معدني في ثانية واحدة
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              سواء في الجيم لمتابعة تمارينك وتصوير مقاطعك، أو في المطبخ لمشاهدة وصفات الطبخ، أو أثناء الصيانة والعمل.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative">
            <img
              src="/images/magsafe_gym_metal.jpg"
              alt="تثبيت حامل MagSafe المزدوج على الأسطح المعدنية ومعدات الجيم"
              width={800}
              height={800}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* 5. Showcase: Multi-Angle Stand */}
        <div className="p-5 sm:p-6 bg-zinc-900 border-b border-zinc-800">
          <div className="text-center mb-4">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider block mb-1">
              زوايا مشاهدة مرنة
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              ستاند مكتبي أفقي ورأسي بمفصلات متينة ومحكمة
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              مفاصل معدنية ميكانيكية قوية تم اختبارها لأكثر من 5000 طية لضمان ثبات الهاتف على المكتب دون أن ينزلق أو يسقط.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 relative">
            <img
              src="/images/magsafe_angles_stand.jpg"
              alt="ستاند آيفون MagSafe متعدد الزوايا أفقي ورأسي"
              width={800}
              height={800}
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* 6. Showcase: Finger Grip & Ultra Thin */}
        <div className="p-5 sm:p-6 bg-black border-b border-zinc-800">
          <div className="text-center mb-4">
            <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-1">
              أمان فائق وأناقة متناهية
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              قبضة يد مريحة ونحافة استثنائية في الجيب
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              حلقة يد مصممة بعناية فائقة لتريح أصابعك وتمنع أي انزلاق، مع إمكانية طيها بشكل مسطح بالكامل.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-zinc-800">
              <img
                src="/images/magsafe_finger_grip.jpg"
                alt="مسكة يد آمنة للأصبع للآيفون"
                width={500}
                height={500}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="p-3 bg-zinc-950 text-center text-xs font-bold text-zinc-300">
                حلقة مسكة يد آمنة وسهلة
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-xl border border-zinc-800">
              <img
                src="/images/magsafe_ultrathin.jpg"
                alt="تصميم فائق النحافة لحامل الماج سيف"
                width={500}
                height={500}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="p-3 bg-zinc-950 text-center text-xs font-bold text-zinc-300">
                سمك رفيع جداً يطوى مسطحاً تماماً
              </div>
            </div>
          </div>
        </div>

        {/* 7. Comparison Table: Original vs Cheap Plastic Rings */}
        <div className="p-5 sm:p-6 bg-zinc-950 border-b border-zinc-800">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              مقارنة الجودة
            </span>
            <h3 className="text-lg font-black text-white">
              الفرق بين الحامل الأصلي المزدوج والحلقات العادية الرخيصة
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800 shadow-md">
            <table className="w-full text-right text-xs">
              <thead className="bg-zinc-900 text-zinc-300 border-b border-zinc-800">
                <tr>
                  <th className="p-3 font-bold">الميزة</th>
                  <th className="p-3 font-black text-amber-400 bg-amber-950/30">حامل MagSafe المزدوج الأصلي</th>
                  <th className="p-3 font-bold text-zinc-500">الحلقات البلاستيكية الرخيصة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                <tr className="bg-zinc-900/50">
                  <td className="p-3 font-bold text-zinc-300">المغناطيس المزدوج</td>
                  <td className="p-3 font-bold text-emerald-400 bg-amber-950/20">✅ مغناطيس N52 قوي للجهتين (الهاتف + المعدن)</td>
                  <td className="p-3 text-rose-400">❌ جهة واحدة ضعيفة أو لاصق عادي يترك أثراً</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-zinc-300">المفصلات والدوران</td>
                  <td className="p-3 font-bold text-emerald-400 bg-amber-950/20">✅ دوران 360° كامل ومفصلات محكمة لا ترتخي</td>
                  <td className="p-3 text-rose-400">❌ ترتخي وتسقط بعد أسبوع من الاستخدام</td>
                </tr>
                <tr className="bg-zinc-900/50">
                  <td className="p-3 font-bold text-zinc-300">السمك والراحة</td>
                  <td className="p-3 font-bold text-emerald-400 bg-amber-950/20">✅ فائق النحافة (Ultra-Thin) يطوى مسطحاً</td>
                  <td className="p-3 text-rose-400">❌ بارز وضخم ويضايق جداً في الجيب</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-zinc-300">الخامات والتصنيع</td>
                  <td className="p-3 font-bold text-emerald-400 bg-amber-950/20">✅ سبائك معدنية فاخرة مقاومة للخدوش والتآكل</td>
                  <td className="p-3 text-rose-400">❌ بلاستيك رديء يتكسر ويفقد لونه سريعاً</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 8. Compatibility Box */}
        <div className="p-5 sm:p-6 bg-zinc-900 border-b border-zinc-800">
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-start gap-3">
            <Smartphone size={24} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-white text-sm mb-1">
                التوافق مع أجهزة الآيفون وباقي الهواتف:
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                متوافق فورياً ومباشرة عبر MagSafe مع هواتف: <strong className="text-zinc-200">iPhone 12 / 13 / 14 / 15 / 16 / 17 (بما في ذلك فئات Pro و Pro Max و Plus)</strong> وجميع الحافظات التي تدعم MagSafe.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-950/60 border border-amber-800/80 text-amber-300 px-3 py-1 rounded-lg text-xs font-bold">
                <Sparkles size={14} />
                <span>هدية مع كل طلب: حلقة معدنية مغناطيسية إضافية لاستخدامه مع أي هاتف أو كفر عادي!</span>
              </div>
            </div>
          </div>
        </div>

        {/* 9. FAQ Section */}
        <div className="p-5 sm:p-6 bg-black border-b border-zinc-800 space-y-3">
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              الأسئلة الشائعة
            </span>
            <h3 className="text-base font-black text-white">
              كل ما تريد معرفته قبل الطلب
            </h3>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            <h5 className="font-bold text-white text-xs mb-1">هل يمكنني معاينة المنتج قبل دفع المال للموزع؟</h5>
            <p className="text-xs text-zinc-400">
              نعم بكل تأكيد! يحق لك فتح الطرد والتأكد من جودة الحامل ولونه وسلامته قبل دفع أي دينار لعامل التوصيل.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            <h5 className="font-bold text-white text-xs mb-1">هل قوة المغناطيس كافية لحمل هاتف ثقيل مثل 15 أو 16 Pro Max؟</h5>
            <p className="text-xs text-zinc-400">
              نعم، الحامل مزود بمغناطيس نيوديميوم N52 عالي القوة مصمم خصيصاً ليتحمل أثقل هواتف الآيفون حتى مع الاهتزازات أو الحركة.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            <h5 className="font-bold text-white text-xs mb-1">كم يستغرق التوصيل؟</h5>
            <p className="text-xs text-zinc-400">
              التوصيل سريع ويستغرق من 24 إلى 48 ساعة لمعظم الولايات الشمالية، ومن يومين إلى 3 أيام للولايات الداخلية والجنوبية.
            </p>
          </div>
        </div>

        {/* 10. Dedicated Checkout Form */}
        <div id="checkout" className="p-4 sm:p-6 bg-zinc-950">
          <div className="text-center mb-5">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
              استمارة الطلب السريع
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              أدخل معلوماتك وأكد طلبك الآن
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              الدفع عند الاستلام بعد المعاينة | شحن سريع لـ 58 ولاية جزائرية
            </p>
          </div>

          <CheckoutFormMagsafe onPurchase={onPurchase} />
        </div>
      </main>

      {/* Sticky Bottom Order Button for Mobile */}
      {showStickyButton && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-slate-950/95 backdrop-blur-md border-t border-zinc-800 shadow-2xl flex items-center justify-between max-w-md mx-auto">
          <div className="text-right pr-2">
            <div className="text-[11px] text-zinc-400">السعر الحالي:</div>
            <div className="text-lg font-black text-amber-400">2900 د.ج</div>
          </div>

          <a
            href="#checkout"
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-full font-black text-sm text-white shadow-lg transition-transform active:scale-95 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600"
          >
            <ShoppingCart size={17} />
            <span>أطلب الآن</span>
          </a>
        </div>
      )}
    </div>
  );
}
