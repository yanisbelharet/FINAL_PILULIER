import React, { useState, useEffect } from 'react';
import { ShoppingCart, ShieldCheck, Truck, Droplets, CheckCircle2, AlertTriangle, Sparkles, Layers, Sun, Wind, ChevronDown, Award, Star } from 'lucide-react';
import CheckoutFormProelastic from './CheckoutFormProelastic';

const imgBucket = '/images/proelastic_bucket.jpg';
const imgApply = '/images/proelastic_apply.jpg';
const imgElasticity = '/images/proelastic_elasticity.jpg';

interface LandingPageProelasticProps {
  onPurchase: (price: number, product: any, formData: any) => void;
}

export default function LandingPageProelastic({ onPurchase }: LandingPageProelasticProps) {
  const [showStickyButton, setShowStickyButton] = useState(false);

  // Track ViewContent event
  useEffect(() => {
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        contents: [{
          content_id: 'proelastic-profinish',
          content_type: 'product',
          content_name: 'PROELASTIC Profinish طلاء مضاد للتسربات الأصلي',
        }],
        value: 14.5,
        currency: 'USD'
      });
    }

    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: 'PROELASTIC Profinish طلاء مضاد للتسربات الأصلي',
        content_ids: ['proelastic-profinish'],
        content_type: 'product',
        value: 14.5,
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
        // hide sticky when near checkout form
        setShowStickyButton(window.scrollY > 450 && rect.top > window.innerHeight);
      } else {
        setShowStickyButton(window.scrollY > 450);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800" dir="rtl">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white text-xs sm:text-sm py-2 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-sm">
        <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full">
          الأصلي 100%
        </span>
        <span>
          شركة Profinish الجزائرية | YANIS SHOP متوفر منذ 3 سنوات | توصيل سريع لـ 58 ولاية مع المعاينة قبل الدفع
        </span>
      </div>

      <main className="max-w-2xl mx-auto bg-white shadow-2xl min-h-screen overflow-hidden flex flex-col">
        {/* Brand & Authority Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white text-center border-b border-blue-900">
          <div className="inline-flex items-center gap-2 bg-blue-950/80 border border-blue-600/50 text-blue-300 px-3.5 py-1 rounded-full text-xs font-bold mb-3 shadow-inner">
            <Award size={15} className="text-amber-400" />
            <span>YANIS SHOP — نبيعه بثقة زبائننا منذ أكثر من 3 سنوات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
            طلاء العزل المطاطي الشفاف المضاد للتسربات <br />
            <span className="text-blue-400">PROELASTIC</span> من شركة <span className="text-amber-400">Profinish الجزائرية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            الحل الجذري النهائي لتسربات مياه الأمطار والرطوبة وتشققات الأسطح دون الحاجة لتكسير البلاط أو مصاريف باهظة!
          </p>
        </div>

        {/* 1. Hero Product Image */}
        <div className="w-full relative bg-slate-50 border-b border-slate-100">
          <img
            src={imgBucket}
            alt="طلاء PROELASTIC Profinish الأصلي المضاد للتسربات"
            width={768}
            height={768}
            className="w-full h-auto object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
          />
          <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
            <Sparkles size={13} className="text-amber-400" />
            <span>المنتج الأصلي بضمان مصنع Profinish</span>
          </div>
        </div>

        {/* 2. Top Order CTA Button */}
        <div className="flex flex-col items-center my-4 px-4">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 shadow-xs">
            <Droplets size={14} className="text-blue-600" />
            <span>شفاف 100% | يطبق من السطح الخارجي | يغطي 2 م² لكل 1 كلغ</span>
          </div>

          <a
            href="#checkout"
            className="flex items-center justify-center gap-3 w-[310px] py-3 px-5 rounded-full border-4 border-solid border-blue-400 transition-all animate-horizontal-bounce shadow-xl hover:scale-105"
            style={{
              background: 'linear-gradient(45deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={19} color="#FFFFFF" />
            <span className="text-[18px] font-black">أطلب الآن (عروض خاصة)</span>
          </a>
        </div>

        {/* 3. Anti-Counterfeit & Authority Alert (تحذير من المقلد) */}
        <div className="mx-4 my-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950 mb-1">
                ⚠️ تنبيه مهم جداً لزبائننا الكرام: احذروا المنتجات المقلدة!
              </h3>
              <p className="text-xs text-amber-900 leading-relaxed">
                مع اقتراب فصل الشتاء، ظهرت في السوق ماركات رخيصة مقلدة ذات جودة رديئة تتقشر بعد أول قطرة مطر وتتسبب في خسائر فادحة.
              </p>
              <div className="mt-2.5 p-2.5 bg-white/90 rounded-xl border border-amber-200 text-xs text-slate-800 leading-relaxed font-medium">
                ✅ <strong>نحن في YANIS SHOP:</strong> نبيع منتج <strong>PROELASTIC الأصلي</strong> المعتمد من شركة <strong>Profinish الجزائرية</strong> منذ أكثر من <strong>3 سنوات</strong> وحققنا ملايين المشاهدات مع آلاف التجارب الإيجابية الموثقة من زبائننا في كافة الولايات. نضمن لك أصالة المنتج 100%، ويمكنك معاينة العلبة وختم المصنع قبل دفع أي دينار!
              </div>
            </div>
          </div>
        </div>

        {/* 4. Real Application Demonstration Image */}
        <div className="p-4 sm:p-6 bg-slate-50 border-y border-slate-100">
          <h3 className="text-base sm:text-lg font-black text-slate-900 text-center mb-1">
            شاهد كيف يحمي PROELASTIC الشفاف بلاط الأسطح والبلكونات
          </h3>
          <p className="text-xs text-slate-500 text-center mb-4">
            طبقة مائية مطاطية شفافة تمنع تسرب المياه تماماً وتبقى غير مرئية
          </p>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative">
            <img
              src={imgApply}
              alt="تطبيق طلاء PROELASTIC الشفاف فوق البلاط والتشققات"
              width={768}
              height={768}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent p-3 text-white text-xs">
              <span className="font-bold text-blue-300 block mb-0.5">تطبيق مباشر بالرولو فوق الكارلاج والشقوق:</span>
              <span>الماء يتجمع على شكل قطرات ولا يخترق البلاط أو الشقوق نهائياً بفضل العزل الكريستالي.</span>
            </div>
          </div>
        </div>

        {/* 5. Key Technical Highlights */}
        <div className="p-5 sm:p-6 space-y-4">
          <h3 className="text-lg font-black text-slate-900 text-center">
            لماذا يعتبر PROELASTIC الأصلي الحل الأفضل في الجزائر؟
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">شفاف 100% كريستالي</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  لا يُغيّر ولا يُشوّه مظهر البلاط، الفايونس، الرخام، الدال دوصول أو الحجارة، ويمنح ملمساً نظيفاً ولامعاً.
                </p>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">يطبق على السطح الخارجي</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  يُدهن من الأعلى على مصدر التسرب مباشرة (خارجياً) وليس من داخل الغرف، ليمنع احتباس الرطوبة في الجدران.
                </p>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl shrink-0">
                <Wind size={18} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">مرونة مطاطية فائقة (Élastique)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  يتمدد مع حركة الشقوق وفواصل التمدد الإنشائي الناتجة عن الحرارة والبرودة دون أن ينكسر أو يتقشر.
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-start gap-3">
              <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0">
                <Sun size={18} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm mb-1">مقاوم للأشعة والشمس الحارقة</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  صُنع خصيصاً ليتحمل مناخ الجزائر القاسي (أشعة الشمس الحارقة UV، درجات حرارة تصل 50°، وأمطار طوفانية).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Elasticity Test Demonstration Image */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white">
          <div className="text-center mb-4">
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">
              اختبار الجودة والمتانة في المخبر
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              غشاء مطاطي متين غير قابل للتمزق
            </h3>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <img
              src={imgElasticity}
              alt="اختبار مرونة ومطاطية غشاء PROELASTIC المقاوم للتسرب"
              width={768}
              height={768}
              className="w-full h-auto object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p className="text-xs text-slate-300 mt-3 text-center leading-relaxed">
            يتحول PROELASTIC بعد الجفاف إلى غشاء سيليكوني مطاطي لاصق بقوة على السطح يمنع مرور أدق جزيئات الماء والرطوبة.
          </p>
        </div>

        {/* 7. Comparison Table: YANIS SHOP Authentic vs Counterfeit */}
        <div className="p-5 sm:p-6 bg-white">
          <h3 className="text-base sm:text-lg font-black text-slate-900 text-center mb-1">
            قارن بنفسك قبل الشراء:
          </h3>
          <p className="text-xs text-slate-500 text-center mb-4">
            الفرق بين PROELASTIC الأصلي لشركة Profinish والماركات المغشوشة
          </p>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-xs">
            <div className="grid grid-cols-3 bg-slate-100 p-3 font-black text-slate-700 border-b border-slate-200 text-center">
              <div>المعيار</div>
              <div className="text-blue-700">PROELASTIC الأصلي</div>
              <div className="text-rose-600">الماركات المقلدة</div>
            </div>

            <div className="grid grid-cols-3 p-3 border-b border-slate-100 items-center text-center">
              <span className="font-bold text-slate-700">الشفافية</span>
              <span className="font-bold text-emerald-700">شفاف 100% لامع</span>
              <span className="text-slate-400">يترك بقع بيضاء وصفراء</span>
            </div>

            <div className="grid grid-cols-3 p-3 border-b border-slate-100 items-center text-center bg-slate-50/50">
              <span className="font-bold text-slate-700">مقاومة الشمس</span>
              <span className="font-bold text-emerald-700">سنوات تحت شمس UV</span>
              <span className="text-slate-400">يتشقق بعد أسابيع قليلة</span>
            </div>

            <div className="grid grid-cols-3 p-3 border-b border-slate-100 items-center text-center">
              <span className="font-bold text-slate-700">المرونة ومطاطية</span>
              <span className="font-bold text-emerald-700">غشاء مطاطي يتمدد</span>
              <span className="text-slate-400">طبقة جافة هشة تتكسر</span>
            </div>

            <div className="grid grid-cols-3 p-3 items-center text-center bg-slate-50/50">
              <span className="font-bold text-slate-700">الضمان والمصدر</span>
              <span className="font-bold text-emerald-700">شركة Profinish الأصلية</span>
              <span className="text-slate-400">مجهول المصدر والتركيب</span>
            </div>
          </div>
        </div>

        {/* 8. Surface Calculator & Package Guide */}
        <div className="p-5 sm:p-6 bg-blue-50/60 border-y border-blue-100">
          <div className="text-center mb-4">
            <span className="bg-blue-600 text-white text-[11px] font-black px-3 py-1 rounded-full">
              دليل حساب المساحة
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2">
              كم كيلوغرام أحتاج لسطحي؟
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              القاعدة الذهبية: <strong>كل 1 كلغ يغطي مساحة حوالي 2 متر مربع</strong> (بتطبيق طبقتين)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs">
              <span className="font-black text-slate-900 block text-sm">مساحة ~2 م²</span>
              <span className="text-slate-500 block my-1">للتشققات وحواف النوافذ</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">علبة 1 كلغ (1900 د.ج)</span>
            </div>

            <div className="p-3 bg-white rounded-xl border-2 border-emerald-500 shadow-xs relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.2 rounded-full whitespace-nowrap">
                الأكثر طلباً
              </span>
              <span className="font-black text-slate-900 block text-sm">مساحة ~6 م²</span>
              <span className="text-slate-500 block my-1">للبلكونات ودورات المياه</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">2+1 مجاناً (3800 د.ج)</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-indigo-300 shadow-2xs">
              <span className="font-black text-slate-900 block text-sm">مساحة ~10 م²</span>
              <span className="text-slate-500 block my-1">للأسطح والتيراس الكبيرة</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">سطل 5 كلغ (5700 د.ج)</span>
            </div>
          </div>
        </div>

        {/* 9. Easy Application Steps in 3 Steps */}
        <div className="p-5 sm:p-6 bg-white">
          <h3 className="text-base sm:text-lg font-black text-slate-900 text-center mb-4">
            طريقة الاستعمال السهلة بدون الحاجة لمختص:
          </h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                1
              </div>
              <div className="text-xs">
                <h4 className="font-black text-slate-900 text-sm mb-0.5">تنظيف السطح</h4>
                <p className="text-slate-600 leading-relaxed">
                  نظف السطح أو البلاط جيداً من الأتربة، الأوساخ والزيوت، وتأكد من جفافه التام قبل البدء.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                2
              </div>
              <div className="text-xs">
                <h4 className="font-black text-slate-900 text-sm mb-0.5">دهن الطبقة الأولى</h4>
                <p className="text-slate-600 leading-relaxed">
                  طبق طبقة متساوية من PROELASTIC مباشرة بالرولو (Roller) أو الفرشاة مع التركيز على الشقوق وفواصل البلاط.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shrink-0">
                3
              </div>
              <div className="text-xs">
                <h4 className="font-black text-slate-900 text-sm mb-0.5">دهن الطبقة الثانية (المتقاطعة)</h4>
                <p className="text-slate-600 leading-relaxed">
                  اترك السطح يجف لمدة 4 إلى 6 ساعات، ثم ادهن الطبقة الثانية في اتجاه متعامد لضمان عزل كتيم 100% يدوم لسنوات!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 10. Customer Testimonials YANIS SHOP */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200">
          <div className="text-center mb-4">
            <div className="flex justify-center gap-1 text-amber-400 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <h3 className="text-base font-black text-slate-900">
              آراء زبائن YANIS SHOP وتجارب حقيقية منذ 3 سنوات
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-slate-900">عبد القادر م. (البليدة)</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">زبون مؤكد</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                "عندي تيراس فيها تشققات كانت تسيل في الصالون. شريت عرض 5 كلغ من عندكم، دهنتها بالرولو وما شاء الله بعد الأمطار الأخيرة قطرة ما زادت دخلت، واللون شفاف بقى كما هو. شكراً YANIS SHOP على المنتوج الأصلي."
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-slate-900">سمير ب. (الجزائر العاصمة)</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">زبون مؤكد</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                "كنت جربت قبل ماركة رخيصة شريتها من المارشي وتقشرت بعد شهر. عاودت شريت Proelastic الأصلي من عند الأخ أنيس، الفرق كبير في الجودة والمطاطية، هاذي عامين والسطح معزول مئة بالمئة."
              </p>
            </div>
          </div>
        </div>

        {/* 11. Checkout Form Section */}
        <section id="checkout" className="py-8 bg-white px-4 border-t border-slate-200">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <span className="bg-blue-600 text-white text-xs font-black px-3.5 py-1 rounded-full shadow-xs">
                استمارة الطلب المباشر
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-1">
                أطلب الآن طلاء PROELASTIC الأصلي
              </h2>
              <p className="text-xs text-slate-500">
                املأ معلوماتك أدناه وسيصلك الموزع حتى باب المنزل مع الدفع عند الاستلام
              </p>
            </div>

            <CheckoutFormProelastic onPurchase={onPurchase} />
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
            className="pointer-events-auto flex items-center justify-center gap-3 w-full max-w-[320px] py-3 px-5 rounded-full border-4 border-solid border-blue-400 transition-all shadow-2xl hover:scale-105"
            style={{
              background: 'linear-gradient(45deg, #1e3a8a 0%, #2563eb 100%)',
              color: '#FFFFFF'
            }}
          >
            <ShoppingCart size={20} color="#FFFFFF" />
            <span className="text-[18px] font-black">أطلب PROELASTIC الأصلي الآن</span>
          </a>
        </div>
      </div>
    </div>
  );
}
