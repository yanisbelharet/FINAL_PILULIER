import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

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

const STATUS_EMOJIS: Record<string, string> = {
  new: "🆕 Nouvelle commande",
  not_validated: "❌ Non-validé",
  phone_validated: "📞 Validé par téléphone",
  confirmed: "✅ Confirmé",
  shipped: "📦 Expédié",
  cancelled: "❌ Annulé",
  postponed: "🔄 Reporté",
  delivered: "🚚 Livré",
  rpn_1: "🔁 RPN PAS 1",
  rpn_2: "🔁 RPN PAS 2",
  rpn_3: "🔁 RPN PAS 3",
  not_joinable: "📵 Non joinable",
  racrouche: "🔴 Racrouche",
  pending: "⏳ En attente",
  call_back: "📞 A rappeler",
  high_risk: "⚠️ Risque élevé"
};

const MENU_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "✅ Confirmé", callback_data: "st:ID:confirmed" },
      { text: "❌ Non-validé", callback_data: "st:ID:not_validated" }
    ],
    [
      { text: "📞 Validé tél", callback_data: "st:ID:phone_validated" },
      { text: "📦 Expédié", callback_data: "st:ID:shipped" }
    ],
    [
      { text: "❌ Annulé", callback_data: "st:ID:cancelled" },
      { text: "🔄 Reporté", callback_data: "st:ID:postponed" }
    ],
    [
      { text: "🚚 Livré", callback_data: "st:ID:delivered" },
      { text: "⏳ En attente", callback_data: "st:ID:pending" }
    ],
    [
      { text: "🔁 RPN 1", callback_data: "st:ID:rpn_1" },
      { text: "🔁 RPN 2", callback_data: "st:ID:rpn_2" }
    ],
    [
      { text: "🔁 RPN 3", callback_data: "st:ID:rpn_3" },
      { text: "📵 Non joinable", callback_data: "st:ID:not_joinable" }
    ],
    [
      { text: "🔴 Racrouche", callback_data: "st:ID:racrouche" },
      { text: "📞 A rappeler", callback_data: "st:ID:call_back" }
    ],
    [
      { text: "⚠️ Risque élevé", callback_data: "st:ID:high_risk" },
      { text: "🆕 Nouvelle", callback_data: "st:ID:new" }
    ]
  ]
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { callback_query } = req.body;

    if (!callback_query) {
      return res.status(200).json({ success: true });
    }

    const callbackData = callback_query.data;
    const chatId = callback_query.message.chat.id;
    const messageId = callback_query.message.message_id;
    const currentText = callback_query.message.text;

    // Security check: Only allow the configured chat to use the menu
    const allowedChatId = process.env.TELEGRAM_CHAT_ID;
    if (String(chatId) !== String(allowedChatId)) {
      return res.status(200).send("Unauthorized");
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (callbackData.startsWith("menu:")) {
      const orderId = callbackData.split(":")[1];
      
      const keyboard = {
        inline_keyboard: MENU_KEYBOARD.inline_keyboard.map(row => 
          row.map(btn => ({
            ...btn,
            callback_data: btn.callback_data.replace("ID", orderId)
          }))
        )
      };

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: keyboard
        })
      });

      return res.status(200).json({ success: true });
    }

    if (callbackData.startsWith("st:")) {
      const [, orderId, newStatus] = callbackData.split(":");

      if (orderId && newStatus) {
        try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, { status: newStatus });
        } catch (err) {
          console.error("Firestore update error:", err);
        }
      }

      const statusLabel = STATUS_EMOJIS[newStatus] || newStatus;
      
      const lines = currentText.split('\n');
      const markdownLines = lines.map((line: string) => {
        if (line.includes("طلبية جديدة")) return `🛒 *${line.replace(/🛒\s*/, '').trim()}*`;
        if (line.includes("التاريخ والوقت:")) return `🕒 *التاريخ والوقت:* ${line.split("التاريخ والوقت:")[1].trim()}`;
        if (line.includes("الاسم:")) return `👤 *الاسم:* ${line.split("الاسم:")[1].trim()}`;
        if (line.includes("رقم الهاتف:")) return `📞 *رقم الهاتف:* ${line.split("رقم الهاتف:")[1].trim()}`;
        if (line.includes("الولاية:")) return `📍 *الولاية:* ${line.split("الولاية:")[1].trim()}`;
        if (line.includes("البلدية:")) return `🏙️ *البلدية:* ${line.split("البلدية:")[1].trim()}`;
        if (line.includes("نوع التوصيل:")) return `🚚 *نوع التوصيل:* ${line.split("نوع التوصيل:")[1].trim()}`;
        if (line.includes("السعر الإجمالي:")) return `💰 *السعر الإجمالي:* ${line.split("السعر الإجمالي:")[1].trim()}`;
        if (line.includes("Statut :")) return `📊 *Statut :* ${statusLabel}`;
        return line;
      });

      const finalMarkdownText = markdownLines.join('\n');

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: finalMarkdownText,
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "📊 Modifier le statut", callback_data: `menu:${orderId}` }]
            ]
          }
        })
      });

      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callback_query.id,
          text: "Statut mis à jour : " + statusLabel
        })
      });

      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).send('Internal error');
  }
}
