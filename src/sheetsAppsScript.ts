// Code Google Apps Script à coller dans la feuille (Extensions > Apps Script), généré avec le code secret du dashboard.
// Il reçoit les commandes envoyées par le serveur (api/_sheets.ts) et les range dans un onglet par produit,
// avec les colonnes du modèle de la boutique (export YouCan).
// SHEETS_SCRIPT_VERSION : le dashboard compare avec la version renvoyée par le script installé.
export const SHEETS_SCRIPT_VERSION = 3;

export const buildAppsScript = (secret: string) => `// YANIS SHOP → Google Sheets (version ${SHEETS_SCRIPT_VERSION})
// Collez ce code dans Extensions > Apps Script de votre feuille, puis :
// Déployer > Nouveau déploiement > Application Web
//   Exécuter en tant que : Moi   |   Qui a accès : Tout le monde
// Copiez l'URL (…/exec) dans le dashboard, onglet Intégrations.
// Mise à jour du script : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer (l'URL ne change pas).

const SECRET = '${secret}';
const VERSION = ${SHEETS_SCRIPT_VERSION};
const HEADERS = ['Order ID', 'Order date', 'الاسم الكامل 👤', 'رقم الهاتف 📞', 'الولاية 🌎', 'البلدية 🏠', 'سعر التوصيل', 'التوصيل 🚚', 'السعر الاجمالي', 'confirmation', 'Livraison', ''];
const WIDTHS = [70, 140, 150, 115, 140, 110, 90, 140, 105, 110, 95, 160];
const CONFIRMATION = ['Non Validé', 'Validé par tel', 'Confirmé ', 'Expedié', 'Annulé', 'reporté', 'Livré', 'RPN PAS 1', 'RPN PAS 2', 'RPN PAS 3', 'non joinable', 'Racrouche', 'En attente', 'A rappeler', 'Risque Elveé'];
const LIVRAISON = ['A DOMICILE', 'STOP DESK'];
const KEY_COL = 26; // colonne Z, masquée : référence de la commande sur le site (évite les doublons)

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: 'json' }); }
  if (data.secret !== SECRET) return reply({ ok: false, error: 'secret' });

  // Un seul envoi à la fois : deux commandes simultanées ne peuvent pas prendre le même numéro
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const byTab = {};
    (data.orders || []).forEach(function (o) {
      if (o && o.key && o.sheet && o.row) (byTab[o.sheet] = byTab[o.sheet] || []).push(o);
    });
    let added = 0;
    let firstTab = null;
    Object.keys(byTab).forEach(function (name) {
      const sheet = getTab(name);
      if (!firstTab) firstTab = sheet;
      const last = sheet.getLastRow();
      const known = new Set(last > 1 ? sheet.getRange(2, KEY_COL, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : []);
      let next = nextNumber(sheet);
      const rows = [];
      const keys = [];
      byTab[name].forEach(function (o) {
        if (known.has(String(o.key))) return; // déjà dans l'onglet : pas de doublon
        known.add(String(o.key));
        const row = [String(next++).padStart(3, '0')].concat(o.row.map(String));
        while (row.length < HEADERS.length) row.push('');
        rows.push(row.slice(0, HEADERS.length));
        keys.push([String(o.key)]);
      });
      if (rows.length) {
        const start = sheet.getLastRow() + 1;
        // tout en texte, comme le modèle : garde le 0 du numéro de téléphone et le format de l'Order ID (001)
        sheet.getRange(start, 1, rows.length, HEADERS.length).setNumberFormat('@').setValues(rows);
        sheet.getRange(start, KEY_COL, rows.length, 1).setNumberFormat('@').setValues(keys);
        added += rows.length;
      }
    });
    SpreadsheetApp.flush();
    return reply(info(firstTab, { added: added }));
  } finally {
    lock.releaseLock();
  }
}

// Ouvrir l'URL /exec dans le navigateur affiche l'état du script (sans données client)
function doGet() {
  return reply(info(null, {}));
}

// Onglets créés par ce script (en-tête « Order ID ») et nombre de commandes dans chacun
function info(sheet, extra) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = {};
  ss.getSheets().forEach(function (s) {
    if (s.getLastRow() > 0 && s.getRange(1, 1).getValue() === 'Order ID' && s.getRange(1, KEY_COL).getValue() === 'ref') tabs[s.getName()] = Math.max(s.getLastRow() - 1, 0);
  });
  const out = { ok: true, version: VERSION, spreadsheet: ss.getName(), tabs: tabs, sheetUrl: ss.getUrl() + (sheet ? '#gid=' + sheet.getSheetId() : '') };
  for (const k in extra) out[k] = extra[k];
  return out;
}

// Prochain Order ID de l'onglet : plus grand numéro de la colonne A + 1
function nextNumber(sheet) {
  const last = sheet.getLastRow();
  let max = 0;
  if (last > 1) sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) {
    const n = parseInt(String(r[0]), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return max + 1;
}

// Onglet du produit, créé au besoin avec l'en-tête et les listes du modèle
function getTab(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name, 0);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#6aa84f');
    sheet.getRange(1, KEY_COL).setValue('ref');
    sheet.setFrozenRows(1);
    // listes déroulantes ; un texte libre reste accepté (notes de l'équipe)
    sheet.getRange('J2:J').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CONFIRMATION, true).setAllowInvalid(true).build());
    sheet.getRange('K2:K').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(LIVRAISON, true).setAllowInvalid(true).build());
    WIDTHS.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
    sheet.hideColumns(KEY_COL);
  }
  return sheet;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;
