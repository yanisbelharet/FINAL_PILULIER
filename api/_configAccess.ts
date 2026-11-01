import jwt from "jsonwebtoken";

// Champs secrets de config/main : utilisés seulement côté serveur (CAPI Meta, Events API TikTok, GA4 Measurement Protocol,
// Google Sheets) ou par le dashboard admin.
// Ils ne doivent jamais partir dans la réponse publique de /api/config.
// (Fichier préfixé par « _ » : Vercel n'en fait pas une route /api.)
export const SECRET_CONFIG_KEYS = ["fbAccessToken", "tiktokAccessToken", "ga4ApiSecret", "sheetWebhookUrl", "sheetSecret", "sheetLink", "spreadsheetId"];

// Requête du dashboard admin : JWT valide dans le cookie admin_token ou l'en-tête Authorization: Bearer
export function isAdminRequest(req: any): boolean {
  let token = req.cookies?.admin_token || String(req.headers?.cookie || "").match(/(?:^|;\s*)admin_token=([^;]*)/)?.[1];
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1];
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    return true;
  } catch {
    return false;
  }
}

export function publicConfig<T extends Record<string, any>>(config: T): T {
  const copy: Record<string, any> = { ...config };
  for (const key of SECRET_CONFIG_KEYS) delete copy[key];
  return copy as T;
}
