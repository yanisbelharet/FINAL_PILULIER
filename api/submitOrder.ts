import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import crypto from "crypto";

import { DELIVERY_PRICES } from "../src/data";

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

    const text = `🛒 *طلبية جديدة!*\n👤 *الاسم:* ${name}\n📞 *رقم الهاتف:* ${phone}\n📍 *الولاية:* ${wilaya}\n🏙️ *البلدية:* ${commune}\n🚚 *نوع التوصيل:* ${deliveryType === 'home' ? 'لباب المنزل' : 'للمكتب (Stop Desk)'}\n💰 *السعر الإجمالي:* ${price} د.ج`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
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
              contents: [{ price: basePrice, quantity: 1 }],
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
