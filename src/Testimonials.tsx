import React from 'react';
import { Star } from 'lucide-react';
const review1 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/IzYq9H3Zol0ieYuB6LIQYgIviQxC8Jlpbfj3Z0Jx.webp';
const review2 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/V7Z4mS2gaEEQcB1uMb8wdDFBzvQU2kgyKIMRX2OA.webp';
const review3 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/syZLSOxSzNOvwdKnK9Kve8C5XAvjAcxvZwDrmlTT.webp';
const review4 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/ZQwZQofFB8iGB5NrPWQkveTQpjuIaaM7XPJK01D5.webp';
const review5 = 'https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/t8CauggAXXRf8cM8tXzQdrCZzuoSgkQeSnAMGKJb.webp';
const Testimonials = () => {
  const reviews = [
    review1,
    review2,
    review3,
    review4,
    review5
  ];

  // ...

  return (
    <section className="py-16 bg-slate-50 px-4 border-y border-slate-100">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-4">
            آراء زبائننا الكرام
          </h2>
          <p className="text-slate-600 font-medium">أكثر من 100 زبون راضي عن منتجنا</p>
        </div>
        
        <div className="space-y-6">
          {reviews.map((imgSrc, i) => (
            <div key={i} className="rounded-3xl overflow-hidden shadow-md border border-slate-100">
              <img loading="lazy" src={imgSrc} alt={`رأي زبون ${i + 1}`} className="w-full h-auto object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
