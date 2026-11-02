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

Colonnes : ID · N° · Date (heure d'Alger) · Client · Téléphone · Wilaya · Commune · Adresse · Livraison · Produit · Offre · Quantité · Total (DA) · Source.

## Mise en place (dashboard › Intégrations)

1. **Copier le script**.
2. Dans la feuille : Extensions › Apps Script › coller › enregistrer ; Déployer › Nouveau déploiement › Application Web,
   *Exécuter en tant que : Moi*, *Qui a accès : Tout le monde* ; autoriser ; copier l'URL `…/exec`.
3. Coller l'URL › **Enregistrer et tester**, puis **Envoyer toutes les commandes existantes**.

## Où sont les commandes ?

Dans l'onglet **« Commandes »**. La version 1 du script le créait **à la fin** de la feuille (après « Feuille 1 ») :
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
