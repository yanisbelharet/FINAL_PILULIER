import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const LandingPage = lazy(() => import('./LandingPage'));
const LandingPageV2 = lazy(() => import('./LandingPageV2'));
const LandingPageV3 = lazy(() => import('./LandingPageV3'));
const LandingPageV4 = lazy(() => import('./LandingPageV4'));
const Dashboard = lazy(() => import('./Dashboard'));
const Storefront = lazy(() => import('./Storefront'));
const ThankYou = lazy(() => import('./ThankYou'));

export default function App() {
  const defaultProducts = [
    {
      id: "med-alarm",
      name: "منبه الدواء الذكي",
      description: "تخلص من القلق ونظم أدويتك بكل سهولة! حافظة ذكية مزودة بـ 4 منبهات قوية لتذكيرك في الوقت المحدد.",
      price: 2900,
      oldPrice: 4200,
      imageUrl: "https://cdn.youcan.shop/stores/defae844a0bbda3e5af90b6e7c10442b/others/7UDcKpzGFzchMMbeTwAB3UJZsYDCHWRiLTfg2A3T.jpg",
      isVisible: true
    },
    {
      id: "med-alarm-v3",
      name: "منبه الدواء الذكي (النسخة 3)",
      description: "تخلص من القلق ونظم أدويتك بكل سهولة! حافظة ذكية مزودة بـ 4 منبهات قوية لتذكيرك في الوقت المحدد.",
      price: 2900,
      oldPrice: 4200,
      imageUrl: "https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/UcuCAbqBuLvphQwpgudEKiSTjNT7tkDWqG2nmVoF.webp",
      isVisible: true,
      customPath: "/product-v3/med-alarm"
    },
    {
      id: "med-alarm-v4",
      name: "منبه الدواء الذكي (النسخة 4)",
      description: "تخلص من القلق ونظم أدويتك بكل سهولة! حافظة ذكية مزودة بـ 4 منبهات قوية لتذكيرك في الوقت المحدد.",
      price: 2900,
      oldPrice: 4200,
      imageUrl: "https://cdn.youcan.shop/stores/ba86712f261c8f3eed78e0e12a689855/others/UcuCAbqBuLvphQwpgudEKiSTjNT7tkDWqG2nmVoF.webp",
      isVisible: true,
      customPath: "/product-v4/med-alarm"
    }
  ];

  const [config, setConfig] = useState<{
    productPrice: number;
    productOldPrice: number;
    promoActive: boolean;
    promoText: string;
    visits: number;
    fbPixelId: string;
    tiktokPixelId: string;
    fbAccessToken: string;
    tiktokAccessToken: string;
    googleAdsId: string;
    googleAdsLabel: string;
    ga4MeasurementId?: string;
    timerEnabled: boolean;
    timerHours: number;
    products: any[];
  }>(() => {
    // Instant cache-first load to avoid layout shift and eliminate network waiting
    try {
      const cached = localStorage.getItem('site_config_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}

    return {
      productPrice: 2900,
      productOldPrice: 4200,
      promoActive: true,
      promoText: 'عرض ترويجي محدود!',
      visits: 0,
      fbPixelId: "",
      tiktokPixelId: "",
      fbAccessToken: "",
      tiktokAccessToken: "",
      googleAdsId: "",
      googleAdsLabel: "",
      ga4MeasurementId: "",
      timerEnabled: true,
      timerHours: 24,
      products: defaultProducts
    };
  });

  useEffect(() => {
    let isMounted = true;
    
    // Fast lightweight backend config fetch without loading the heavy Firebase client SDK
    fetch('/api/config')
      .then(res => res.json())
      .then((data) => {
        if (!isMounted || !data) return;
        let mergedProducts = data.products || defaultProducts;
        if (data.products) {
          const existingIds = new Set(data.products.map((p: any) => p.id));
          const missingProducts = defaultProducts.filter(p => !existingIds.has(p.id));
          mergedProducts = [...data.products, ...missingProducts];
        }

        const newConfig = {
          productPrice: 2900,
          productOldPrice: 4200,
          promoActive: true,
          promoText: 'عرض ترويجي محدود!',
          visits: 0,
          fbPixelId: "",
          tiktokPixelId: "",
          fbAccessToken: "",
          tiktokAccessToken: "",
          timerEnabled: true,
          timerHours: 24,
          ...data,
          products: mergedProducts
        } as any;

        setConfig(newConfig);
        try {
          localStorage.setItem('site_config_cache', JSON.stringify(newConfig));
        } catch (e) {}
      })
      .catch((err) => {
        console.error("Config fetch error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config) return;

    // Run pixel injection after initial paint to prevent blocking the main thread during TTI
    const timer = setTimeout(() => {
      // Inject Facebook Pixel (guarded against duplicate script tags)
      if (config.fbPixelId && !document.getElementById('fb-pixel-script')) {
        (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.id = 'fb-pixel-script';
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        
        const fbPixels = config.fbPixelId.split(',').map((p: string) => p.trim()).filter(Boolean);
        fbPixels.forEach((p: string) => window.fbq('init', p));
        window.fbq('track', 'PageView');
      }

      // Inject Google Analytics / Ads (guarded against duplicate script tags)
      if ((config.googleAdsId || config.ga4MeasurementId) && !document.getElementById('google-gtag-script')) {
        const gtagId = config.ga4MeasurementId || config.googleAdsId;
        const script = document.createElement('script');
        script.id = 'google-gtag-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
        document.head.appendChild(script);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(..._args: any[]) {
          window.dataLayer.push(arguments);
        }
        gtag('js', new Date());
        if (config.googleAdsId) gtag('config', config.googleAdsId);
        if (config.ga4MeasurementId) gtag('config', config.ga4MeasurementId);
      }
      
      // Inject TikTok Pixel (guarded against duplicate initialization)
      if (config.tiktokPixelId && !document.getElementById('tiktok-pixel-script')) {
        (function (w: any, d: any, t: any) {
          w.TiktokAnalyticsObject = t;
          var ttq = w[t] = w[t] || [];
          ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
          ttq.setAndDefer = function(t: any, e: any) {
            t[e] = function() {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
          ttq.instance = function(t: any) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
            return e;
          };
          ttq.load = function(e: any, n: any) {
            var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i = ttq._i || {};
            ttq._i[e] = [];
            ttq._i[e]._u = i;
            ttq._t = ttq._t || {};
            ttq._t[e] = +new Date;
            ttq._o = ttq._o || {};
            ttq._o[e] = n || {};
            var o = document.createElement("script");
            o.id = 'tiktok-pixel-script';
            o.type = "text/javascript";
            o.async = !0;
            o.src = i + "?sdkid=" + e + "&lib=" + t;
            var a = document.getElementsByTagName("script")[0];
            a.parentNode.insertBefore(o, a);
          };
          const ttPixels = config.tiktokPixelId.split(',').map((p: string) => p.trim()).filter(Boolean);
          ttPixels.forEach((p: string) => ttq.load(p));
          ttq.page();
        })(window, document, 'ttq');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    // track visit once per session in idle time without blocking performance metrics
    if (!sessionStorage.getItem('visitTracked')) {
      const sendTrack = () => {
        fetch('/api/track-visit', { method: 'POST' }).catch(() => {});
        sessionStorage.setItem('visitTracked', 'true');
      };
      
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(sendTrack, { timeout: 6000 });
      } else {
        setTimeout(sendTrack, 5000);
      }
    }
  }, []);

  const handlePurchase = (price: number, product: any, formData?: any) => {
    const eventId = formData?.eventId || `ORDER_${Date.now()}`;
    
    if (config?.fbPixelId && window.fbq) {
      window.fbq('track', 'Purchase', { value: price, currency: 'DZD' }, { eventID: eventId });
    }
    if (config?.tiktokPixelId && window.ttq) {
      if (formData && formData.phone) {
        let phone = String(formData.phone).trim();
        if (phone.startsWith('0')) {
          phone = '+213' + phone.substring(1);
        } else if (!phone.startsWith('+')) {
          phone = '+213' + phone;
        }
        window.ttq.identify({
          phone_number: phone
        });
      }
      window.ttq.track('CompletePayment', {
        contents: [{
          content_id: product.id,
          content_type: 'product',
          content_name: product.name,
        }],
        value: price,
        currency: 'DZD'
      }, {
        event_id: eventId
      });
    }

    if (config?.googleAdsId && config?.googleAdsLabel && typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      function gtag(..._args: any[]) { window.dataLayer.push(arguments); }
      
      if (formData && formData.phone) {
        let phone = String(formData.phone).trim();
        if (phone.startsWith('0')) {
          phone = '+213' + phone.substring(1);
        } else if (!phone.startsWith('+')) {
          phone = '+213' + phone;
        }
        gtag('set', 'user_data', {
          "phone_number": phone
        });
      }

      gtag('event', 'conversion', {
          'send_to': `${config.googleAdsId}/${config.googleAdsLabel}`,
          'value': price,
          'currency': 'DZD',
          'transaction_id': eventId
      });
    }

    if (config?.ga4MeasurementId && typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      function gtag(..._args: any[]) { window.dataLayer.push(arguments); }
      gtag('event', 'purchase', {
        currency: 'DZD',
        value: price,
        transaction_id: eventId,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: price,
          quantity: 1
        }]
      });
    }
  };


  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
        <Routes>
          <Route path="/" element={<Storefront config={config} />} />
          <Route path="/product/:id" element={<LandingPage config={config} onPurchase={(price, product, formData) => handlePurchase(price, product, formData)} />} />
          <Route path="/product-v2/:id" element={<LandingPageV2 config={config} onPurchase={(price, product, formData) => handlePurchase(price, product, formData)} />} />
          <Route path="/product-v3/:id" element={<LandingPageV3 config={config} onPurchase={(price, product, formData) => handlePurchase(price, product, formData)} />} />
          <Route path="/product-v4/:id" element={<LandingPageV4 config={config} onPurchase={(price, product, formData) => handlePurchase(price, product, formData)} />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/thank-you" element={<ThankYou config={config} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    TiktokAnalyticsObject: any;
    ttq: any;
    dataLayer: any;
    gtag: any;
  }
}
