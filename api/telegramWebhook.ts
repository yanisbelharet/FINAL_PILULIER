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

const EXPANDED_KEYBOARD = {
  inline_keyboard: [
    [{ text: "🆕 Nouvelle", callback_data: "st:new" }],
    [{ text: "❌ Non-validé", callback_data: "st:not_validated" }, { text: "📞 Validé par téléphone", callback_data: "st:phone_validated" }],
    [{ text: "✅ Confirmé", callback_data: "st:confirmed" }, { text: "📦 Expédié", callback_data: "st:shipped" }],
    [{ text: "❌ Annulé", callback_data: "st:cancelled" }, { text: "🔄 Reporté", callback_data: "st:postponed" }],
    [{ text: "🚚 Livré", callback_data: "st:delivered" }, { text: "⏳ En attente", callback_data: "st:pending" }],
    [{ text: "🔁 RPN PAS 1", callback_data: "st:rpn_1" }, { text: "🔁 RPN PAS 2", callback_data: "st:rpn_2" }],
    [{ text: "🔁 RPN PAS 3", callback_data: "st:rpn_3" }, { text: "📵 Non joinable", callback_data: "st:not_joinable" }],
    [{ text: "🔴 Racrouche", callback_data: "st:racrouche" }, { text: "📞 A rappeler", callback_data: "st:call_back" }],
    [{ text: "⚠️ Risque élevé", callback_data: "st:high_risk" }]
  ]
};

const COLLAPSED_KEYBOARD = {
  inline_keyboard: [
    [{ text: "📊 Statut", callback_data: "menu" }]
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

    // Security check
    const allowedChatId = process.env.TELEGRAM_CHAT_ID;
    if (String(chatId) !== String(allowedChatId)) {
      return res.status(200).send("Unauthorized");
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (callbackData === "menu") {
      await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          reply_markup: EXPANDED_KEYBOARD
        })
      });
      return res.status(200).json({ success: true });
    }

    if (callbackData.startsWith("st:")) {
      const newStatus = callbackData.split(":")[1];
      const statusLabel = STATUS_EMOJIS[newStatus] || newStatus;
      
      const lines = currentText.split('\n');
      const markdownLines = lines.map((line: string) => {
        // Handle bolding back the specific fields correctly for Markdown
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

      // If "Statut :" wasn't in the original text (for older messages), append it
      if (!lines.some((l: string) => l.includes("Statut :"))) {
        markdownLines.push(`\n📊 *Statut :* ${statusLabel}`);
      }

      const finalMarkdownText = markdownLines.join('\n');

      await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: finalMarkdownText,
          parse_mode: "Markdown",
          reply_markup: COLLAPSED_KEYBOARD
        })
      });

      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callback_query.id,
          text: "Statut: " + statusLabel
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
