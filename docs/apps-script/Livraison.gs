// ===== Livraison automatique + suivi (EcoTrack : HHD, SWIFT, NAVEX) — version 2 =====
// 1. Envoi : une commande de « Stop Fuites 1,4 kg » passée en « Expedié » est créée chez la société choisie
//    (colonne « Société de livraison » : HHD, SWIFT ou NAVEX). Le tracking s'inscrit dans la colonne « Tracking »
//    et le résultat dans « Envoi ». En cas d'erreur (❌), corrigez la ligne puis videz la case « Envoi » pour réessayer.
// 2. Suivi : l'onglet « Suivi » reçoit les commandes expédiées et leur statut de livraison (toutes les 30 minutes).
// Installation : remplacer tout le contenu du fichier « Suivi » par ce code, enregistrer,
// choisir suiviInstaller en haut, cliquer Exécuter (le script tourne ensuite toutes les 5 minutes).

const LIV_SOCIETES = {
  HHD:   { url: 'https://hhdexpress.ecotrack.dz', token: '__HHD_TOKEN__', stock: '' },
  SWIFT: { url: 'https://swift.ecotrack.dz', token: '__SWIFT_TOKEN__', stock: '' },
  NAVEX: { url: 'https://navexdelivery.ecotrack.dz', token: '__NAVEX_TOKEN__', stock: 'pigma' } // produit stocké chez NAVEX
};
const LIV_SOURCE = 'Stop Fuites 1,4 kg';
const LIV_DEPUIS = '2026-11-09';  // commandes plus anciennes : jamais créées automatiquement (colis déjà faits à la main)
const LIV_VALIDER = false;        // true : valider l'expédition chez la société juste après la création du colis
const LIV_COMMUNES_URL = 'https://yanis2shop.vercel.app/ecotrack-communes.json';
const SUIVI_ONGLET = 'Suivi';
const SUIVI_ENTETES = ['Order ID', 'Date commande', 'Client', 'Téléphone', 'Wilaya', 'Commune', 'Quantité', 'Montant', 'Société', 'Tracking', 'Statut livraison', 'Statut EcoTrack', 'Dernier événement', 'Date événement', 'Mis à jour le'];

function suiviInstaller() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'suiviSync') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('suiviSync').timeBased().everyMinutes(5).create();
  PropertiesService.getScriptProperties().deleteProperty('livSuiviDernier');
  suiviSync();
}

function suiviSync() {
  const lock = LockService.getDocumentLock(); // distinct du verrou du script du site (réception des commandes)
  if (!lock.tryLock(5000)) return;
  try {
    const nouveaux = livEnvoyer_();
    const props = PropertiesService.getScriptProperties();
    const dernier = Number(props.getProperty('livSuiviDernier') || 0);
    if (nouveaux || Date.now() - dernier > 25 * 60 * 1000) {
      livSuivi_();
      props.setProperty('livSuiviDernier', String(Date.now()));
    }
  } finally {
    lock.releaseLock();
  }
}

// ---------- 1. Envoi des commandes expédiées ----------
function livEnvoyer_() {
  const src = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LIV_SOURCE);
  if (!src) return 0;
  const data = src.getDataRange().getValues();
  const c = livColonnes_(data[0]);
  if (c.trk < 0 || c.env < 0) return 0;
  const now = livMaintenant_();
  const ecrire = function (row, col, val) { if (col >= 0 && String(data[row][col]) !== String(val)) { src.getRange(row + 1, col + 1).setValue(val); data[row][col] = val; } };

  const aTraiter = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!String(r[c.id] || '').trim() || !/^exp/i.test(String(r[c.st] || '').trim())) continue;
    if (String(r[c.trk] || '').trim()) continue;
    const env = String(r[c.env] || '');
    if (/^❌/.test(env)) continue; // erreur : attend une correction (vider la case Envoi pour réessayer)
    const soc = livSociete_(r[c.soc]);
    if (!LIV_SOCIETES[soc]) {
      ecrire(i, c.env, soc ? 'ℹ️ ' + String(r[c.soc]).trim() + ' : pas d\'envoi automatique' : '⚠️ Choisissez la société (HHD, SWIFT ou NAVEX)');
      continue;
    }
    aTraiter.push({ i: i, soc: soc });
  }
  if (!aTraiter.length) return 0;

  // colis déjà présents chez chaque société (évite les doublons avec les colis créés à la main)
  const minJour = aTraiter.map(function (t) { return String(data[t.i][c.date]).slice(0, 10); }).sort()[0];
  const existants = {};
  const communes = livCommunes_();
  let crees = 0;
  aTraiter.forEach(function (t) {
    const r = data[t.i];
    const cfg = LIV_SOCIETES[t.soc];
    if (!existants[t.soc]) existants[t.soc] = livColisRecents_(cfg, minJour);
    const tel = livTel_(r[c.tel]);
    const jour = String(r[c.date]).slice(0, 10);
    const deja = existants[t.soc].filter(function (o) { return !o.pris && tel && (o.tel === tel || o.tel2 === tel) && o.date.slice(0, 10) >= jour; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
    if (deja) {
      deja.pris = true;
      ecrire(t.i, c.trk, deja.tracking);
      ecrire(t.i, c.env, '🔗 Colis déjà créé chez ' + t.soc + ' : lié (' + now + ')');
      return;
    }
    if (jour < LIV_DEPUIS) { ecrire(t.i, c.env, '⚠️ Colis introuvable chez ' + t.soc + ' (commande d\'avant l\'automatisation) : collez le tracking à la main'); return; }

    // commune : table du site (arabe → nom EcoTrack), ou nom français écrit à la main dans la colonne البلدية
    const wil = parseInt(String(r[c.wil]), 10);
    const com = String(r[c.com] || '').trim();
    let dest = communes && communes[wil] && communes[wil][com];
    if (!dest && /[a-z]/i.test(com)) dest = com;
    if (!dest) { ecrire(t.i, c.env, '❌ Commune inconnue chez EcoTrack : écrivez son nom en français dans البلدية puis videz cette case'); return; }
    const nomCommune = Array.isArray(dest) ? dest[0] : dest;
    const codeWilaya = Array.isArray(dest) ? dest[1] : wil;

    const livraison = String(r[c.liv] || '').toUpperCase();
    const stopDesk = /STOP/.test(livraison) ? 1 : /DOMICILE/.test(livraison) ? 0 : (/للمكتب/.test(String(r[c.type] || '')) ? 1 : 0);
    const qtyLabel = String(r[c.qty] || '').trim();
    const pieces = (qtyLabel.match(/\d+/g) || ['1']).reduce(function (s, n) { return s + Number(n); }, 0);
    let ref = String(r[c.ref] || '').trim() || cfg.stock;
    let qte = String(r[c.qte] || '').trim() || (ref ? String(pieces) : '');
    if (ref) { ecrire(t.i, c.ref, ref); ecrire(t.i, c.qte, qte); }

    const params = {
      reference: String(r[c.id]).trim(),
      nom_client: String(r[c.nom] || '').trim().slice(0, 255) || 'Client',
      telephone: tel ? '0' + tel : String(r[c.tel]),
      adresse: (com + ' - ' + String(r[c.wil] || '')).slice(0, 255),
      commune: nomCommune,
      code_wilaya: String(codeWilaya),
      montant: String(String(r[c.tot] || '').replace(/[^0-9]/g, '') || '0'),
      remarque: String(c.rem >= 0 ? r[c.rem] : '').trim().slice(0, 255),
      produit: ref || ('Stop Fuites 1,4 kg' + (qtyLabel ? ' (' + qtyLabel + ')' : '')),
      stock: ref ? '1' : '0',
      type: '1',
      stop_desk: String(stopDesk)
    };
    if (ref) params.quantite = qte;
    const res = livPost_(cfg, '/api/v1/create/order', params);
    if (res && res.tracking) {
      crees++;
      ecrire(t.i, c.trk, res.tracking);
      let msg = '✅ Envoyé à ' + t.soc + ' le ' + now;
      if (LIV_VALIDER) {
        const v = livPost_(cfg, '/api/v1/valid/order?tracking=' + encodeURIComponent(res.tracking), {});
        msg += v && v.success ? ' · validé' : ' · validation à faire chez ' + t.soc;
      }
      ecrire(t.i, c.env, msg);
    } else {
      ecrire(t.i, c.env, '❌ ' + t.soc + ' : ' + livErreur_(res));
    }
    Utilities.sleep(1300); // limite de l'API : 50 requêtes par minute
  });
  return crees;
}

// ---------- 2. Onglet « Suivi » : statut de livraison ----------
function livSuivi_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const src = ss.getSheetByName(LIV_SOURCE);
  if (!src) return;
  const sh = livOngletSuivi_(ss);
  const now = livMaintenant_();
  const data = src.getDataRange().getValues();
  const c = livColonnes_(data[0]);
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, SUIVI_ENTETES.length).getValues() : [];
  const known = {};
  rows.forEach(function (r, i) { known[String(r[0])] = i; });
  data.slice(1).forEach(function (r) {
    const st = String(r[c.st] || '').trim().toLowerCase();
    const id = String(r[c.id] || '').trim();
    if (!id || !/^(exp|livr)/.test(st)) return;
    const trk = c.trk >= 0 ? String(r[c.trk] || '').trim() : '';
    const soc = livSociete_(r[c.soc]);
    if (known[id] !== undefined) {
      const s = rows[known[id]];
      if (trk && !s[9]) { s[9] = trk; s[8] = soc; } // tracking connu depuis la feuille des commandes
      return;
    }
    known[id] = rows.length;
    rows.push([id, String(r[c.date]), r[c.nom], String(r[c.tel]), r[c.wil], r[c.com], c.qty >= 0 ? String(r[c.qty]) : '', r[c.tot],
      soc, trk, trk ? 'En acheminement' : 'Recherche du colis…', '', '', '', now]);
  });
  if (!rows.length) return;

  // colis sans tracking : recherche par téléphone chez les 3 sociétés
  const used = {};
  rows.forEach(function (r) { if (r[9]) used[r[9]] = true; });
  const todo = rows.filter(function (r) { return !r[9]; });
  if (todo.length) {
    const minJour = todo.map(function (r) { return String(r[1]).slice(0, 10); }).sort()[0];
    const colis = [];
    Object.keys(LIV_SOCIETES).forEach(function (nom) {
      livColisRecents_(LIV_SOCIETES[nom], minJour).forEach(function (o) { o.p = nom; colis.push(o); });
    });
    todo.forEach(function (r) {
      const tel = livTel_(r[3]);
      const jour = String(r[1]).slice(0, 10);
      const cand = colis.filter(function (o) {
        return !used[o.tracking] && tel && (o.tel === tel || o.tel2 === tel) && o.date.slice(0, 10) >= jour && (!r[8] || r[8] === o.p);
      }).sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0];
      if (cand) { r[9] = cand.tracking; r[8] = cand.p; used[cand.tracking] = true; }
      else { r[10] = 'Introuvable chez HHD / SWIFT / NAVEX'; r[14] = now; }
    });
  }

  // statut des colis connus (100 par requête et par société)
  Object.keys(LIV_SOCIETES).forEach(function (nom) {
    const cfg = LIV_SOCIETES[nom];
    const mine = rows.filter(function (r) { return r[9] && r[8] === nom; });
    for (let i = 0; i < mine.length; i += 100) {
      const lot = mine.slice(i, i + 100);
      const res = livGet_(cfg, '/api/v1/get/orders/status?status=all&trackings=' + lot.map(function (r) { return r[9]; }).join(','));
      const d = (res && res.data) || {};
      lot.forEach(function (r) {
        const o = d[r[9]];
        if (!o) return;
        const act = (o.activity || []).slice().sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
        const last = act.length ? act[act.length - 1] : null;
        r[10] = livStatut_(o.status, last);
        r[11] = String(o.status || '');
        r[12] = last ? String(last.reason || '') + (last.postponed_to ? ' (reporté au ' + last.postponed_to + ')' : '') + (String(last.station || '').trim() ? ' · ' + String(last.station).trim() : '') : '';
        r[13] = last ? last.date + ' ' + String(last.time || '').slice(0, 5) : '';
        r[14] = now;
      });
    }
  });
  sh.getRange(2, 1, rows.length, SUIVI_ENTETES.length).setNumberFormat('@').setValues(rows.map(function (r) { return r.map(function (v) { return v === null || v === undefined ? '' : String(v); }); }));
}

// ---------- Outils ----------
function livColonnes_(entetes) {
  const h = entetes.map(function (x) { return String(x).trim(); });
  const col = function (n) { return h.indexOf(n); };
  return {
    id: col('Order ID'), date: col('Order date'), nom: col('الاسم الكامل 👤'), tel: col('رقم الهاتف 📞'), wil: col('الولاية 🌎'), com: col('البلدية 🏠'),
    type: col('التوصيل 🚚'), qty: col('الكمية 📦'), tot: col('السعر الاجمالي'), st: col('confirmation'), liv: col('Livraison'), rem: col('Remarque'),
    soc: col('Société de livraison'), ref: col('Réf. produit (stock)'), qte: col('Qté produit'), trk: col('Tracking'), env: col('Envoi')
  };
}

// Statut simplifié : En acheminement, En livraison, Reporté, Livré, Retour, Annulé
function livStatut_(code, last) {
  const s = String(code || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/^retour/.test(s)) return 'Retour';
  if (/annul/.test(s)) return 'Annulé';
  if (/suspendu/.test(s)) return 'Reporté';
  if (/en_livraison/.test(s)) return last && (last.postponed_to || /report/i.test(String(last.reason || ''))) ? 'Reporté' : 'En livraison';
  if (/livr|encaiss|paiement|paye/.test(s)) return 'Livré';
  return 'En acheminement';
}

function livSociete_(v) {
  const s = String(v || '').toUpperCase().trim();
  if (s.indexOf('HHD') >= 0) return 'HHD';
  if (s.indexOf('SWIFT') >= 0) return 'SWIFT';
  if (s.indexOf('NAVEX') >= 0) return 'NAVEX';
  return s;
}

function livTel_(v) {
  const d = String(v || '').replace(/[^0-9]/g, '');
  return d.length >= 9 ? d.slice(-9) : '';
}

function livMaintenant_() {
  return Utilities.formatDate(new Date(), 'Africa/Algiers', 'dd/MM HH:mm');
}

function livColisRecents_(cfg, minJour) {
  const start = Utilities.formatDate(new Date(new Date(minJour).getTime() - 3 * 864e5), 'Africa/Algiers', 'yyyy-MM-dd');
  const end = Utilities.formatDate(new Date(Date.now() + 864e5), 'Africa/Algiers', 'yyyy-MM-dd');
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const res = livGet_(cfg, '/api/v1/get/orders?page=' + page + '&start_date=' + start + '&end_date=' + end);
    if (!res || !res.data) break;
    res.data.forEach(function (o) { out.push({ tracking: o.tracking, tel: livTel_(o.phone), tel2: livTel_(o.phone_2), date: String(o.created_at || '').slice(0, 19) }); });
    if (!res.last_page || page >= res.last_page) break;
  }
  return out;
}

function livCommunes_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('livCommunes');
  if (hit) return JSON.parse(hit);
  try {
    const res = UrlFetchApp.fetch(LIV_COMMUNES_URL, { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    const txt = res.getContentText();
    try { cache.put('livCommunes', txt, 21600); } catch (e) { /* trop gros pour le cache : relu au prochain passage */ }
    return JSON.parse(txt);
  } catch (e) { return null; }
}

function livGet_(cfg, path) {
  const res = UrlFetchApp.fetch(cfg.url + path, { headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/json' }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;
  try { return JSON.parse(res.getContentText()); } catch (e) { return null; }
}

function livPost_(cfg, path, params) {
  const res = UrlFetchApp.fetch(cfg.url + path, { method: 'post', payload: params, headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/json' }, muteHttpExceptions: true });
  try { return JSON.parse(res.getContentText()); } catch (e) { return { message: 'HTTP ' + res.getResponseCode() }; }
}

function livErreur_(res) {
  if (!res) return 'pas de réponse';
  if (res.errors) return Object.keys(res.errors).map(function (k) { return [].concat(res.errors[k]).join(' '); }).join(' · ').slice(0, 300);
  return String(res.message || 'erreur inconnue').slice(0, 300);
}

function livOngletSuivi_(ss) {
  let sh = ss.getSheetByName(SUIVI_ONGLET);
  if (!sh) sh = ss.insertSheet(SUIVI_ONGLET, 1);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, SUIVI_ENTETES.length).setValues([SUIVI_ENTETES]).setFontWeight('bold').setBackground('#6aa84f').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

// ---------- Envoi immédiat (sans attendre les 5 minutes) ----------
// À exécuter une fois : envoiInstaller. Ensuite, changer « confirmation », « Société de livraison » ou vider « Envoi »
// dans la feuille lance l'envoi tout de suite. Menu « 🚚 Livraison › Envoyer les colis maintenant » en plus.
function envoiInstaller() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'livAuChangement') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('livAuChangement').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
}

function livAuChangement(e) {
  const sh = e && e.range && e.range.getSheet();
  if (!sh || sh.getName() !== LIV_SOURCE) return;
  const titre = String(sh.getRange(1, e.range.getColumn()).getValue()).trim();
  if (['confirmation', 'Société de livraison', 'Envoi', 'Réf. produit (stock)', 'Qté produit', 'البلدية 🏠'].indexOf(titre) < 0) return;
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(20000)) return;
  try {
    if (livEnvoyer_()) PropertiesService.getScriptProperties().deleteProperty('livSuiviDernier'); // suivi mis à jour au prochain passage
  } finally {
    lock.releaseLock();
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🚚 Livraison').addItem('Envoyer les colis maintenant', 'suiviSync').addToUi();
}
