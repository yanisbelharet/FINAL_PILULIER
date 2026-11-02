// Envoi des commandes vers Google Sheets via un script Google Apps Script (application Web) collé dans la feuille.
// Le serveur pousse chaque nouvelle commande au moment où elle est passée : pas de connexion Google à maintenir,
// pas besoin que le dashboard soit ouvert. Le script ignore les ID déjà présents (pas de doublon).
// Réglages dans config/main : sheetWebhookUrl (URL /exec du script) et sheetSecret (même valeur que dans le script).
// (Fichier préfixé par « _ » : Vercel n'en fait pas une route /api.)

export type SheetOrder = {
  id: string; number: string; createdAt: string; name: string; phone: string; wilaya: string; commune: string;
  address: string; delivery: string; product: string; offer: string; quantity: number; total: number; source: string;
};

const iso = (v: any): string => {
  if (!v) return new Date().toISOString();
  if (typeof v === 'string') return v;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000).toISOString();
  return new Date(v).toISOString();
};

export function toSheetOrder(id: string, o: any): SheetOrder {
  return {
    id,
    number: o.displayId ? String(o.displayId) : '',
    createdAt: iso(o.createdAt),
    name: String(o.name || ''),
    phone: String(o.phone || ''),
    wilaya: String(o.wilaya || o.city || ''),
    commune: String(o.commune || ''),
    address: o.address && o.address !== o.commune ? String(o.address) : '',
    delivery: o.deliveryType === 'desk' ? 'Bureau (Stop Desk)' : 'Domicile',
    product: String(o.productName || ''),
    offer: String(o.bundleTitle || ''),
    quantity: Number(o.quantity) || 1,
    total: Number(o.price) || 0,
    source: String(o.source || ''),
  };
}

// version, spreadsheet, sheetName, rows : renvoyés par le script à partir de la version 2 (absents avec la version 1)
export type SheetResult = { ok: boolean; added?: number; sheetUrl?: string; error?: string; version?: number; spreadsheet?: string; sheetName?: string; rows?: number };

export async function pushOrdersToSheet(url: string, secret: string, orders: SheetOrder[], timeoutMs = 15000): Promise<SheetResult> {
  if (!url || !/^https:\/\/script\.google(usercontent)?\.com\//.test(url)) return { ok: false, error: "URL du script invalide (elle doit commencer par https://script.google.com/)" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // L'application Web Apps Script répond par une redirection 302 vers script.googleusercontent.com : fetch la suit
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret, orders }),
      redirect: 'follow',
      signal: controller.signal,
    });
    const text = await res.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch {
      // Page HTML de Google = déploiement non public ou URL incorrecte
      return { ok: false, error: /accounts\.google\.com|ServiceLogin|Sign in/i.test(text)
        ? "Le script n'est pas accessible publiquement : redéployez-le avec « Qui a accès : Tout le monde »."
        : `Réponse inattendue du script (HTTP ${res.status}). Vérifiez l'URL /exec.` };
    }
    if (!data.ok) return { ok: false, error: data.error === 'secret' ? 'Code secret incorrect : recopiez le script depuis le dashboard.' : (data.error || 'Erreur du script') };
    return { ok: true, added: Number(data.added) || 0, sheetUrl: data.sheetUrl, version: data.version, spreadsheet: data.spreadsheet, sheetName: data.sheetName, rows: data.rows };
  } catch (err: any) {
    return { ok: false, error: err?.name === 'AbortError' ? 'Le script Google ne répond pas (délai dépassé).' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}
