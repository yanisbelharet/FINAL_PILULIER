# Pigma Color Stop Fuites (version transparente) – sources de la landing `/lp/pigma-stop-fuites`

Recherche faite le 28/10/2026. Règle suivie : **aucun chiffre inventé**. Toute information non trouvée apparaît
sur la page avec un repère visible `[À COMPLÉTER : …]` (voir la liste en bas).

> Mise à jour du 28/10/2026 (accès réseau ouvert) : la fiche complète du revendeur Fast-Colors-Tlemcen a pu être lue.
> Le site officiel `pigmacolor.dz` coupe la connexion (indisponible) et Jumia renvoie 403.
> Aucune fiche technique **fabricant** du produit Stop Fuites n'a été trouvée : les données d'usage ci-dessous viennent
> d'un **revendeur**, pas de Pigma Color.

## Informations confirmées

| Information | Valeur retenue sur la page | Source |
|---|---|---|
| Nom du produit / marque | « Stop Fuites » de Pigma Color | Photos réelles de la boîte (`assets/pigma/`) ; fiche revendeur « STOP FUITES من PIGMA COLOR » – https://www.fast-colors-tlemcen.com/products/sto |
| Version transparente | Mention « TRANSPARENT » sur l'étiquette | Photos `assets/pigma/pigma-1kg-transparent-boutique.jpg` et `pigma-1kg-5kg-exterieur.jpg` (sur le seau 5 kg) |
| Mentions de l'emballage | « Membrane élastique étanche », « System anti-infiltrations », « Waterproof » | Photos réelles de la boîte (toutes) |
| Poids d'une boîte | **1,4 kg** (confirmé) ; existe aussi en 5 kg | Étiquette « 1,4KG » et « 5KG » sur les photos ; fiche revendeur Fast-Colors-Tlemcen (pack 1,4 kg) |
| Description revendeur | « غشاء بلاستيكي مانع للتسرب، شفاف، يعمل كعازل كلي للماء » | Extrait de https://www.fast-colors-tlemcen.com/products/sto (texte marketing du revendeur ; le « 100 % » n'a **pas** été repris sur la page) |
| Usages (revendeur) | toits et terrasses ; balcons et escaliers ; réservoirs d'eau et bassins ; salles de bain et cuisines (zones humides) ; fuites aux angles et autour des tuyaux | Fiche Fast-Colors-Tlemcen : « الاستخدامات المناسبة » – https://www.fast-colors-tlemcen.com/products/sto |
| Préparation / application (revendeur) | nettoyer saleté, poussière et huiles ; appliquer au pinceau ou au rouleau ; **2 couches recommandées** (« يُفضل تطبيق طبقتين ») ; séchage « selon les instructions » | Même fiche, « طريقة التطبيق » |
| Caractéristiques (revendeur) | transparent, garde l'aspect naturel ; membrane plastique souple qui suit les mouvements du support ; sans démolition | Même fiche, « الميزات الرئيسية » (le slogan « عازل 100% » n'est pas repris) |
| Prix chez ce revendeur (pour info) | 1 400 DA (barré 1 900 DA) | Même fiche (données produit YouCan) |
| Fabricant | Pigma Color SARL, zone industrielle de Sidi Khaled, Oued El Berdi, Bouira | https://pagesjaunes-dz.com/Companies/detail/1b07bed355f31636bb7f62da43287cca/pigma-color · https://elmouchir.caci.dz/entreprise/24967/pigma-color · https://dz.kompass.com/c/pigma-color-sarl/dz274247/ |
| Prix / offres | 1 900 DA la boîte ; 2+1 = 3 800 DA ; 4+2 = 7 600 DA livraison gratuite | Fixés par la boutique (brief) |
| Frais de livraison, wilayas | Table `DELIVERY_PRICES` / `WILAYAS` existante | `src/data.ts` (déjà utilisée par les autres pages) |

### Informations écartées (ne concernent pas ce produit)

- « PEINTURE ÉTANCHE » de Pigma Color (https://pigmacolor.dz/produit/peinture-etanche, Jumia 1 kg) : revêtement
  acrylique élastique **différent** de Stop Fuites. Ses caractéristiques n'ont pas été reprises.
- Chiffres de produits concurrents (Soudal, Aquaplan, Bostik Waterstop, StopFuite™, PROCOM…) : non applicables.

## Informations introuvables → `[À COMPLÉTER]` sur la page

| Où sur la page | Information manquante |
|---|---|
| Calculatrice + FAQ « شحال تغطي العلبة » | Rendement (kg/m² par couche) → `SPEC.kgPerM2PerCoat` dans `src/LandingPagePigma.tsx` (`coats` = 2, d'après le revendeur) |
| Étapes d'application (étape 4) + FAQ « شحال من وقت باش ينشف » | Temps de séchage (au toucher / entre couches / complet) |
| Étapes d'application (étape 2) + FAQ « نقدر ندهن وكاين الشتا » | Conditions : température min/max, délai sans pluie après application |
| Section « السطوح » | Confirmation de la liste par la fiche officielle Pigma Color (les 6 cartes reprennent la liste du revendeur) |
| Section « الحل » + FAQ « شحال يدوم » | Durabilité et résistance aux UV |
| FAQ livraison | Délai de livraison habituel |
| Section « كيفاش تدهنو » | Vidéo réelle du test à l'eau → constante `VIDEO` dans `src/LandingPagePigma.tsx` |

Pour compléter : demander la fiche technique à Pigma Color (ou la lire sur l'emballage), remplacer `SPEC` par
`{ kgPerM2PerCoat: X, coats: N }`, puis remplacer chaque `<Todo>…</Todo>` par le texte définitif.

## Images d'ambiance générées (Cloudflare Workers AI, Flux schnell)

Illustratives uniquement (légende « صورة توضيحية » sur la page) — jamais présentées comme résultats, clients ou avant/après.
Dossier `public/images/pigma/` (+ variante `-sm` 480 px) ; prompts dans `scripts/gen-image.mjs`.

`hero-rain-roof`, `damp-ceiling`, `peeling-paint`, `terrace-tiles-rain`, `roof-tiles-rain`, `roller-apply`, `house-after-storm`.
