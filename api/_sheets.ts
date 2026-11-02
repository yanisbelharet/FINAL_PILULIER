// Envoi des commandes vers Google Sheets via un script Google Apps Script (application Web) collé dans la feuille.
// Le serveur pousse chaque nouvelle commande au moment où elle est passée : pas de connexion Google à maintenir,
// pas besoin que le dashboard soit ouvert. Le script ignore les commandes déjà présentes (pas de doublon).
// Réglages dans config/main : sheetWebhookUrl (URL /exec du script) et sheetSecret (même valeur que dans le script).
// (Fichier préfixé par « _ » : Vercel n'en fait pas une route /api.)

import { DELIVERY_PRICES } from "./_delivery.js";

// Une commande pour le script : onglet du produit, référence interne (anti-doublon, colonne masquée)
// et les colonnes B à L du modèle (A « Order ID » est le numéro attribué par le script dans l'onglet) :
// Order date | الاسم الكامل | رقم الهاتف | الولاية | البلدية | سعر التوصيل | التوصيل | السعر الاجمالي | confirmation | Livraison | (notes)
export type SheetOrder = { key: string; sheet: string; row: string[] };

const toDate = (v: any): Date => {
  if (!v) return new Date();
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
};

// « 2025-09-03 21:59:46 », heure d'Alger
const algiersDate = (d: Date) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
}).format(d);

// Un onglet par produit
export function sheetTabFor(o: any): string {
  const id = String(o.productId || '');
  if (o.country === 'Libya' || o.currency === 'LYD' || /libya|-ly$/.test(id)) return 'منبه الدواء - ليبيا';
  if (id === 'pigma-stop-fuites-16kg') return 'Stop Fuites 16 kg';
  if (id.startsWith('pigma-stop-fuites')) return 'Stop Fuites 1,4 kg';
  if (id.startsWith('proelastic')) return 'PROELASTIC';
  if (id.startsWith('magsafe')) return 'MagSafe';
  if (id.startsWith('med-alarm')) return 'منبه الدواء';
  // anciennes commandes enregistrées sans produit
  const name = String(o.productName || '').replace(/[[\]*?/\\:]/g, ' ').trim().slice(0, 40);
  return name || 'Autres commandes';
}

export function toSheetOrder(id: string, o: any): SheetOrder {
  const unit = o.currency === 'LYD' || o.country === 'Libya' ? 'د.ل' : 'دج';
  const total = Number(o.price) || 0;
  // livraison = total - produits ; anciennes commandes sans productTotal : grille de la wilaya
  const delivery = Number(o.productTotal) > 0
    ? Math.max(0, total - Number(o.productTotal))
    : (DELIVERY_PRICES[o.wilaya]?.[o.deliveryType === 'desk' ? 'desk' : 'home'] ?? 0);
  const desk = o.deliveryType === 'desk';
  return {
    key: id,
    sheet: sheetTabFor(o),
    row: [
      algiersDate(toDate(o.createdAt)),
      String(o.name || ''),
      String(o.phone || ''),
      String(o.wilaya || o.city || ''),
      String(o.commune || ''),
      `${delivery} ${unit}`,
      desk ? 'التوصيل للمكتب' : 'التوصيل لباب المنزل',
      `${total} ${unit}`,
      '',
      desk ? 'STOP DESK' : 'A DOMICILE',
      '',
    ],
  };
}

// version, spreadsheet, sheetName, rows : script v2 ; tabs (nombre de commandes par onglet produit) : script v3
export type SheetResult = { ok: boolean; added?: number; sheetUrl?: string; error?: string; version?: number; spreadsheet?: string; sheetName?: string; rows?: number; tabs?: Record<string, number> };

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
    return { ok: true, added: Number(data.added) || 0, sheetUrl: data.sheetUrl, version: data.version, spreadsheet: data.spreadsheet, sheetName: data.sheetName, rows: data.rows, tabs: data.tabs };
  } catch (err: any) {
    return { ok: false, error: err?.name === 'AbortError' ? 'Le script Google ne répond pas (délai dépassé).' : String(err?.message || err) };
  } finally {
    clearTimeout(timer);
  }
}
