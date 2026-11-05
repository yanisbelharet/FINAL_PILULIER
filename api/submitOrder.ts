import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import crypto from "crypto";
import { waitUntil } from "@vercel/functions";
import { toSheetOrder, pushOrdersToSheet } from "./_sheets.js";
import { DELIVERY_PRICES } from "./_delivery.js";


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
    const { name, phone, wilaya, commune, deliveryType, price, eventId, productId, productName, productPrice, quantity,
      address, bundleId, bundleTitle, productTotal, currency, country, source } = req.body;

    // Config lue en parallèle de l'enregistrement (Google Sheets + TikTok Events API)
    const configPromise = getDoc(doc(db, "config", "main"))
      .then(snap => (snap.exists() ? snap.data() : {}) as any)
      .catch(err => { console.error("Error reading config:", err); return {} as any; });

    // Save order to Firestore (tous les champs envoyés par les formulaires : produit, offre, quantité, source…)
    const orderData: Record<string, any> = {
      name,
      phone,
      wilaya,
      commune,
      deliveryType,
      price,
      ...(address ? { address } : {}),
      ...(productId ? { productId } : {}),
      ...(productName ? { productName } : {}),
      ...(quantity ? { quantity: Number(quantity) || 1 } : {}),
      ...(bundleId ? { bundleId } : {}),
      ...(bundleTitle ? { bundleTitle } : {}),
      ...(Number(productTotal) > 0 ? { productTotal: Number(productTotal) } : {}),
      ...(currency ? { currency } : {}),
      ...(country ? { country } : {}),
      ...(source ? { source } : {}),
      ...(eventId ? { eventId } : {}),
    };
    let orderId = '';
    try {
      const ref = await addDoc(collection(db, "orders"), { ...orderData, createdAt: serverTimestamp() });
      orderId = ref.id;
    } catch (err) {
      console.error("Error saving order to Firestore:", err);
    }

    const configData: any = await configPromise;

    // Google Sheets : envoi lancé tout de suite, en parallèle de Telegram et TikTok.
    // Avant de répondre, on l'attend au plus SHEET_WAIT_MS (sinon Vercel peut couper la fonction avant la fin de l'envoi) ;
    // waitUntil prolonge la fonction au-delà quand le runtime le permet.
    let sheetPromise: Promise<unknown> | null = null;
    if (orderId && configData.sheetWebhookUrl) {
      sheetPromise = pushOrdersToSheet(configData.sheetWebhookUrl, configData.sheetSecret || '', [toSheetOrder(orderId, { ...orderData, createdAt: new Date().toISOString() })])
        .then(r => { if (!r.ok) console.error("[SHEETS] Error:", r.error); })
        .catch(err => console.error("[SHEETS] Error:", err));
      waitUntil(sheetPromise);
    }
    const SHEET_WAIT_MS = 4000;
    const sheetStart = Date.now();
    const settleSheet = () => sheetPromise
      ? Promise.race([sheetPromise, new Promise(r => setTimeout(r, Math.max(0, SHEET_WAIT_MS - (Date.now() - sheetStart))))])
      : Promise.resolve();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // Un ou plusieurs destinataires séparés par des virgules (ex. vous + un groupe : "123456789,-1001234567890")
    const chatIds = String(process.env.TELEGRAM_CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);

    if (!botToken || !chatIds.length) {
      console.warn("Telegram credentials not configured. Order received but not sent to Telegram.");
      await settleSheet();
      return res.status(200).json({ success: true, warning: "Telegram not configured" });
    }

    const text = `🛒 *طلبية جديدة!*\n📦 *الكمية:* ${quantity || 1}\n👤 *الاسم:* ${name}\n📞 *رقم الهاتف:* ${phone}\n📍 *الولاية:* ${wilaya}\n🏙️ *البلدية:* ${commune}\n🚚 *نوع التوصيل:* ${deliveryType === 'home' ? 'لباب المنزل' : 'للمكتب (Stop Desk)'}\n💰 *السعر الإجمالي:* ${price} د.ج`;

    const sent = await Promise.all(chatIds.map(async chatId => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
        });
        if (!response.ok) console.error(`Telegram API Error (chat ${chatId}):`, await response.json().catch(() => null));
        return response.ok;
      } catch (err) {
        console.error(`Telegram fetch error (chat ${chatId}):`, err);
        return false;
      }
    }));

    if (!sent.some(Boolean)) {
      await settleSheet();
      return res.status(500).json({ success: false, error: "Failed to send to Telegram" });
    }

    // TikTok Events API
    try {
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

    await settleSheet();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Order processing error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
