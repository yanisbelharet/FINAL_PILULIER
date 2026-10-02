export interface LibyanBundle {
  id: string;
  quantity: number;
  title: string;
  subtitle: string;
  badge?: string;
  isPopular?: boolean;
  price: number; // in LYD
  oldPrice: number; // in LYD
  savings: number; // in LYD
  deliveryFee: number; // 0 for free delivery
  freeDelivery: boolean;
}

export const LIBYAN_BUNDLES: LibyanBundle[] = [
  {
    id: "pack-1",
    quantity: 1,
    title: "علبة واحدة (1 جهاز)",
    subtitle: "مناسب للاستخدام الشخصي الفردي",
    price: 79,
    oldPrice: 115,
    savings: 36,
    deliveryFee: 10,
    freeDelivery: false,
  },
  {
    id: "pack-2",
    quantity: 2,
    title: "علبتين (2 أجهزة) - باقة العائلة المميزة",
    subtitle: "قطعة لك وقطعة للوالدين أو الشريك",
    badge: "⭐ العرض الأكثر مبيعاً وموصى به",
    isPopular: true,
    price: 129,
    oldPrice: 158,
    savings: 29,
    deliveryFee: 0,
    freeDelivery: true,
  },
  {
    id: "pack-3",
    quantity: 3,
    title: "3 علب (3 أجهزة) - باقة التوفير الأقصى",
    subtitle: "لكافة أفراد العائلة أو هدايا قيّمة لمن تحب",
    badge: "🏆 أكبر نسبة توفير (وفر 68 د.ل)",
    price: 169,
    oldPrice: 237,
    savings: 68,
    deliveryFee: 0,
    freeDelivery: true,
  }
];

export const LIBYA_CITIES = [
  "طرابلس (Tripoli)",
  "بنغازي (Benghazi)",
  "مصراتة (Misrata)",
  "الزاوية (Zawiya)",
  "زليتن (Zliten)",
  "البيضاء (Al Bayda)",
  "طبرق (Tobruk)",
  "سبها (Sabha)",
  "سرت (Sirte)",
  "الخمس (Al Khums)",
  "درنة (Derna)",
  "غريان (Gharyan)",
  "صبراتة (Sabratha)",
  "صرمان (Sorman)",
  "أجدابيا (Ajdabiya)",
  "المرج (Al Marj)",
  "ترهونة (Tarhuna)",
  "زوارة (Zuwara)",
  "بني وليد (Bani Walid)",
  "يفرن (Yefren)",
  "القبة (Al Qubbah)",
  "جادو (Jadu)",
  "نالوت (Nalut)",
  "جنزور (Janzour)",
  "تاجوراء (Tajoura)",
  "قصر بن غشير (Qasr bin Ghashir)",
  "شحات (Shahat)",
  "ودان / الجفرة (Waddan / Jufra)",
  "هون (Houn)",
  "مسلاتة (Msallata)",
  "الكفرة (Kufra)",
  "غات (Ghat)",
  "أوباري (Ubari)",
  "براك الشاطئ (Brak)",
  "مدينة / منطقة أخرى داخل ليبيا"
];
