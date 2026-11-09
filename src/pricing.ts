// Prix modifiables depuis le dashboard (onglet « Prix & Livraison ») : frais de livraison par wilaya et prix des produits.
// Les valeurs par défaut sont celles du code ; le dashboard enregistre ses changements dans config/main
// (deliveryPrices, productPrices), renvoyés par /api/config. Pour éviter un « saut » de prix à l'affichage,
// la dernière config reçue (site_config_cache) est appliquée dès le chargement de la page.
import { useSyncExternalStore } from 'react';
import { DELIVERY_PRICES } from './data';

export const DEFAULT_PRODUCT_PRICES = {
  pigmaUnit: 1900,    // Stop Fuites 1,4 kg : 1 boîte
  pigmaPack3: 3800,   // 2 achetées + 1 offerte
  pigmaPack6: 7600,   // 4 achetées + 2 offertes (livraison gratuite)
  pigmaCombo7: 9500,  // calculatrice : 7 boîtes
  pigmaCombo9: 11400, // calculatrice : 9 boîtes
  pigmaSeau16: 11900, // seau 16 kg (livraison gratuite)
};
export type ProductPriceKey = keyof typeof DEFAULT_PRODUCT_PRICES;
export const PRODUCT_PRICE_LABELS: Record<ProductPriceKey, string> = {
  pigmaUnit: 'Stop Fuites 1,4 kg — 1 boîte',
  pigmaPack3: 'Stop Fuites 1,4 kg — 2 + 1 offerte (3 boîtes)',
  pigmaPack6: 'Stop Fuites 1,4 kg — 4 + 2 offertes (6 boîtes, livraison gratuite)',
  pigmaCombo7: 'Stop Fuites 1,4 kg — 7 boîtes (calculatrice)',
  pigmaCombo9: 'Stop Fuites 1,4 kg — 9 boîtes (calculatrice)',
  pigmaSeau16: 'Stop Fuites seau 16 kg (prix du seau, livraison gratuite)',
};

// Valeurs utilisées par le site (objets modifiés sur place : les composants lisent toujours la valeur à jour)
export const PRODUCT_PRICES = { ...DEFAULT_PRODUCT_PRICES };
export const DEFAULT_DELIVERY_PRICES: Record<string, { desk: number; home: number }> = JSON.parse(JSON.stringify(DELIVERY_PRICES));

const valid = (v: any) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 10_000_000;

let version = 0;
const listeners = new Set<() => void>();

export function applyPricing(cfg: any) {
  const delivery = cfg?.deliveryPrices || {};
  for (const w of Object.keys(DEFAULT_DELIVERY_PRICES)) {
    const d = DEFAULT_DELIVERY_PRICES[w];
    const o = delivery[w] || {};
    DELIVERY_PRICES[w] = { home: valid(o.home) ? o.home : d.home, desk: valid(o.desk) ? o.desk : d.desk };
  }
  const products = cfg?.productPrices || {};
  (Object.keys(DEFAULT_PRODUCT_PRICES) as ProductPriceKey[]).forEach(k => {
    PRODUCT_PRICES[k] = valid(products[k]) ? products[k] : DEFAULT_PRODUCT_PRICES[k];
  });
  version++;
  listeners.forEach(l => l());
}

// À appeler dans les composants qui affichent un prix : ils se redessinent quand les prix changent
export function usePricing() {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => version,
    () => version,
  );
}

try {
  const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('site_config_cache') : null;
  if (cached) applyPricing(JSON.parse(cached));
} catch { /* stockage indisponible : prix par défaut */ }
