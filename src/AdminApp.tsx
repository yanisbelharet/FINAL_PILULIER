import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShoppingBag, Eye, TrendingUp, Banknote, Bell, BellOff, LogOut, RefreshCw, MapPin, Megaphone,
  Package, Download, Lock, CheckCircle2, AlertTriangle, ShoppingCart,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// App mobile installable (/app) : KPI du site + notifications de commandes.
// Même base de données et même mot de passe que /admin.
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'yanis_app_token';
const SW_CACHE = 'yanis-app';
const ALGIERS_OFFSET_MS = 3600 * 1000; // UTC+1

type Order = {
  id: string; orderNumber: number | null; displayId: string; name: string; phone: string; wilaya: string; commune: string;
  price: number; currency: string; quantity: number; productId: string; productName: string; source: string;
  status: string; createdAt: string | null;
};
type Stats = { serverTime: string; orders: Order[]; dailyVisits: Record<string, number>; totalVisits: number; pushConfigured: boolean };
type PeriodKey = 'today' | '7d' | '30d' | 'month';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: 'month', label: 'Ce mois' },
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmée', cls: 'bg-emerald-100 text-emerald-800' },
  dhd_pushed: { label: 'Envoyée DHD', cls: 'bg-sky-100 text-sky-800' },
  shipped: { label: 'Expédiée', cls: 'bg-indigo-100 text-indigo-800' },
  unreachable: { label: 'Injoignable', cls: 'bg-orange-100 text-orange-800' },
  cancelled: { label: 'Annulée', cls: 'bg-rose-100 text-rose-800' },
  returned: { label: 'Retour', cls: 'bg-slate-200 text-slate-700' },
};

const dayKey = (ms: number) => new Date(ms + ALGIERS_OFFSET_MS).toISOString().slice(0, 10);
const DAY = 24 * 3600 * 1000;
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const timeAgo = (iso: string | null) => {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

// Liste des jours (clé YYYY-MM-DD, heure d'Alger) d'une période et de la période précédente de même longueur
const periodDays = (period: PeriodKey, now: number) => {
  const today = dayKey(now);
  let n = 1;
  if (period === '7d') n = 7;
  if (period === '30d') n = 30;
  if (period === 'month') n = Number(today.slice(8, 10));
  const current = Array.from({ length: n }, (_, i) => dayKey(now - (n - 1 - i) * DAY));
  const previous = Array.from({ length: n }, (_, i) => dayKey(now - (2 * n - 1 - i) * DAY));
  return { current, previous };
};

const urlB64ToUint8Array = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
};

const saveTokenForServiceWorker = async (token: string | null) => {
  try {
    if (!('caches' in window)) return;
    const cache = await caches.open(SW_CACHE);
    if (token) await cache.put('/__token', new Response(token));
    else await cache.delete('/__token');
  } catch (e) { /* stockage indisponible */ }
};

const beep = () => {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.18].forEach(t => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.16);
    });
  } catch (e) { /* son indisponible */ }
};

// ----------------------------- Connexion -----------------------------------
const Login = ({ onLogin }: { onLogin: (token: string) => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ password, remember: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) onLogin(data.token);
      else setError('Mot de passe incorrect');
    } catch (err) {
      setError('Connexion impossible, vérifiez internet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-700 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3">
          <ShoppingBag size={28} />
        </div>
        <h1 className="text-center text-xl font-black text-slate-900">YANIS SHOP</h1>
        <p className="text-center text-sm text-slate-500 mb-5">Suivi des commandes</p>
        <label className="block text-sm font-bold text-slate-700 mb-1" htmlFor="app-pass">Mot de passe admin</label>
        <div className="relative">
          <input id="app-pass" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-12 border-2 border-slate-200 focus:border-emerald-600 outline-none rounded-xl pl-10 pr-3 font-semibold" />
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        {error && <p className="text-rose-600 text-sm font-bold mt-2">{error}</p>}
        <button disabled={loading || !password} className="w-full h-12 mt-4 rounded-xl bg-emerald-600 text-white font-black disabled:opacity-60">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="text-xs text-slate-400 text-center mt-3">Même mot de passe que /admin · session de 30 jours</p>
      </form>
    </div>
  );
};

// ------------------------------- Éléments -----------------------------------
const Kpi = ({ icon: Icon, label, value, sub, delta }: { icon: any; label: string; value: string; sub?: string; delta?: number | null }) => (
  <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
    <div className="flex items-center gap-1.5 text-slate-500 text-[12px] font-bold"><Icon size={14} /> {label}</div>
    <div className="text-[24px] leading-tight font-black text-slate-900 mt-1">{value}</div>
    <div className="flex items-center gap-2 text-[11px] font-semibold mt-0.5">
      {delta !== undefined && delta !== null && (
        <span className={delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}%</span>
      )}
      {sub && <span className="text-slate-400">{sub}</span>}
    </div>
  </div>
);

const BarList = ({ rows, total }: { rows: [string, number][]; total: number }) => (
  <ul className="space-y-2">
    {rows.map(([label, n]) => (
      <li key={label}>
        <div className="flex justify-between text-[13px] font-semibold text-slate-700">
          <span className="truncate pr-2" dir="auto">{label}</span><span className="font-black">{n}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full mt-1">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total ? (n / total) * 100 : 0}%` }} />
        </div>
      </li>
    ))}
    {rows.length === 0 && <li className="text-sm text-slate-400">Aucune donnée sur la période</li>}
  </ul>
);

const Card = ({ title, icon: Icon, children, right }: { title: string; icon: any; children: React.ReactNode; right?: React.ReactNode }) => (
  <section className="bg-white rounded-2xl p-4 border border-slate-200">
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-black text-slate-900 flex items-center gap-2 text-[15px]"><Icon size={17} className="text-emerald-600" /> {title}</h2>
      {right}
    </div>
    {children}
  </section>
);

const countBy = (orders: Order[], key: (o: Order) => string, max = 8): [string, number][] => {
  const m = new Map<string, number>();
  orders.forEach(o => { const k = key(o) || '—'; m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, max);
};

// ----------------------------- Notifications --------------------------------
const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPromptEvent(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  return promptEvent;
};

const NotificationsCard = ({ authFetch, pushConfigured }: { authFetch: (url: string, init?: RequestInit) => Promise<Response>; pushConfigured: boolean }) => {
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const [permission, setPermission] = useState<string>(supported ? Notification.permission : 'unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const installPrompt = useInstallPrompt();
  const standalone = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.getRegistration('/app').then(reg => reg?.pushManager.getSubscription()).then(sub => setSubscribed(!!sub)).catch(() => {});
  }, [supported]);

  const enable = async () => {
    setBusy(true); setMsg('');
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') { setMsg('Autorisation refusée. Activez les notifications pour ce site dans les réglages de Chrome.'); return; }
      const { publicKey } = await (await fetch('/api/app/push-key')).json();
      if (!publicKey) { setMsg('Les clés de notification ne sont pas encore configurées sur Vercel.'); return; }
      const reg = await navigator.serviceWorker.register('/app-sw.js', { scope: '/app' });
      await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(publicKey) });
      const res = await authFetch('/api/app/push-subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setSubscribed(true);
      setMsg('Notifications activées sur ce téléphone ✅');
    } catch (e: any) {
      setMsg("Impossible d'activer les notifications : " + (e?.message || 'erreur'));
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true); setMsg('');
    try {
      const data = await (await authFetch('/api/app/push-test', { method: 'POST' })).json();
      setMsg(data.sent > 0 ? `Notification de test envoyée à ${data.sent} appareil(s)` : "Aucun appareil n'a reçu la notification");
    } catch (e) {
      setMsg("Échec de l'envoi du test");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Notifications de commandes" icon={Bell}>
      {!supported ? (
        <p className="text-sm text-slate-600">Ce navigateur ne gère pas les notifications. Ouvrez l'app avec <b>Google Chrome</b> à jour.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            {subscribed && permission === 'granted'
              ? <><CheckCircle2 size={18} className="text-emerald-600" /> Activées sur ce téléphone</>
              : <><BellOff size={18} className="text-slate-400" /> Désactivées sur ce téléphone</>}
          </div>
          {!pushConfigured && (
            <p className="text-[13px] text-amber-700 bg-amber-50 rounded-xl p-3 flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" /> Ajoutez les clés VAPID dans les variables d'environnement Vercel pour activer les notifications.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={enable} disabled={busy} className="h-11 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-60">
              {subscribed ? 'Réactiver' : 'Activer'}
            </button>
            <button onClick={test} disabled={busy || !subscribed} className="h-11 rounded-xl border-2 border-slate-200 font-bold text-sm text-slate-700 disabled:opacity-50">
              Tester
            </button>
          </div>
          {installPrompt && !standalone && (
            <button onClick={() => installPrompt.prompt()} className="w-full h-11 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2">
              <Download size={16} /> Installer l'app sur l'écran d'accueil
            </button>
          )}
          {msg && <p className="text-[13px] font-semibold text-slate-700">{msg}</p>}
          <p className="text-[12px] text-slate-400">
            Android : pour recevoir les alertes écran éteint, mettez Chrome sur « Non optimisé » dans Réglages › Batterie.
          </p>
        </div>
      )}
    </Card>
  );
};

// --------------------------------- App --------------------------------------
export default function AdminApp() {
  const [token, setToken] = useState<string | null>(() => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } });
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<Order | null>(null);
  const lastTopRef = useRef<number | null>(null);

  useEffect(() => { document.title = 'YANIS SHOP – Commandes'; }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    saveTokenForServiceWorker(null);
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setToken(null); setStats(null);
  }, []);

  const login = (t: string) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
    saveTokenForServiceWorker(t);
    setToken(t);
  };

  const authFetch = useCallback((url: string, init: RequestInit = {}) =>
    fetch(url, { ...init, credentials: 'include', headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } })
      .then(res => { if (res.status === 401) logout(); return res; }), [token, logout]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/app/stats');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data: Stats = await res.json();
      const top = data.orders[0]?.orderNumber ?? null;
      if (lastTopRef.current !== null && top !== null && top > lastTopRef.current) {
        setToast(data.orders[0]); beep();
        setTimeout(() => setToast(null), 6000);
      }
      lastTopRef.current = top;
      setStats(data); setError('');
    } catch (e) {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  // Chargement + rafraîchissement toutes les 30 s quand l'app est à l'écran
  useEffect(() => {
    if (!token) return;
    saveTokenForServiceWorker(token);
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    const onSwMessage = (e: MessageEvent) => { if (e.data?.type === 'new-order') load(); };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/app-sw.js', { scope: '/app' }).catch(() => {});
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, [token, load]);

  const view = useMemo(() => {
    if (!stats) return null;
    const now = new Date(stats.serverTime).getTime();
    const { current, previous } = periodDays(period, now);
    const cur = new Set(current), prev = new Set(previous);
    const withKey = stats.orders.map(o => ({ o, k: o.createdAt ? dayKey(new Date(o.createdAt).getTime()) : '' }));
    const orders = withKey.filter(x => cur.has(x.k)).map(x => x.o);
    const prevOrders = withKey.filter(x => prev.has(x.k)).map(x => x.o);
    const visits = current.reduce((s, k) => s + (Number(stats.dailyVisits[k]) || 0), 0);
    const prevVisits = previous.reduce((s, k) => s + (Number(stats.dailyVisits[k]) || 0), 0);
    const dzd = orders.filter(o => o.currency !== 'LYD');
    const revenue = dzd.reduce((s, o) => s + o.price, 0);
    const prevRevenue = prevOrders.filter(o => o.currency !== 'LYD').reduce((s, o) => s + o.price, 0);
    const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
    const conv = visits > 0 ? (orders.length / visits) * 100 : 0;
    const prevConv = prevVisits > 0 ? (prevOrders.length / prevVisits) * 100 : 0;

    // Graphique : commandes par jour (14 derniers jours, ou toute la période si plus longue)
    const chartDays = period === 'today' || period === '7d'
      ? Array.from({ length: 14 }, (_, i) => dayKey(now - (13 - i) * DAY))
      : current;
    const perDay = new Map<string, number>();
    withKey.forEach(x => perDay.set(x.k, (perDay.get(x.k) || 0) + 1));
    const chart = chartDays.map(k => ({ k, n: perDay.get(k) || 0, v: Number(stats.dailyVisits[k]) || 0 }));
    const maxN = Math.max(1, ...chart.map(c => c.n));

    const statusCounts = countBy(orders, o => o.status, 10);
    return {
      orders, revenue, visits, conv,
      deltaOrders: pct(orders.length, prevOrders.length),
      deltaRevenue: pct(revenue, prevRevenue),
      deltaVisits: pct(visits, prevVisits),
      deltaConv: prevConv > 0 ? ((conv - prevConv) / prevConv) * 100 : null,
      avg: dzd.length ? revenue / dzd.length : 0,
      lydCount: orders.length - dzd.length,
      wilayas: countBy(orders, o => o.wilaya),
      sources: countBy(orders, o => o.source, 6),
      products: countBy(orders, o => o.productName, 5),
      statusCounts, chart, maxN,
    };
  }, [stats, period]);

  if (!token) return <Login onLogin={login} />;

  const periodLabel = PERIODS.find(p => p.key === period)!.label.toLowerCase();
  const compareLabel = period === 'today' ? 'vs hier' : 'vs période préc.';

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800" dir="ltr" lang="fr">
      {/* En-tête */}
      <header className="bg-emerald-700 text-white px-4 pt-4 pb-14">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"><ShoppingBag size={20} /></div>
            <div>
              <p className="font-black leading-tight">YANIS SHOP</p>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-300 animate-pulse" /> En direct · mise à jour toutes les 30 s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={load} aria-label="Rafraîchir" className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={logout} aria-label="Déconnexion" className="w-10 h-10 rounded-xl hover:bg-white/10 flex items-center justify-center">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <div className="max-w-xl mx-auto mt-4 grid grid-cols-4 bg-white/10 rounded-xl p-1 text-[13px] font-bold">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`h-9 rounded-lg transition-colors ${period === p.key ? 'bg-white text-emerald-800' : 'text-emerald-50'}`}>{p.label}</button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-10 pb-10 space-y-3">
        {error && <div className="bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl p-3 text-sm font-bold">{error}</div>}
        {!view ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 font-semibold">Chargement…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Kpi icon={ShoppingCart} label="Commandes" value={fmt(view.orders.length)} delta={view.deltaOrders} sub={compareLabel} />
              <Kpi icon={Eye} label="Visites" value={fmt(view.visits)} delta={view.deltaVisits} sub={compareLabel} />
              <Kpi icon={TrendingUp} label="Taux de conversion" value={`${view.conv.toFixed(1)}%`} delta={view.deltaConv} sub="cmd / visites" />
              <Kpi icon={Banknote} label="Chiffre d'affaires" value={`${fmt(view.revenue)} DA`} delta={view.deltaRevenue} sub="livraison incluse" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Kpi icon={Package} label="Panier moyen" value={`${fmt(view.avg)} DA`} />
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200">
                <p className="text-slate-500 text-[12px] font-bold mb-2">Statuts ({periodLabel})</p>
                <div className="flex flex-wrap gap-1">
                  {view.statusCounts.map(([s, n]) => (
                    <span key={s} className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_LABELS[s]?.cls || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[s]?.label || s} {n}
                    </span>
                  ))}
                  {view.statusCounts.length === 0 && <span className="text-[12px] text-slate-400">—</span>}
                </div>
              </div>
            </div>
            {view.lydCount > 0 && <p className="text-[12px] text-slate-500 px-1">+ {view.lydCount} commande(s) Libye en LYD (non incluses dans le CA en DA)</p>}

            <Card title="Commandes par jour" icon={TrendingUp}>
              <div className="flex items-end gap-[3px] h-32">
                {view.chart.map(c => (
                  <div key={c.k} className="flex-1 flex flex-col items-center justify-end h-full" title={`${c.k} : ${c.n} commande(s), ${c.v} visite(s)`}>
                    {c.n > 0 && <span className="text-[9px] font-bold text-slate-500 mb-0.5">{c.n}</span>}
                    <div className="w-full rounded-t bg-emerald-500" style={{ height: `${(c.n / view.maxN) * 85}%`, minHeight: c.n ? 4 : 2, opacity: c.n ? 1 : 0.25 }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>{view.chart[0]?.k.slice(5).split('-').reverse().join('/')}</span>
                <span>{view.chart[view.chart.length - 1]?.k.slice(5).split('-').reverse().join('/')}</span>
              </div>
            </Card>

            <Card title="Wilayas" icon={MapPin}><BarList rows={view.wilayas} total={view.orders.length} /></Card>
            <Card title="Sources de trafic" icon={Megaphone}><BarList rows={view.sources} total={view.orders.length} /></Card>
            <Card title="Produits" icon={Package}><BarList rows={view.products} total={view.orders.length} /></Card>

            <Card title="Dernières commandes" icon={ShoppingBag}>
              <ul className="divide-y divide-slate-100 -my-1">
                {stats!.orders.slice(0, 15).map(o => (
                  <li key={o.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[14px] text-slate-900 truncate" dir="auto">#{o.displayId || o.orderNumber} · {o.name}</p>
                      <p className="text-[12px] text-slate-500 truncate" dir="auto">{o.wilaya}{o.commune ? ` · ${o.commune}` : ''}</p>
                      <p className="text-[11px] text-slate-400">{timeAgo(o.createdAt)} · {o.source}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-[14px] text-slate-900">{fmt(o.price)} {o.currency === 'LYD' ? 'LYD' : 'DA'}</p>
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${STATUS_LABELS[o.status]?.cls || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[o.status]?.label || o.status}
                      </span>
                    </div>
                  </li>
                ))}
                {stats!.orders.length === 0 && <li className="py-3 text-sm text-slate-400">Aucune commande sur les 60 derniers jours</li>}
              </ul>
              <a href="/admin" className="block text-center text-[13px] font-bold text-emerald-700 mt-3">Gérer les commandes dans /admin →</a>
            </Card>

            <NotificationsCard authFetch={authFetch} pushConfigured={stats!.pushConfigured} />
          </>
        )}
      </main>

      {/* Bannière nouvelle commande (app ouverte) */}
      {toast && (
        <div className="fixed top-3 inset-x-3 z-50 max-w-xl mx-auto bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0"><ShoppingCart size={20} /></div>
          <div className="min-w-0">
            <p className="font-black text-[14px]">🛒 Nouvelle commande #{toast.displayId || toast.orderNumber}</p>
            <p className="text-[12px] text-slate-300 truncate" dir="auto">{fmt(toast.price)} DA · {toast.wilaya} · {toast.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
