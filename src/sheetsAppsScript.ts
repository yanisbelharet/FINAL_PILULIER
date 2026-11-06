// Code Google Apps Script à coller dans la feuille (Extensions > Apps Script), généré avec le code secret du dashboard.
// Il reçoit les commandes envoyées par le serveur (api/_sheets.ts) et les range dans un onglet par produit,
// avec les colonnes du modèle de la boutique (export YouCan) + « الكمية », et tient à jour un onglet « Statistiques ».
// SHEETS_SCRIPT_VERSION : le dashboard compare avec la version renvoyée par le script installé.
// Attention : ce code est un gabarit (template literal) : pas de backtick, pas de « ${ », pas d'antislash dans le script.
export const SHEETS_SCRIPT_VERSION = 6;

export const buildAppsScript = (secret: string) => `// YANIS SHOP → Google Sheets (version ${SHEETS_SCRIPT_VERSION})
// Collez ce code dans Extensions > Apps Script de votre feuille, puis :
// Déployer > Nouveau déploiement > Application Web
//   Exécuter en tant que : Moi   |   Qui a accès : Tout le monde
// Copiez l'URL (…/exec) dans le dashboard, onglet Intégrations.
// Mise à jour du script : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer (l'URL ne change pas).

const SECRET = '${secret}';
const VERSION = ${SHEETS_SCRIPT_VERSION};
const HEADERS = ['Order ID', 'Order date', 'الاسم الكامل 👤', 'رقم الهاتف 📞', 'الولاية 🌎', 'البلدية 🏠', 'سعر التوصيل', 'التوصيل 🚚', 'الكمية 📦', 'السعر الاجمالي', 'confirmation', 'Livraison', ''];
const WIDTHS = [70, 140, 150, 115, 140, 110, 90, 140, 75, 105, 110, 95, 160];
const QTY_COL = 9;      // I : quantité (1, 2+1, 4+2…)
const STATUS_COL = 11;  // K : confirmation
const CONFIRMATION = ['Non Validé', 'Validé par tel', 'Confirmé ', 'Expedié', 'Annulé', 'reporté', 'Livré', 'RPN PAS 1', 'RPN PAS 2', 'RPN PAS 3', 'non joinable', 'Racrouche', 'En attente', 'A rappeler', 'Risque Elveé'];
const LIVRAISON = ['A DOMICILE', 'STOP DESK'];
const KEY_COL = 26; // colonne masquée « ref » (Z dans un onglet créé en v4) : référence de la commande sur le site, évite les doublons
const STATS = 'Statistiques';

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
      const keyCol = refCol(sheet);
      const last = sheet.getLastRow();
      const keys0 = last > 1 ? sheet.getRange(2, keyCol, last - 1, 1).getValues() : [];
      const qtys = last > 1 ? sheet.getRange(2, QTY_COL, last - 1, 1).getValues() : [];
      const known = {};
      keys0.forEach(function (r, i) { if (String(r[0])) known[String(r[0])] = i; });
      let next = nextNumber(sheet);
      let qtyChanged = false;
      const rows = [];
      const keys = [];
      byTab[name].forEach(function (o) {
        const k = String(o.key);
        if (known[k] !== undefined) {
          // déjà dans l'onglet : pas de doublon, mais on complète la quantité des lignes qui n'en ont pas
          const i = known[k];
          if (i >= 0 && o.qty && String(qtys[i][0]) === '') { qtys[i][0] = String(o.qty); qtyChanged = true; }
          return;
        }
        known[k] = -1;
        const r = (o.row || []).map(String);
        const row = [String(next++).padStart(3, '0')].concat(r.slice(0, 7), [String(o.qty || '')], r.slice(7));
        while (row.length < HEADERS.length) row.push('');
        rows.push(row.slice(0, HEADERS.length));
        keys.push([k]);
      });
      if (qtyChanged) sheet.getRange(2, QTY_COL, qtys.length, 1).setNumberFormat('@').setValues(qtys);
      if (rows.length) {
        const start = sheet.getLastRow() + 1;
        // tout en texte, comme le modèle : garde le 0 du numéro de téléphone et le format de l'Order ID (001)
        sheet.getRange(start, 1, rows.length, HEADERS.length).setNumberFormat('@').setValues(rows);
        sheet.getRange(start, keyCol, rows.length, 1).setNumberFormat('@').setValues(keys);
        added += rows.length;
      }
    });
    ensureStats();
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

// Colonne « ref » de l'onglet (Z, ou AA pour un onglet v3 auquel la colonne quantité a été ajoutée)
function refCol(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return KEY_COL;
  const i = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf('ref');
  return i >= 0 ? i + 1 : KEY_COL;
}

function isOrderTab(s) {
  return s.getLastRow() > 0 && s.getRange(1, 1).getValue() === 'Order ID' && s.getLastColumn() >= KEY_COL && s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].indexOf('ref') >= 0;
}

function orderTabs() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().filter(isOrderTab);
}

// Onglets créés par ce script et nombre de commandes dans chacun
function info(sheet, extra) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = {};
  orderTabs().forEach(function (s) { tabs[s.getName()] = Math.max(s.getLastRow() - 1, 0); });
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
    sheet.getRange('K2:K').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CONFIRMATION, true).setAllowInvalid(true).build());
    sheet.getRange('L2:L').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(LIVRAISON, true).setAllowInvalid(true).build());
    WIDTHS.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
    sheet.hideColumns(KEY_COL);
  } else if (sheet.getRange(1, QTY_COL).getValue() === 'السعر الاجمالي') {
    // onglet créé par la version 3 : on insère la colonne quantité après « التوصيل » (les autres colonnes se décalent)
    sheet.insertColumnAfter(QTY_COL - 1);
    sheet.getRange(1, QTY_COL).setValue(HEADERS[QTY_COL - 1]).setFontWeight('bold').setBackground('#6aa84f');
    sheet.setColumnWidth(QTY_COL, WIDTHS[QTY_COL - 1]);
  }
  return sheet;
}

// ---------- Onglet « Statistiques » : formules, recalculées par Google Sheets à chaque modification ----------

const PERIODS = [
  ["Aujourd'hui", 'TODAY()', 'TODAY()'],
  ['Hier', 'TODAY()-1', 'TODAY()-1'],
  ["Hier + aujourd'hui", 'TODAY()-1', 'TODAY()'],
  ['7 derniers jours', 'TODAY()-6', 'TODAY()'],
  ['30 derniers jours', 'TODAY()-29', 'TODAY()'],
  ['Ce mois', 'EOMONTH(TODAY(),-1)+1', 'TODAY()'],
  ['Mois dernier', 'EOMONTH(TODAY(),-2)+1', 'EOMONTH(TODAY(),-1)'],
  ['Tout', 'DATE(2000,1,1)', 'TODAY()'],
  ['Dates choisies', '$B$4', '$B$5']
];
const S_CONF = ['confirmé', 'confirme', 'confirmée', 'validé par tel', 'valide par tel', 'expedié', 'expédié', 'expedie', 'livré', 'livre'];
const S_SHIP = ['expedié', 'expédié', 'expedie', 'livré', 'livre'];
const S_DELIV = ['livré', 'livre'];
const S_CANCEL = ['annulé', 'annule', 'annulée'];
const S_REPORT = ['reporté', 'reporte'];
const S_UNREACH = ['rpn pas 1', 'rpn pas 2', 'rpn pas 3', 'non joinable', 'racrouche', 'raccroche'];
const S_PENDING = ['en attente', 'a rappeler', 'à rappeler'];
const S_RISK = ['risque elveé', 'risque elevé', 'risque élevé'];

function q(s) { return '"' + s + '"'; }

// Produits suivis dans l'onglet Statistiques
const STATS_TABS = ['Stop Fuites 1,4 kg'];

// Lignes du tableau : [libellé, type, paramètre] ; types : n = nombre de commandes, p = pièces, ca = montant, r = taux (ligne a / ligne b)
const STAT_ROWS = [
  ['Commandes reçues', 'n', null],
  ['Commandes confirmées', 'n', S_CONF],
  ['Taux de confirmation (confirmées ÷ reçues)', 'r', [1, 0]],
  ['Commandes expédiées', 'n', S_SHIP],
  ["Taux d'expédition (expédiées ÷ confirmées)", 'r', [3, 1]],
  ['Commandes livrées', 'n', S_DELIV],
  ['Taux de livraison (livrées ÷ expédiées)', 'r', [5, 3]],
  ['Pièces confirmées', 'p', S_CONF],
  ['Pièces expédiées', 'p', S_SHIP],
  ['Pièces livrées', 'p', S_DELIV],
  ['Annulées', 'n', S_CANCEL],
  ["Taux d'annulation (annulées ÷ reçues)", 'r', [10, 0]],
  ['Reportées', 'n', S_REPORT],
  ['Injoignables (RPN PAS 1/2/3, non joinable, raccroche)', 'n', S_UNREACH],
  ['En attente / à rappeler', 'n', S_PENDING],
  ['Risque élevé', 'n', S_RISK],
  ['Non traitées (vide ou Non Validé)', 'n', 'untreated'],
  ['Autres statuts (texte libre)', 'other', null],
  ['Livraison à domicile (reçues)', 'n', 'home'],
  ['Livraison Stop Desk (reçues)', 'n', 'desk'],
  ['Montant confirmé', 'ca', S_CONF],
  ['Montant expédié', 'ca', S_SHIP],
  ['Montant livré', 'ca', S_DELIV]
];
const TOP = 8; // ligne d'en-tête du tableau

// Séparateur d'arguments des formules : « , » (réglages anglais) ou « ; » (réglages français…).
// Les formules sont écrites avec des virgules puis converties (hors textes "…" et noms d'onglets '…').
let SEP = ',';
function loc(f) {
  if (SEP === ',') return f;
  let out = '', dq = false, sq = false;
  for (let i = 0; i < f.length; i++) {
    const c = f[i];
    if (c === '"' && !sq) dq = !dq;
    else if (c === "'" && !dq) sq = !sq;
    out += (c === ',' && !dq && !sq) ? SEP : c;
  }
  return out;
}
function detectSep(sh) {
  const probe = sh.getRange('Z2');
  const seps = [',', ';'];
  for (let i = 0; i < seps.length; i++) {
    probe.setFormula('=SUM(1' + seps[i] + '2)');
    SpreadsheetApp.flush();
    if (probe.getValue() === 3) { probe.clearContent(); return seps[i]; }
  }
  probe.clearContent();
  return ',';
}

// Formule d'une cellule pour l'onglet produit « name »
function statFormula(name, type, param) {
  const t = "'" + name.replace(/'/g, "''") + "'!";
  // jour de la commande (colonne Order date « 2026-11-05 21:59:46 ») comparé aux dates E3 / E4
  const day = 'IFERROR(DATE(VALUE(LEFT(' + t + 'B2:B,4)),VALUE(MID(' + t + 'B2:B,6,2)),VALUE(MID(' + t + 'B2:B,9,2))),0)';
  const inPeriod = '(' + day + '>=$E$3)*(' + day + '<=$E$4)*(LEN(' + t + 'A2:A)>0)';
  const st = 'LOWER(TRIM(' + t + 'K2:K))';
  let cond = '1';
  if (param === 'untreated') cond = '((' + st + '="")+(' + st + '="non validé")>0)';
  else if (param === 'home') cond = '(UPPER(TRIM(' + t + 'L2:L))="A DOMICILE")';
  else if (param === 'desk') cond = '(UPPER(TRIM(' + t + 'L2:L))="STOP DESK")';
  else if (param) cond = '((' + param.map(function (v) { return '(' + st + '=' + q(v) + ')'; }).join('+') + ')>0)';
  let value = '1';
  if (type === 'p') {
    // « 4+2+1 » → 7 pièces (jusqu'à 4 nombres)
    const qty = t + 'I2:I&""';
    const parts = ['^([0-9]+)', '^[0-9]+[+]([0-9]+)', '^[0-9]+[+][0-9]+[+]([0-9]+)', '^[0-9]+[+][0-9]+[+][0-9]+[+]([0-9]+)'];
    value = '(' + parts.map(function (re) { return 'IFERROR(VALUE(REGEXEXTRACT(' + qty + ',' + q(re) + ')),0)'; }).join('+') + ')';
  } else if (type === 'ca') {
    value = 'IFERROR(VALUE(REGEXREPLACE(' + t + 'J2:J&"","[^0-9]","")),0)';
  }
  return '=ARRAYFORMULA(SUMPRODUCT(' + inPeriod + '*' + cond + '*' + value + '))';
}

function colLetter(c) {
  let s = '';
  while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); }
  return s;
}

// Crée ou met à jour l'onglet Statistiques (la période choisie est conservée)
function ensureStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const present = orderTabs().map(function (s) { return s.getName(); });
  const tabs = STATS_TABS.filter(function (n) { return present.indexOf(n) >= 0; });
  const signature = 'v' + VERSION + ':' + JSON.stringify(tabs);
  let sh = ss.getSheetByName(STATS);
  if (sh && sh.getRange('Z1').getValue() === signature) return;

  let period = PERIODS[0][0], from = '', to = '';
  if (sh) {
    period = sh.getRange('B3').getValue() || period;
    from = sh.getRange('B4').getValue();
    to = sh.getRange('B5').getValue();
    sh.clear();
    sh.getRange('A1:Z200').clearDataValidations();
  } else {
    sh = ss.insertSheet(STATS, 0);
  }
  SEP = detectSep(sh);

  sh.getRange('A1').setValue('📊 Statistiques — ' + STATS_TABS.join(', ')).setFontWeight('bold').setFontSize(14);
  sh.getRange('A3:A5').setValues([['Période'], ['Du (si « Dates choisies »)'], ['Au (si « Dates choisies »)']]).setFontWeight('bold');
  sh.getRange('B3').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(PERIODS.map(function (p) { return p[0]; }), true).build()).setValue(period).setBackground('#fff2cc').setFontWeight('bold');
  sh.getRange('B4:B5').setDataValidation(SpreadsheetApp.newDataValidation().requireDate().build()).setNumberFormat('dd/mm/yyyy').setBackground('#fff2cc');
  sh.getRange('B4').setValue(from);
  sh.getRange('B5').setValue(to);
  // Début et fin de la période
  const sw = function (i) { return '=SWITCH($B$3,' + PERIODS.map(function (p) { return q(p[0]) + ',' + p[i]; }).join(',') + ',TODAY())'; };
  sh.getRange('D3:D4').setValues([['Du'], ['Au']]).setFontWeight('bold');
  sh.getRange('E3').setFormula(loc(sw(1)));
  sh.getRange('E4').setFormula(loc(sw(2)));
  sh.getRange('E3:E4').setNumberFormat('dd/mm/yyyy').setFontWeight('bold');
  sh.getRange('A6').setValue('Confirmées = Confirmé, Validé par tel, Expedié, Livré · Expédiées = Expedié, Livré · Pièces : 2+1 = 3 · Montants : colonne « السعر الاجمالي » (livraison comprise)').setFontColor('#666666');

  if (!tabs.length) {
    sh.getRange(TOP, 1).setValue("L'onglet « " + STATS_TABS.join(', ') + ' » sera analysé dès sa première commande.');
  } else {
    // En-tête : Indicateur | un produit par colonne ; tout le tableau en quelques appels groupés
    const header = ['Indicateur'].concat(tabs);
    sh.getRange(TOP, 1, 1, header.length).setValues([header]).setFontWeight('bold').setBackground('#6aa84f').setWrap(true);
    const width = tabs.length;
    const labels = [], formulas = [], formats = [], backgrounds = [], weights = [];
    STAT_ROWS.forEach(function (def) {
      const type = def[1];
      const rate = function (col) { const a = colLetter(col) + (TOP + 1 + def[2][0]), b = colLetter(col) + (TOP + 1 + def[2][1]); return '=IFERROR(' + a + '/' + b + ',0)'; };
      const other = function (col) { const L = colLetter(col); return '=' + L + (TOP + 1) + '-' + L + (TOP + 2) + '-SUM(' + L + (TOP + 11) + ',' + L + (TOP + 13) + ':' + L + (TOP + 17) + ')'; };
      const line = tabs.map(function (name, i) {
        const col = 2 + i;
        return loc(type === 'r' ? rate(col) : type === 'other' ? other(col) : statFormula(name, type, def[2]));
      });
      labels.push([def[0]]);
      formulas.push(line);
      const f = type === 'r' ? '0.0%' : type === 'ca' ? '#,##0" دج"' : '0';
      formats.push(line.map(function () { return f; }));
      const bg = type === 'r' ? '#d9ead3' : null;
      backgrounds.push([bg].concat(line.map(function () { return bg; })));
      weights.push([type === 'r' ? 'bold' : 'normal'].concat(line.map(function () { return 'bold'; })));
    });
    const n = STAT_ROWS.length;
    sh.getRange(TOP + 1, 1, n, 1).setValues(labels);
    sh.getRange(TOP + 1, 2, n, width).setFormulas(formulas).setNumberFormats(formats);
    sh.getRange(TOP + 1, 1, n, width + 1).setBackgrounds(backgrounds).setFontWeights(weights);
    sh.setColumnWidths(2, width, 160);
  }
  sh.setColumnWidth(1, 330);
  sh.setFrozenRows(TOP);
  sh.getRange('Z1').setValue(signature);
  sh.hideColumns(26);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;
