// Code Google Apps Script à coller dans la feuille (Extensions > Apps Script), généré avec le code secret du dashboard.
// Il reçoit les commandes envoyées par le serveur (api/_sheets.ts) et les ajoute à l'onglet « Commandes ».
// SHEETS_SCRIPT_VERSION : le dashboard compare avec la version renvoyée par le script installé.
export const SHEETS_SCRIPT_VERSION = 2;

export const buildAppsScript = (secret: string) => `// YANIS SHOP → Google Sheets (version ${SHEETS_SCRIPT_VERSION})
// Collez ce code dans Extensions > Apps Script de votre feuille, puis :
// Déployer > Nouveau déploiement > Application Web
//   Exécuter en tant que : Moi   |   Qui a accès : Tout le monde
// Copiez l'URL (…/exec) dans le dashboard, onglet Intégrations.
// Mise à jour du script : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer (l'URL ne change pas).

const SECRET = '${secret}';
const VERSION = ${SHEETS_SCRIPT_VERSION};
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
      SpreadsheetApp.flush();
    }
    return reply(info(sheet, { added: rows.length }));
  } finally {
    lock.releaseLock();
  }
}

// Ouvrir l'URL /exec dans le navigateur affiche l'état du script (sans données client)
function doGet() {
  return reply(info(getSheet(), {}));
}

function info(sheet, extra) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const out = { ok: true, version: VERSION, spreadsheet: ss.getName(), sheetName: sheet.getName(),
    rows: Math.max(sheet.getLastRow() - 1, 0), sheetUrl: ss.getUrl() + '#gid=' + sheet.getSheetId() };
  for (const k in extra) out[k] = extra[k];
  return out;
}

// L'onglet « Commandes » est toujours le premier : c'est celui qu'on voit en ouvrant la feuille
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    const first = ss.getSheets()[0];
    if (first && first.getLastRow() === 0 && first.getLastColumn() === 0) {
      first.setName(SHEET_NAME); // feuille neuve : on prend le premier onglet vide
      sheet = first;
    } else {
      sheet = ss.insertSheet(SHEET_NAME, 0);
    }
  }
  if (sheet.getIndex() !== 1) {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(1);
  }
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
