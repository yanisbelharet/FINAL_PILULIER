# Commandes → Google Sheets

## Fonctionnement

Le **serveur** envoie chaque nouvelle commande à un script Google Apps Script collé dans la feuille, au moment où elle est
passée (`api/submitOrder.ts` sur Vercel, `server.ts` en local). Le dashboard n'a pas besoin d'être ouvert et il n'y a
pas de connexion Google à renouveler. Le script ignore les ID déjà présents : renvoyer une commande ne crée pas de doublon.

- `api/_sheets.ts` : mise en forme d'une commande et envoi au script (`sheetWebhookUrl`, `sheetSecret` dans `config/main`).
- `src/sheetsAppsScript.ts` : code du script, généré dans le dashboard avec le code secret.
- `POST /api/admin/sheets/test` : vérifie la liaison (n'ajoute aucune ligne).
- `POST /api/admin/sheets/backfill` : envoie l'historique par paquets de 100 (le dashboard enchaîne les appels).
- `sheetWebhookUrl`, `sheetSecret`, `sheetLink` ne sont jamais renvoyés par la route publique `/api/config`.

Colonnes (version 3 du script) = celles du modèle de la boutique (export YouCan, onglet « Youcan-Orders ») :

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Order ID | Order date | الاسم الكامل 👤 | رقم الهاتف 📞 | الولاية 🌎 | البلدية 🏠 | سعر التوصيل | التوصيل 🚚 | السعر الاجمالي | confirmation | Livraison | (notes) |
| `001` | `2026-11-02 21:59:46` | tel que saisi | tel que saisi | tel que reçu du site (`16 - الجزائر`) | tel que reçu | `400 دج` | `التوصيل لباب المنزل` / `التوصيل للمكتب` | `4200 دج` | vide (liste du modèle) | `A DOMICILE` / `STOP DESK` | vide |

- **Un onglet par produit** (`sheetTabFor` dans `api/_sheets.ts`) : « Stop Fuites 1,4 kg », « Stop Fuites 16 kg »,
  « PROELASTIC », « MagSafe », « منبه الدواء », « منبه الدواء - ليبيا » ; commandes anciennes sans produit : « Autres commandes ».
  L'onglet est créé à la première commande (en-tête vert, listes déroulantes J et K du modèle, texte libre accepté).
- **Order ID** : numéro simple attribué par le script, propre à chaque onglet (plus grand numéro de la colonne A + 1, sur 3 chiffres).
- Colonne **Z masquée** (« ref ») : identifiant de la commande sur le site, sert uniquement à éviter les doublons. Ne pas la supprimer.
- Livraison = total − prix des produits (0 دج pour les offres à livraison gratuite).

## Mise en place (dashboard › Intégrations)

1. **Copier le script**.
2. Dans la feuille : Extensions › Apps Script › coller › enregistrer ; Déployer › Nouveau déploiement › Application Web,
   *Exécuter en tant que : Moi*, *Qui a accès : Tout le monde* ; autoriser ; copier l'URL `…/exec`.
3. Coller l'URL › **Enregistrer et tester**, puis **Envoyer toutes les commandes existantes**.

## Où sont les commandes ?

Version 3 : dans l'onglet du produit (voir ci-dessus) ; l'ancien onglet « Commandes » n'est plus utilisé et peut être supprimé.

Historique : la version 1 du script le créait **à la fin** de la feuille (après « Feuille 1 ») :
les commandes y arrivaient, mais on regardait souvent le premier onglet, vide. La version 2 :

- utilise le premier onglet s'il est vide, sinon crée « Commandes » en première position, et remonte un onglet
  « Commandes » existant en premier ;
- renvoie le nom du fichier, de l'onglet et le nombre de commandes (affichés par le dashboard après un test ou un envoi) ;
- répond à l'ouverture de l'URL `/exec` dans le navigateur (`doGet`) avec ces mêmes informations, sans données client.

Mettre à jour le script : dashboard › Copier le script, le coller à la place de l'ancien, puis Déployer › Gérer les
déploiements › ✏️ › Version : Nouvelle version › Déployer. L'URL ne change pas.

Nouvelles commandes : `api/submitOrder.ts` lance l'envoi dès l'enregistrement et l'attend au plus 4 s avant de répondre
au client (en plus de `waitUntil`), pour que Vercel ne coupe pas la fonction avant la fin de l'envoi.

## Dépannage

| Message | Cause |
|---|---|
| Le script n'est pas accessible publiquement | Déploiement avec un accès autre que « Tout le monde » |
| Code secret incorrect | Le script collé ne vient pas du dashboard (ou un autre code secret a été généré) |
| Réponse inattendue (HTTP 404) | URL incomplète : il faut l'URL de l'application Web qui finit par `/exec` |
| Après modification du script | Déployer › Gérer les déploiements › modifier › Nouvelle version (l'URL reste la même) |

## Ancienne méthode (retirée)

Le dashboard se connectait à Google (Firebase Auth) et écrivait depuis le navigateur. Elle ne marchait que dashboard
ouvert, le jeton Google expirait au bout d'1 h, la synchro automatique s'arrêtait au-delà de 100 commandes, et les
commandes enregistrées par `api/submitOrder.ts` n'avaient ni produit ni offre.
