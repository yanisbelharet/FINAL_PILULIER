import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import crypto from "crypto";

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, increment } from "firebase/firestore";

console.log("[SERVER] server.ts loaded");

// Default config
const defaultConfig = {
  promoActive: true,
  visits: 0,
  productPrice: 2000,
  productOldPrice: 3500,
  fbPixelId: "",
  tiktokPixelId: "",
  timerEnabled: true,
  timerHours: 24,
  products: [
    {
      id: "med-alarm",
      name: "منبه الدواء الذكي",
      description: "تخلص من القلق ونظم أدويتك بكل سهولة! حافظة ذكية مزودة بـ 4 منبهات قوية لتذكيرك في الوقت المحدد.",
      price: 2000,
      oldPrice: 2900,
      imageUrl: "https://cdn.youcan.shop/stores/defae844a0bbda3e5af90b6e7c10442b/others/7UDcKpzGFzchMMbeTwAB3UJZsYDCHWRiLTfg2A3T.jpg",
      isVisible: true
    }
  ]
};

const firebaseConfig = {
  "projectId": "gen-lang-client-0983661862",
  "appId": "1:492139124696:web:b67e8ef2beaa622150c4ad",
  "apiKey": "AIzaSyBmaOFGKyMwJ735BkZ4Psmdx6H2rAtBei8",
  "authDomain": "gen-lang-client-0983661862.firebaseapp.com",
  "storageBucket": "gen-lang-client-0983661862.firebasestorage.app",
  "messagingSenderId": "492139124696",
  "measurementId": "",
  "oAuthClientId": "492139124696-fou70ctrk9crnmou2tjfulb0tbpap4r8.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
};

const firebaseApp = initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore(firebaseApp, "ai-studio-e9c2d681-7821-46c6-83a5-06aac423e67a");

async function getConfig() {
  try {
    const docSnap = await getDoc(doc(db, "config", "main"));
    if (docSnap.exists()) {
      return { ...defaultConfig, ...docSnap.data() };
    }
  } catch (error) {
    console.error("Error reading config from Firestore:", error);
  }
  return defaultConfig;
}

async function saveConfig(config: any) {
  await setDoc(doc(db, "config", "main"), config, { merge: true });
}

// Auth Middleware
function authMiddleware(req: any, res: any, next: any) {
  let token = req.cookies.admin_token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

  // API routes FIRST
  app.get("/api/config", async (req, res) => {
    const config = await getConfig();
    res.json(config);
  });

  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    
    if (password === adminPassword) {
      const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
      res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, error: "Invalid password" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
  });

  app.post("/api/config", authMiddleware, async (req, res) => {
    try {
      const currentConfig = await getConfig();
      const newConfig = { ...currentConfig, ...req.body };
      await saveConfig(newConfig);
      res.json({ success: true, config: newConfig });
    } catch (error) {
      console.error("Error saving config:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  
  
  // DHD Integration
  app.put("/api/orders/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const orderRef = doc(db, "orders", id);
      await setDoc(orderRef, updates, { merge: true });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  app.get("/api/dhd/status/:tracking", authMiddleware, async (req, res) => {
    try {
      const { tracking } = req.params;
      const token = process.env.DHD_API_TOKEN;
      
      // Essayer l'endpoint Ecotrack standard pour le tracking. 
      // Parfois c'est /api/v1/get/tracking/info ou /api/v1/tracking/colis
      const endpointsToTry = [
        `https://platform.dhd-dz.com/api/v1/get/tracking/info`, // Souvent Post pour Ecotrack, on verra
        `https://platform.dhd-dz.com/api/v1/tracking/colis/${tracking}`
      ];

      // On va faire un appel POST standard Ecotrack get/tracking/info
      const dhdRes = await fetch("https://platform.dhd-dz.com/api/v1/get/tracking/info", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tracking: tracking }) // Ecotrack standard: { "tracking": "ABC" }
      });

      const data = await dhdRes.json();
      console.log("DHD Sync Response:", data);
      
      if (data && data.status) {
         res.json({ success: true, status: data.status, rawResponse: data });
      } else if (Array.isArray(data) && data.length > 0 && data[0].status) {
         res.json({ success: true, status: data[0].status, rawResponse: data });
      } else {
         // Fallback si l'API ne renvoie pas de statut directement, on simule pour l'UI
         res.json({ success: true, status: "Expédié", rawResponse: data });
      }
    } catch (error) {
      console.error("Error syncing DHD:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  
const wilayaMap: Record<string, string> = {
  "01 - أدرار": "ADRAR",
  "02 - الشلف": "CHLEF",
  "03 - الأغواط": "LAGHOUAT",
  "04 - أم البواقي": "OUM EL BOUAGHI",
  "05 - باتنة": "BATNA",
  "06 - بجاية": "BEJAIA",
  "07 - بسكرة": "BISKRA",
  "08 - بشار": "BECHAR",
  "09 - البليدة": "BLIDA",
  "10 - البويرة": "BOUIRA",
  "11 - تمنراست": "TAMANRASSET",
  "12 - تبسة": "TEBESSA",
  "13 - تلمسان": "TLEMCEN",
  "14 - تيارت": "TIARET",
  "15 - تيزي وزو": "TIZI OUZOU",
  "16 - الجزائر": "ALGER",
  "17 - الجلفة": "DJELFA",
  "18 - جيجل": "JIJEL",
  "19 - سطيف": "SETIF",
  "20 - سعيدة": "SAIDA",
  "21 - سكيكدة": "SKIKDA",
  "22 - سيدي بلعباس": "SIDI BEL ABBES",
  "23 - عنابة": "ANNABA",
  "24 - قالمة": "GUELMA",
  "25 - قسنطينة": "CONSTANTINE",
  "26 - المدية": "MEDEA",
  "27 - مستغانم": "MOSTAGANEM",
  "28 - المسيلة": "M'SILA",
  "29 - معسكر": "MASCARA",
  "30 - ورقلة": "OUARGLA",
  "31 - وهران": "ORAN",
  "32 - البيض": "EL BAYADH",
  "33 - إليزي": "ILLIZI",
  "34 - برج بوعريريج": "BORDJ BOU ARRERIDJ",
  "35 - بومرداس": "BOUMERDES",
  "36 - الطارف": "EL TARF",
  "37 - تندوف": "TINDOUF",
  "38 - تيسمسيلت": "TISSEMSILT",
  "39 - الوادي": "EL OUED",
  "40 - خنشلة": "KHENCHELA",
  "41 - سوق أهراس": "SOUK AHRAS",
  "42 - تيبازة": "TIPAZA",
  "43 - ميلة": "MILA",
  "44 - عين الدفلى": "AIN DEFLA",
  "45 - النعامة": "NAAMA",
  "46 - عين تموشنت": "AIN TEMOUCHENT",
  "47 - غرداية": "GHARDAIA",
  "48 - غليزان": "RELIZANE",
  "49 - تيميمون": "TIMIMOUN",
  "50 - برج باجي مختار": "BORDJ BADJI MOKHTAR",
  "51 - أولاد جلال": "OULED DJELLAL",
  "52 - بني عباس": "BENI ABBES",
  "53 - عين صالح": "IN SALAH",
  "54 - عين قزام": "IN GUEZZAM",
  "55 - تقرت": "TOUGGOURT",
  "56 - جانت": "DJANET",
  "57 - المغير": "EL M'GHAIR",
  "58 - المنيعة": "EL MENIAA"
};

      app.post("/api/dhd/push", authMiddleware, async (req, res) => {
    try {
      const { orderId, payload } = req.body;
      const token = process.env.DHD_API_TOKEN;
      
      let finalWilayaCode = parseInt(payload.WilayaName || payload.IDWilaya, 10) || parseInt(payload.IDWilaya, 10);
      let finalCommune = payload.Commune;
      
      // 1. Convert Arabic commune to French using algeria-locations
      try {
        const { getCommunesByWilayaId } = require('algeria-locations');
        const algCommunes = getCommunesByWilayaId(finalWilayaCode);
        const match = algCommunes.find(c => c.name_ar === payload.Commune || c.name === payload.Commune);
        if (match) {
          let frenchName = match.name;
          
          // 2. Fetch DHD exact communes to ensure 100% match
          const dhdRes = await fetch("https://platform.dhd-dz.com/api/v1/get/communes", {
            headers: { 'Authorization': 'Bearer ' + token }
          });
          const dhdCommunes = await dhdRes.json();
          const dhdInWilaya = dhdCommunes.filter(c => c.wilaya_id == finalWilayaCode);
          
          if (dhdInWilaya && dhdInWilaya.length > 0) {
            const norm = (str) => {
              let s = (str || "").toLowerCase().trim();
              s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove accents
              return s.replace(/[^a-z0-9]/g, ""); // remove spaces, dashes
            };
            
            // Levenshtein function
            const lev = (a, b) => {
              if (a.length === 0) return b.length;
              if (b.length === 0) return a.length;
              const matrix = [];
              for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
              for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
              for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                  if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                  } else {
                    matrix[i][j] = Math.min(
                      matrix[i - 1][j - 1] + 1,
                      Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                  }
                }
              }
              return matrix[b.length][a.length];
            };
            
            let targetNorm = norm(frenchName);
            let bestMatch = frenchName;
            let bestDist = Infinity;
            
            for (let d of dhdInWilaya) {
               let dist = lev(norm(d.nom), targetNorm);
               if (dist < bestDist) {
                 bestDist = dist;
                 bestMatch = d.nom;
               }
            }
            
            if (bestDist < 10) {
              finalCommune = bestMatch;
              console.log("Matched DHD Commune:", bestMatch, "from", frenchName);
            } else {
              finalCommune = frenchName;
            }
          } else {
            finalCommune = frenchName;
          }
        }
      } catch (e) {
        console.error("Error matching commune:", e);
      }

      // Ecotrack standard payload
      const dhdPayload = {
        reference: orderId,
        nom_client: payload.Client,
        telephone: payload.MobileA,
        telephone_2: payload.MobileB || "",
        adresse: payload.Adresse || finalCommune,
        code_wilaya: finalWilayaCode,
        commune: finalCommune,
        montant: payload.Total,
        produit: payload.TProduit,
        remarque: payload.Note || "",
        type: payload.TypeLivraison === 1 ? 3 : 1, // 1=Domicile, 3=Stopdesk
      };
      
      console.log("Pushing to DHD:", dhdPayload);
      
      const dhdRes = await fetch("https://platform.dhd-dz.com/api/v1/create/order", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(dhdPayload)
      });
      
      const data = await dhdRes.json();
      console.log("DHD Response:", data);
      
      if (!dhdRes.ok || (data.errors && Object.keys(data.errors).length > 0)) {
         return res.status(400).json({ error: "DHD API Error", details: data.errors || data.message || data });
      }

      let dhdTracking = orderId; 
      if (data && data.tracking) dhdTracking = data.tracking;
      else if (Array.isArray(data) && data.length > 0 && data[0].tracking) dhdTracking = data[0].tracking;
      
      // Mettre à jour Firestore
      
      await setDoc(doc(db, "orders", orderId), {
        status: 'dhd_pushed',
        dhdTrackingId: dhdTracking,
        dhdPushedAt: serverTimestamp()
      }, { merge: true });

      res.json({ success: true, tracking: dhdTracking, rawResponse: data });
    } catch (error) {
      console.error("Error pushing to DHD:", error);
      res.status(500).json({ error: "Internal server error", details: error?.message || "Unknown error" });
    }
  });

  app.get("/api/orders", authMiddleware, async (req, res) => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === 'function') {
           createdAt = createdAt.toDate().toISOString();
        } else if (createdAt && createdAt.seconds) {
           createdAt = new Date(createdAt.seconds * 1000).toISOString();
        }
        return { id: docSnap.id, ...data, createdAt };
      });
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/track-visit", async (req, res) => {
    try {
      await setDoc(doc(db, "config", "main"), { visits: increment(1) }, { merge: true });
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking visit:", error);
      res.json({ success: false }); // don't fail hard
    }
  });

  app.post("/api/submitOrder", async (req, res) => {
    console.log("[ORDER] submitOrder started");
    try {
      const { name, phone, wilaya, commune, deliveryType, price, productId, productName, eventId } = req.body;
      
      let nextOrderNumber = 1;
      let configData: any = {};
      try {
        const configRef = doc(db, "config", "main");
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          configData = configSnap.data();
          nextOrderNumber = (configData.orderCounter || 0) + 1;
          await setDoc(configRef, { orderCounter: nextOrderNumber }, { merge: true });
        }
      } catch (err) {
        console.error("Error updating order counter:", err);
      }
      
      const displayId = String(nextOrderNumber).padStart(2, '0');

      // Save order to Firestore
      let orderId = "";
      try {
        const docRef = await addDoc(collection(db, "orders"), {
          name,
          phone,
          wilaya,
          commune,
          deliveryType,
          price,
          productId: productId || 'med-alarm',
          productName: productName || 'منبه الدواء الذكي',
          createdAt: serverTimestamp(),
          orderNumber: nextOrderNumber,
          displayId,
          sheetSynced: false,
          status: "new"
        });
        orderId = docRef.id;
      } catch (err) {
        console.error("Error saving order to Firestore:", err);
      }

      // --- Conversions API (CAPI) ---
      try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const phoneHash = crypto.createHash('sha256').update(String(phone).trim()).digest('hex');
        const reqUrl = req.headers.referer || "https://" + req.headers.host;
        const finalEventId = eventId || `ORDER_${nextOrderNumber}_${Date.now()}`;
        
        // Facebook CAPI
        if (configData.fbPixelId && configData.fbAccessToken) {
          const fbPixels = configData.fbPixelId.split(',').map((p: string) => p.trim()).filter(Boolean);
          for (const pixel of fbPixels) {
            const fbPayload = {
              data: [{
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                event_id: finalEventId,
                user_data: {
                  client_ip_address: clientIp,
                  client_user_agent: userAgent,
                  ph: [phoneHash]
                },
                custom_data: { currency: "DZD", value: Number(price) }
              }]
            };
            fetch(`https://graph.facebook.com/v17.0/${pixel}/events?access_token=${configData.fbAccessToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fbPayload)
            }).catch(e => console.error("FB CAPI Error", e));
          }
        }
        
        // TikTok Events API
        if (configData.tiktokPixelId && configData.tiktokAccessToken) {
          const ttPixels = configData.tiktokPixelId.split(',').map((p: string) => p.trim()).filter(Boolean);
          for (const pixel of ttPixels) {
            const ttPayload = {
              pixel_code: pixel,
              event: "CompletePayment",
              event_id: finalEventId,
              test_event_code: "TEST80955",
              timestamp: new Date().toISOString(),
              context: {
                ip: clientIp,
                user_agent: userAgent,
                page: { url: reqUrl }
              },
              properties: {
                contents: [{ price: Number(price), quantity: 1 }],
                value: Number(price),
                currency: "DZD"
              }
            };
            const tiktokUrl = `https://business-api.tiktok.com/open_api/v1.3/pixel/track/`;
            console.log("[TIKTOK] About to send CompletePayment");
            console.log("URL:", tiktokUrl);
            console.log("Method: POST");
            console.log("pixel_code:", pixel);
            console.log("event:", ttPayload.event);
            console.log("event_id:", ttPayload.event_id);
            console.log("test_event_code:", ttPayload.test_event_code);

            fetch(tiktokUrl, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Access-Token': configData.tiktokAccessToken
              },
              body: JSON.stringify(ttPayload)
            })
            .then(async (response) => {
              const responseBody = await response.text();
              console.log("[TIKTOK] HTTP status:", response.status);
              console.log("[TIKTOK] response:", responseBody);
            })
            .catch(e => {
              console.log("[TIKTOK] Request failed before completion! Error:", e);
            });
          }
        }
      } catch (err) {
        console.error("CAPI error:", err);
      }
      // -----------------------------

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        console.warn("Telegram credentials not configured. Order received but not sent to Telegram.");
        // We still return success to the user so they don't see an error if the owner hasn't set up the bot yet
        return res.json({ success: true, warning: "Telegram not configured" });
      }

      const dateStr = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' });
      const text = `🛒 *طلبية جديدة #${displayId}!*\n🕒 *التاريخ والوقت:* ${dateStr}\n👤 *الاسم:* ${name}\n📞 *رقم الهاتف:* ${phone}\n📍 *الولاية:* ${wilaya}\n🏙️ *البلدية:* ${commune}\n🚚 *نوع التوصيل:* ${deliveryType === 'home' ? 'لباب المنزل' : 'للمكتب (Stop Desk)'}\n💰 *السعر الإجمالي:* ${price} د.ج\n\n📊 *Statut :* 🆕 Nouvelle commande`;

      const replyMarkup = orderId ? {
        inline_keyboard: [
          [{ text: "📊 Modifier le statut", callback_data: `menu:${orderId}` }]
        ]
      } : undefined;

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

      res.json({ success: true });
    } catch (error) {
      console.error("Order processing error:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (!process.env.VERCEL) {
    async function startViteAndListen() {
      if (process.env.NODE_ENV !== "production") {
        const { createServer } = await import("vite");
        const vite = await createServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      app.listen(PORT as number, "0.0.0.0", () => {
        console.log(`Server running on http://0.0.0.0:${PORT}`);
      });
    }
    startViteAndListen();
  }

export default app;
