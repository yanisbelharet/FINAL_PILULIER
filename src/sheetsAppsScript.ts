// Code Google Apps Script à coller dans la feuille (Extensions > Apps Script), généré avec le code secret du dashboard.
// Il reçoit les commandes envoyées par le serveur (api/_sheets.ts) et les ajoute à l'onglet « Commandes ».
export const buildAppsScript = (secret: string) => `// YANIS SHOP → Google Sheets
// Collez ce code dans Extensions > Apps Script de votre feuille, puis :
// Déployer > Nouveau déploiement > Application Web
//   Exécuter en tant que : Moi   |   Qui a accès : Tout le monde
// Copiez l'URL (…/exec) dans le dashboard, onglet Intégrations.

const SECRET = '${secret}';
const SHEET_NAME = 'Commandes';
const TIMEZONE = 'Africa/Algiers';
const HEADERS = ['ID', 'N°', 'Date', 'Client', 'Téléphone', 'Wilaya', 'Commune', 'Adresse', 'Livraison', 'Produit', 'Offre', 'Quantité', 'Total (DA)', 'Source'];

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: 'json' }); }
  if (data.secret !== SECRET) return reply({ ok: false, error: 'secret' });

  // Un seul envoi à la fois : deux commandes simultanées ne peuvent pas écrire sur la même ligne
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet();
    const last = sheet.getLastRow();
    const known = new Set(last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : []);
    const rows = [];
    (data.orders || []).forEach(function (o) {
      if (!o || !o.id || known.has(String(o.id))) return; // déjà dans la feuille : pas de doublon
      known.add(String(o.id));
      let d = new Date(o.createdAt);
      if (isNaN(d.getTime())) d = new Date();
      rows.push([String(o.id), String(o.number || ''), Utilities.formatDate(d, TIMEZONE, 'dd/MM/yyyy HH:mm'), o.name || '', String(o.phone || ''),
        o.wilaya || '', o.commune || '', o.address || '', o.delivery || '', o.product || '', o.offer || '', Number(o.quantity) || 1, Number(o.total) || 0, o.source || '']);
    });
    if (rows.length) {
      const start = sheet.getLastRow() + 1;
      // ID, N°, date, client et téléphone en texte : garde le 0 au début du numéro
      sheet.getRange(start, 1, rows.length, 5).setNumberFormat('@');
      sheet.getRange(start, 1, rows.length, HEADERS.length).setValues(rows);
    }
    return reply({ ok: true, added: rows.length, sheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl() });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;
