// Prix en dinars pour les pages Pigma.
// Isolé en LTR (U+2066…U+2069), sinon « 3 800 » s'affiche « 800 3 » dans une page RTL
export const fmt = (n: number) => `⁦${n.toLocaleString('fr-DZ').replace(/ | /g, ' ')}⁩`;
export const da = (n: number) => `${fmt(n)} د.ج`;
