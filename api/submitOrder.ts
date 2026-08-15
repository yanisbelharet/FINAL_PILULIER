import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import crypto from "crypto";

const DELIVERY_PRICES: Record<string, { desk: number, home: number }> = {
  "01 - أدرار": { desk: 500, home: 900 },
  "02 - الشلف": { desk: 400, home: 600 },
  "03 - الأغواط": { desk: 400, home: 700 },
  "04 - أم البواقي": { desk: 400, home: 600 },
  "05 - باتنة": { desk: 400, home: 600 },
  "06 - بجاية": { desk: 400, home: 600 },
  "07 - بسكرة": { desk: 400, home: 700 },
  "08 - بشار": { desk: 500, home: 900 },
  "09 - البليدة": { desk: 250, home: 500 },
  "10 - البويرة": { desk: 400, home: 600 },
  "11 - تمنراست": { desk: 800, home: 1300 },
  "12 - تبسة": { desk: 400, home: 600 },
  "13 - تلمسان": { desk: 400, home: 600 },
  "14 - تيارت": { desk: 400, home: 600 },
  "15 - تيزي وزو": { desk: 400, home: 600 },
  "16 - الجزائر": { desk: 350, home: 400 },
  "17 - الجلفة": { desk: 400, home: 700 },
  "18 - جيجل": { desk: 400, home: 600 },
  "19 - سطيف": { desk: 400, home: 600 },
  "20 - سعيدة": { desk: 400, home: 600 },
  "21 - سكيكدة": { desk: 400, home: 600 },
  "22 - سيدي بلعباس": { desk: 400, home: 600 },
  "23 - عنابة": { desk: 400, home: 600 },
  "24 - قالمة": { desk: 400, home: 600 },
  "25 - قسنطينة": { desk: 400, home: 600 },
  "26 - المدية": { desk: 400, home: 600 },
  "27 - مستغانم": { desk: 400, home: 600 },
  "28 - المسيلة": { desk: 400, home: 600 },
  "29 - معسكر": { desk: 400, home: 600 },
  "30 - ورقلة": { desk: 400, home: 700 },
  "31 - وهران": { desk: 400, home: 600 },
  "32 - البيض": { desk: 400, home: 800 },
  "33 - إليزي": { desk: 600, home: 1300 },
  "34 - برج بوعريريج": { desk: 400, home: 600 },
  "35 - بومرداس": { desk: 400, home: 600 },
  "36 - الطارف": { desk: 600, home: 600 },
  "37 - تندوف": { desk: 600, home: 1300 },
  "38 - تيسمسيلت": { desk: 400, home: 600 },
  "39 - الوادي": { desk: 400, home: 600 },
  "40 - خنشلة": { desk: 400, home: 600 },
  "41 - سوق أهراس": { desk: 400, home: 600 },
  "42 - تيبازة": { desk: 350, home: 500 },
  "43 - ميلة": { desk: 400, home: 600 },
  "44 - عين الدفلى": { desk: 400, home: 600 },
  "45 - النعامة": { desk: 400, home: 800 },
  "46 - عين تموشنت": { desk: 400, home: 600 },
  "47 - غرداية": { desk: 400, home: 700 },
  "48 - غليزان": { desk: 400, home: 600 },
  "49 - تيميمون": { desk: 1300, home: 1300 },
  "50 - برج باجي مختار": { desk: 1000, home: 1300 },
  "51 - أولاد جلال": { desk: 400, home: 700 },
  "52 - بني عباس": { desk: 1300, home: 1300 },
  "53 - عين صالح": { desk: 600, home: 1300 },
  "54 - عين قزام": { desk: 400, home: 700 },
  "55 - تقرت": { desk: 700, home: 700 },
  "56 - جانت": { desk: 1000, home: 1300 },
  "57 - المغير": { desk: 700, home: 700 },
  "58 - المنيعة": { desk: 400, home: 800 }
};

const firebaseConfig = {
  projectId: "gen-lang-client-0983661862",
  appId: "1:492139124696:web:b67e8ef2beaa622150c4ad",
  apiKey: "AIzaSyBmaOFGKyMwJ735BkZ4Psmdx6H2rAtBei8",
  authDomain: "gen-lang-client-0983661862.firebaseapp.com",
  storageBucket: "gen-lang-client-0983661862.firebasestorage.app",
  messagingSenderId: "492139124696"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-e9c2d681-7821-46c6-83a5-06aac423e67a");

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, wilaya, commune, deliveryType, price, eventId, productId, productName, productPrice } = req.body;
      
    // Save order to Firestore
    try {
      await addDoc(collection(db, "orders"), {
        name,
        phone,
        wilaya,
        commune,
        deliveryType,
        price,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving order to Firestore:", err);
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn("Telegram credentials not configured. Order received but not sent to Telegram.");
      return res.status(200).json({ success: true, warning: "Telegram not configured" });
    }

    const text = `🛒 *طلبية جديدة!*\n👤 *الاسم:* ${name}\n📞 *رقم الهاتف:* ${phone}\n📍 *الولاية:* ${wilaya}\n🏙️ *البلدية:* ${commune}\n🚚 *نوع التوصيل:* ${deliveryType === 'home' ? 'لباب المنزل' : 'للمكتب (Stop Desk)'}\n💰 *السعر الإجمالي:* ${price} د.ج\n\n📊 *Statut :* 🆕 Nouvelle commande`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: "📊 Statut", callback_data: "menu" }]
      ]
    };

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
        reply_markup: replyMarkup
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Telegram API Error:", errorData);
      return res.status(500).json({ success: false, error: "Failed to send to Telegram" });
    }

    // TikTok Events API
    try {
      let configData: any = {};
      const configRef = doc(db, "config", "main");
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        configData = configSnap.data();
      }

      if (configData.tiktokPixelId && configData.tiktokAccessToken && eventId) {
        const clientIp = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
        const userAgent = req.headers['user-agent'] || '';
        const reqUrl = req.headers.referer || req.headers.origin || "https://" + (req.headers.host || '');
        
        let normalizedPhone = String(phone || '').trim();
        if (normalizedPhone.startsWith('0')) {
          normalizedPhone = '+213' + normalizedPhone.substring(1);
        } else if (normalizedPhone && !normalizedPhone.startsWith('+')) {
          normalizedPhone = '+213' + normalizedPhone;
        }
        
        const hashedPhone = normalizedPhone ? crypto.createHash('sha256').update(normalizedPhone).digest('hex') : undefined;
        
        const wilayaPrice = wilaya ? DELIVERY_PRICES[wilaya] : null;
        const deliveryPrice = wilayaPrice && deliveryType ? wilayaPrice[deliveryType as 'home' | 'desk'] : 0;
        const basePrice = productPrice !== undefined ? Number(productPrice) : (Number(price) - deliveryPrice);

        const ttPixels = configData.tiktokPixelId.split(',').map((p: string) => p.trim()).filter(Boolean);
        for (const pixel of ttPixels) {
          const ttPayload = {
            pixel_code: pixel,
            event: "CompletePayment",
            event_id: eventId,
            test_event_code: "TEST80955",
            timestamp: new Date().toISOString(),
            context: {
              ip: clientIp,
              user_agent: userAgent,
              page: { url: reqUrl },
              ...(hashedPhone ? { user: { phone_number: hashedPhone } } : {})
            },
            properties: {
              contents: [{
                content_id: productId || "med-alarm",
                content_type: "product",
                content_name: productName || "منبه الدواء الذكي",
                price: basePrice,
                quantity: 1
              }],
              value: basePrice,
              currency: "DZD"
            }
          };

          const tiktokUrl = `https://business-api.tiktok.com/open_api/v1.3/pixel/track/`;
          console.log("[TIKTOK CAPI] START");
          console.log("[TIKTOK CAPI] event:", "CompletePayment");
          console.log("[TIKTOK CAPI] event_id:", eventId);
          console.log("[TIKTOK CAPI] test_event_code:", "TEST80955");

          console.log("[TIKTOK CAPI] BEFORE FETCH");
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const ttResponse = await fetch(tiktokUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Access-Token': configData.tiktokAccessToken
              },
              body: JSON.stringify(ttPayload),
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log("[TIKTOK CAPI] AFTER FETCH");
            const ttResponseBody = await ttResponse.text();
            console.log("[TIKTOK CAPI] HTTP STATUS:", ttResponse.status);
            console.log("[TIKTOK CAPI] RESPONSE:", ttResponseBody);
          } catch (fetchErr: any) {
            if (fetchErr.name === 'AbortError') {
              console.error("[TIKTOK CAPI] FETCH TIMEOUT");
            } else {
              console.error("[TIKTOK CAPI] FETCH ERROR:", fetchErr);
            }
          }
        }
      }
    } catch (ttErr) {
      console.error("[TIKTOK CAPI] Error:", ttErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Order processing error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
