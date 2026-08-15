import React, { useState, useEffect } from 'react';
import { Lock, Settings, Save, LogOut, TrendingUp, Users, ShoppingCart, ShoppingBag, Tag, Eye, Package, DollarSign, LayoutDashboard, BarChart3, Bell, Clock, Plane, Phone, CheckCircle, XCircle, Search, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import * as import_data from './data';
import { motion } from 'motion/react';
import { initAuth, googleSignIn, getAccessToken, logout } from './firebase';
import { User } from 'firebase/auth';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [config, setConfig] = useState<any>({
    productPrice: 2900,
    productOldPrice: 4200,
    promoActive: true,
    promoText: 'عرض ترويجي محدود!',
    visits: 0,
    fbPixelId: '',
    tiktokPixelId: '',
    fbAccessToken: '',
    tiktokAccessToken: '',
    timerEnabled: true,
    timerHours: 24,
    products: []
  });
  
  const [orders, setOrders] = useState<any[]>([]);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [syncDateFilter, setSyncDateFilter] = useState('all');
  const [sheetMessage, setSheetMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [dhdFilter, setDhdFilter] = useState('pending');
  const [dhdSearch, setDhdSearch] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);


  const [saving, setSaving] = useState(false);
  const [previousOrderCount, setPreviousOrderCount] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');

  
  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setSheetMessage({ type: 'success', text: 'Connecté à Google avec succès.' });
      }
    } catch (err) {
      console.error(err);
      setSheetMessage({ type: 'error', text: 'Échec de la connexion Google.' });
    }
  };

  
  const saveCustomSheetId = async () => {
    let extractedId = customSheetInput.trim();
    if (extractedId.includes('/d/')) {
      const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) extractedId = match[1];
    }
    
    if (extractedId) {
      const updatedConfig = { ...config, spreadsheetId: extractedId };
      setConfig(updatedConfig);
      await fetchAuth('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      setCustomSheetInput('');
      setSheetMessage({ type: 'success', text: 'Fichier Google Sheet mis à jour !' });
    }
  };

  const handleSyncToSheets = async (isAutoSync: boolean | React.MouseEvent = false) => {
    if (typeof isAutoSync !== 'boolean') isAutoSync = false;
    if (!googleToken) {
      setSheetMessage({ type: 'error', text: 'Veuillez vous connecter à Google.' });
      return;
    }
    
    setSyncingSheets(true);
    setSheetMessage(null);
    
    try {
      let spreadsheetId = config.spreadsheetId;
      
      if (!spreadsheetId) {
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: { title: 'Commandes - ' + new Date().toLocaleDateString() },
            sheets: [{ properties: { title: 'Commandes' } }]
          })
        });
        
        if (!createRes.ok) throw new Error('Échec de la création du fichier Google Sheet');
        const sheetData = await createRes.json();
        spreadsheetId = sheetData.spreadsheetId;
        
        await fetchAuth('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...config, spreadsheetId })
        });
        setConfig({ ...config, spreadsheetId });
        
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:I1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [['ID', 'Date', 'Client', 'Téléphone', 'Wilaya', 'Commune', 'Type Livraison', 'Produit', 'Prix Total']]
          })
        });
      }
      
      // Fetch existing IDs from Google Sheets to avoid duplicates
      let existingIds = [];
      let sheetName = 'Commandes';
      try {
        // First get spreadsheet info to find the first sheet name if Commandes doesn't exist
        const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
          headers: { 'Authorization': `Bearer ${googleToken}` }
        });
        if (metaRes.status === 404) {
          throw new Error("Le fichier Google Sheets n'existe plus ou est inaccessible. Veuillez lier un nouveau fichier.");
        }
        if (metaRes.status === 401) {
          setGoogleToken(null);
          setGoogleUser(null);
          localStorage.removeItem("googleAccessToken");
          throw new Error("Session Google expirée. Veuillez vous reconnecter.");
        }
        if (metaRes.ok) {
           const metaData = await metaRes.json();
           if (metaData.sheets && metaData.sheets.length > 0) {
              const hasCommandes = metaData.sheets.some(s => s.properties.title === 'Commandes');
              if (!hasCommandes) {
                 sheetName = metaData.sheets[0].properties.title;
              }
           }
        }
      
        const sheetDataRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:A`, {
          headers: { 'Authorization': `Bearer ${googleToken}` }
        });
        if (sheetDataRes.ok) {
           const existingData = await sheetDataRes.json();
           if (existingData.values) {
              existingIds = existingData.values.map(row => String(row[0]));
           }
        }
      } catch (err: any) {
        if (err.message.includes('Session Google') || err.message.includes('fichier Google Sheets')) {
          throw err; // re-throw to the outer try/catch
        }
        console.error("Error fetching existing sheets data:", err);
      }

      // Filter for new orders (not yet in the sheet)
      // Display ID or internal ID
      let ordersToSync = orders;
      if (!isAutoSync && syncDateFilter !== 'all') {
         const now = new Date();
         const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
         const yesterday = new Date(today);
         yesterday.setDate(yesterday.getDate() - 1);
         const last7days = new Date(today);
         last7days.setDate(last7days.getDate() - 7);
         
         ordersToSync = orders.filter(o => {
            const d = new Date(o.createdAt);
            if (syncDateFilter === 'today') return d >= today;
            if (syncDateFilter === 'yesterday') return d >= yesterday && d < today;
            if (syncDateFilter === '7days') return d >= last7days;
            return true;
         });
      }
      const newOrders = ordersToSync.filter(o => !existingIds.includes(String(o.displayId || o.id)));
      
      if (newOrders.length === 0) {
         setSheetMessage({ type: 'success', text: 'Toutes les commandes sont déjà synchronisées.' });
         setSyncingSheets(false);
         return;
      }
      
      // Sort to append oldest first among the new ones
      const sortedNewOrders = [...newOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const values = sortedNewOrders.map(o => [
        o.displayId || o.id,
        o.createdAt ? new Date(o.createdAt).toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
        o.name,
        o.phone,
        o.wilaya,
        o.commune,
        o.deliveryType === 'home' ? 'À Domicile' : 'Point Relais',
        o.productName || 'Produit',
        o.price
      ]);
      
      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: values })
      });
      if (!appendRes.ok) {
        const errorData = await appendRes.text();
        console.error("Append failed:", errorData);
        if (appendRes.status === 401) {
          setGoogleToken(null);
          setGoogleUser(null);
          localStorage.removeItem("googleAccessToken");
          throw new Error("Session Google expirée. Veuillez vous reconnecter.");
        }
        throw new Error('Erreur API Sheets: ' + appendRes.status);
      }
      
      setSheetMessage({ type: 'success', text: 'Synchronisation réussie avec Google Sheets !' });
      
    } catch (err: any) {
      console.error(err);
      setSheetMessage({ type: 'error', text: err.message || 'Erreur de synchronisation' });
    } finally {
      setSyncingSheets(false);
    }
  };

  const fetchAuth = (url: string, options: any = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers, credentials: 'include' });
  };

  useEffect(() => {
    const unsubscribe = initAuth((user, token) => {
      setGoogleUser(user);
      setGoogleToken(token);
    }, () => {
      setGoogleUser(null);
      setGoogleToken(null);
    });

    // Check if we can fetch config to verify authentication
    fetchAuth('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
      });
      
    const fetchOrders = () => {
      fetchAuth('/api/orders')
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
            return res.json();
          } else if (res.status === 401) {
            setIsAuthenticated(false);
            localStorage.removeItem('admin_token');
          }
          return null;
        })
        .then(data => {
          if (data && Array.isArray(data)) {
            setOrders(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
          }
        })
        .catch((err) => {
          console.error("fetchOrders error", err);
        });
    };

    if (isAuthenticated) {
      fetchOrders();
      const interval = setInterval(fetchOrders, 2000); // Poll every 2s
      return () => clearInterval(interval);
    } else {
      fetchOrders(); // Initial check
    }
  }, [isAuthenticated]);

  // Auto-sync to sheets when orders length increases
  useEffect(() => {
    if (googleToken && config.spreadsheetId && orders.length > previousOrderCount) {
      // Don't auto-sync on initial load if we just loaded orders, 
      // but wait, if it's initial load, previousOrderCount is 0, it WILL sync. That's good to ensure consistency.
      if (!syncingSheets) {
        handleSyncToSheets(true);
        setPreviousOrderCount(orders.length);
      }
    }
  }, [orders.length, googleToken, config.spreadsheetId]);


  const updateOrderStatus = async (id: string, status: string, additionalData: any = {}) => {
    try {
      setLoadingAction(id);
      await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...additionalData })
      });
      setOrders(orders.map(o => o.id === id ? { ...o, status, ...additionalData } : o));
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoadingAction(null);
    }
  };

  const pushToDHD = async (order: any) => {
    try {
      setLoadingAction('push_' + order.id);
      const res = await fetch('/api/dhd/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          payload: {
            Tracking: order.id,
            Client: order.name,
            MobileA: order.phone,
            IDWilaya: parseInt(order.wilaya, 10),
            Commune: order.commune,
            WilayaName: order.wilaya,
            Total: order.price,
            Note: order.note || '',
            TProduit: (() => {
              const prod = config.products?.find((p: any) => p.id === order.productId);
              if (prod?.isDhdStored && prod.dhdRef) {
                return prod.dhdRef;
              }
              return order.productName || 'Produit';
            })(),
            TypeColis: (() => {
              const prod = config.products?.find((p: any) => p.id === order.productId);
              return prod?.isDhdStored ? 1 : 0;
            })(),
            TypeLivraison: order.deliveryType === 'desk' ? 1 : 0
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'dhd_pushed', dhdTrackingId: data.tracking } : o));
        alert('Colis poussé vers DHD avec succès! Tracking: ' + data.tracking);
      } else {
        alert('Erreur DHD: ' + (data.details || data.error));
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'envoi à DHD');
    } finally {
      setLoadingAction(null);
    }
  };


  const syncDhdStatus = async (order: any) => {
    if (!order.dhdTrackingId) {
      alert("Pas de code de suivi DHD pour cette commande.");
      return;
    }
    try {
      setLoadingAction('sync_' + order.id);
      const res = await fetch(`/api/dhd/status/${order.dhdTrackingId}`);
      const data = await res.json();
      if (data.success && data.status) {
        // Map DHD status to internal if needed, or just update dhdStatus text
        const updates: any = { dhdStatus: data.status };
        // Si le colis est expédié, on met à jour le statut interne
        if (data.status.toLowerCase().includes('expedi') || data.status.toLowerCase().includes('shipped')) {
           updates.status = 'shipped';
        }
        await updateOrderStatus(order.id, order.status, updates);
        alert('Statut DHD synchronisé: ' + data.status);
      } else {
        alert('Erreur lors de la synchronisation: ' + (data.error || 'Statut introuvable'));
      }
    } catch (e) {
      console.error(e);
      alert("Erreur de connexion lors de la synchronisation avec DHD");
    } finally {
      setLoadingAction(null);
    }
  };

  const getDhdOrders = () => {
    return orders.filter(o => {
      const st = o.status || 'pending';
      const matchStatus = dhdFilter === 'all' || st === dhdFilter;
      const matchSearch = !dhdSearch || 
                          (o.name || "").toLowerCase().includes(dhdSearch.toLowerCase()) || 
                          (o.phone || "").includes(dhdSearch) || 
                          (o.dhdTrackingId && o.dhdTrackingId.includes(dhdSearch));
      return matchStatus && matchSearch;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('admin_token', data.token);
        }
        setIsAuthenticated(true);
        // Fetch config again to get spreadsheetId etc.
        fetchAuth('/api/config').then(res => res.json()).then(data => setConfig(data));
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          setError(data.error || 'Mot de passe incorrect');
        } else {
          const text = await res.text();
          setError(`Error ${res.status}: ${text.substring(0, 50)}`);
        }
      }
    } catch (err: any) {
      setError(`Erreur de connexion : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetchAuth('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    
    try {
      const configToSave = { ...config };
      setConfig(configToSave);
      
      const res = await fetchAuth('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToSave)
      });
      
      if (res.ok) {
        setSaveMessage('Enregistré avec succès');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        if (res.status === 401) {
          setIsAuthenticated(false);
        } else {
          const text = await res.text();
          setSaveMessage('Erreur: ' + text.substring(0, 50));
        }
      }
    } catch (err: any) {
      setSaveMessage('Erreur: ' + (err.message || 'Network error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" dir="ltr">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Lock size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center text-slate-900 mb-2">Espace Administrateur</h1>
          <p className="text-center text-slate-500 mb-8 text-sm">Veuillez vous connecter pour gérer la boutique</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-left font-mono"
                dir="ltr"
                required
                placeholder="••••••••"
              />
            </div>
            
            {error && <p className="text-rose-500 text-sm font-medium text-center bg-rose-50 py-2 rounded-lg">{error}</p>}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-70 shadow-lg shadow-indigo-200"
            >
              {loading ? 'Vérification...' : 'Se connecter'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Calculate totals
  const filteredOrders = orders.filter(order => {
    if (dateFilter === 'all') return true;
    if (!order.createdAt) return true;
    const orderDate = new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt);
    const now = new Date();
    if (dateFilter === 'today') {
      return orderDate.getDate() === now.getDate() &&
             orderDate.getMonth() === now.getMonth() &&
             orderDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return orderDate >= oneWeekAgo;
    }
    return true;
  });

  const totalRevenue = filteredOrders.reduce((acc, order) => acc + (order.price || 0), 0);
  const totalOrders = filteredOrders.length;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800" dir="ltr">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black text-white flex items-center gap-3">
            <ShoppingBag className="text-indigo-400" />
            YANIS SHOP
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Admin Pro</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            Aperçu
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Package size={20} />
            Commandes
            {orders.length > 0 && (
              <span className="ml-auto bg-slate-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">{orders.length}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('dhd_orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'dhd_orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Plane size={20} />
            Confirmation DHD
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'products' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <ShoppingBag size={20} />
            Produits
            {(config?.products?.length > 0) && (
              <span className="ml-auto bg-slate-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">{config.products.length}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('shipping')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'shipping' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <MapPin size={20} />
            Tarifs & Livraison
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={20} />
            Configurations
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'integrations' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <RefreshCw size={20} />
            Intégrations
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 md:hidden">
            <h1 className="text-lg font-black text-slate-900">YANIS SHOP</h1>
            <button onClick={handleLogout} className="text-slate-500 hover:text-rose-500"><LogOut size={20}/></button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">Tableau de Bord</h2>
                    <p className="text-slate-500 font-medium">Statistiques et état actuel de la boutique</p>
                  </div>
                  <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm flex items-center gap-1 self-start md:self-auto">
                    <button onClick={() => setDateFilter('all')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${dateFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Tout</button>
                    <button onClick={() => setDateFilter('week')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${dateFilter === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Cette Semaine</button>
                    <button onClick={() => setDateFilter('today')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${dateFilter === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Aujourd'hui</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                      <Eye size={24} />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">Visites Totales</p>
                    <h3 className="text-3xl font-black text-slate-900">{config.visits}</h3>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <ShoppingCart size={24} />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">Commandes</p>
                    <h3 className="text-3xl font-black text-slate-900">{totalOrders}</h3>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                      <DollarSign size={24} />
                    </div>
                    <p className="text-slate-500 font-medium mb-1">Revenus Estimés (DA)</p>
                    <h3 className="text-3xl font-black text-slate-900">{totalRevenue.toLocaleString()}</h3>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mt-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-500"/> 
                    Statistiques de Conversion
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-50 h-4 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                        style={{ width: `${config.visits > 0 ? Math.min((totalOrders / config.visits) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-bold text-slate-700 w-16 text-right">
                      {config.visits > 0 ? ((totalOrders / config.visits) * 100).toFixed(1) : '0'}%
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Taux de conversion (Commandes / Visites)</p>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Package size={20} className="text-indigo-500"/> 
                      Dernières Commandes
                    </h3>
                    <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Voir tout</button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 font-bold text-slate-600 text-sm">ID</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Date</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Client</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Téléphone</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Wilaya</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Prix (DA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.slice(0, 5).map((order, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            
                            <td className="p-4 font-bold text-slate-800">#{order.displayId || order.id.slice(0,4)}</td>
                            <td className="p-4 text-sm text-slate-500">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                            </td>
                            <td className="p-4 font-bold text-slate-800">{order.name}</td>
                            <td className="p-4 font-mono text-slate-600">{order.phone}</td>
                            <td className="p-4 text-sm text-slate-600">{order.wilaya}</td>
                            <td className="p-4 font-black text-emerald-600">{order.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                      <div className="text-center py-8 text-slate-500 font-medium">Aucune commande récente.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">Liste des Commandes</h2>
                    <p className="text-slate-500 font-medium">{filteredOrders.length} commandes trouvées</p>
                  </div>
                  <div className="bg-white rounded-lg p-1 border border-slate-200 shadow-sm flex items-center gap-1 self-start md:self-auto">
                    <button onClick={() => setDateFilter('all')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${dateFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Tout</button>
                    <button onClick={() => setDateFilter('week')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${dateFilter === 'week' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Cette Semaine</button>
                    <button onClick={() => setDateFilter('today')} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${dateFilter === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>Aujourd'hui</button>
                  </div>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  {filteredOrders.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <Package size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg">Aucune commande pour le moment.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 font-bold text-slate-600 text-sm">ID</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Date</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Client</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Téléphone</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Wilaya / Commune</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Livraison</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Prix (DA)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              
                              <td className="p-4 font-bold text-slate-800">#{order.displayId || order.id.slice(0,4)}</td>
                              <td className="p-4 text-sm text-slate-500">
                                {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR') : 'N/A'}
                              </td>
                              <td className="p-4 font-bold text-slate-800">{order.name}</td>
                              <td className="p-4 font-mono text-slate-600">{order.phone}</td>
                              <td className="p-4 text-sm text-slate-600">{order.wilaya}, {order.commune}</td>
                              <td className="p-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${order.deliveryType === 'home' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                  {order.deliveryType === 'home' ? 'Domicile' : 'Stop Desk'}
                                </span>
                              </td>
                              <td className="p-4 font-black text-emerald-600">{order.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            
            
            {/* DHD Confirmation Tab */}
            {activeTab === 'dhd_orders' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1">Confirmation & DHD</h2>
                    <p className="text-slate-500 font-medium">Gérez la confirmation et l'envoi vers Ecotrack (DHD)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        placeholder="Recherche (Nom, Tél, Track...)"
                        value={dhdSearch}
                        onChange={e => setDhdSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide">
                  {['all', 'pending', 'confirmed', 'dhd_pushed', 'shipped', 'unreachable', 'cancelled', 'returned'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setDhdFilter(f)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${dhdFilter === f ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                      {f === 'all' ? 'Tout' : 
                       f === 'pending' ? 'Non confirmée' : 
                       f === 'confirmed' ? 'Confirmée' : 
                       f === 'dhd_pushed' ? 'Chez DHD' : 
                       f === 'shipped' ? 'Expédiée' : 
                       f === 'unreachable' ? 'Injoignable' : 
                       f === 'cancelled' ? 'Annulée' : 'Retournée'}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-4 font-bold text-slate-600 text-sm">Date</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Client / Contact</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Produit</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Lieu & Prix</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Statut</th>
                          <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getDhdOrders().map((order) => {
                          const status = order.status || 'pending';
                          return (
                            <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                                <span className="font-bold text-slate-800 mr-2">#{order.displayId || order.id.slice(0,4)}</span><br/>
                                {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-800">{order.name}</div>
                                <div className="flex items-center gap-1 text-slate-500 font-mono text-sm mt-1">
                                  <Phone size={12} /> {order.phone}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-slate-700 text-sm">{order.productName || 'Produit par défaut'}</div>
                              </td>
                              
                              <td className="p-4">
                                <div className="text-sm font-medium text-slate-700">{order.wilaya} - {order.commune}</div>
                                <div className="font-black text-emerald-600 mt-1 mb-2">{order.price} DA <span className="text-xs font-normal text-slate-500">({order.deliveryType === 'home' ? 'Domicile' : 'Stop Desk'})</span></div>
                                
                                <div className="flex flex-col gap-1 mt-2">
                                  <input 
                                    type="text" 
                                    placeholder="Note/Remarque interne..." 
                                    defaultValue={order.note || ''}
                                    onBlur={(e) => {
                                      if (e.target.value !== order.note) updateOrderStatus(order.id, status, { note: e.target.value });
                                    }}
                                    className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 w-full"
                                  />
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="flex flex-col gap-2">
                                  <select
                                    value={status}
                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                    disabled={loadingAction === order.id}
                                    className={`text-sm font-bold px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors
                                      ${status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        status === 'dhd_pushed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                        status === 'unreachable' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}
                                  >
                                    <option value="pending">En attente</option>
                                    <option value="confirmed">Confirmée</option>
                                    <option value="unreachable">Injoignable</option>
                                    <option value="dhd_pushed">Chez DHD (Créé)</option>
                                    <option value="shipped">Expédié</option>
                                    <option value="returned">Retournée</option>
                                    <option value="cancelled">Annulée</option>
                                  </select>
                                  
                                  
                                  {(status === 'dhd_pushed' || status === 'shipped') && order.dhdTrackingId && (
                                    <button onClick={() => syncDhdStatus(order)} disabled={loadingAction === 'sync_' + order.id} className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors text-xs font-bold" title="Synchroniser l'état depuis DHD">
                                      {loadingAction === 'sync_' + order.id ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    </button>
                                  )}

                                  {order.dhdTrackingId && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      ID: {order.dhdTrackingId}
                                    </div>
                                  )}
                                  {status === 'shipped' && (
                                    <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                      <Package size={12} />
                                      {order.dhdStatus || 'En cours de livraison'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right space-y-2">
                                <div className="flex justify-end gap-2 flex-wrap max-w-[200px] ml-auto">
                                  <a href={`tel:${order.phone}`} className="p-2 bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition-colors flex items-center justify-center" title="Appeler">
                                    <Phone size={16} />
                                  </a>

                                  {status === 'confirmed' && (
                                    <button onClick={() => pushToDHD(order)} disabled={loadingAction === 'push_' + order.id} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-bold text-xs shadow-sm shadow-indigo-200">
                                      {loadingAction === 'push_' + order.id ? <RefreshCw size={14} className="animate-spin" /> : <Plane size={14} />}
                                      Pousser DHD
                                    </button>
                                  )}
                                  
                                  {(status === 'dhd_pushed' || status === 'shipped') && (
                                    <div className="flex gap-1 flex-wrap justify-end">
                                      <button onClick={() => alert('Fonctionnalité DHD: Impression étiquette (PDF)')} className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md transition-colors text-xs font-bold" title="Imprimer l'étiquette">Impr.</button>
                                      {status === 'dhd_pushed' && (
                                        <>
                                          <button onClick={() => alert('Fonctionnalité DHD: Modification de colis en cours de développement (Nécessite API Ecotrack update_colis)')} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors text-xs font-bold" title="Modifier le colis">Modif.</button>
                                          <button onClick={() => alert('Fonctionnalité DHD: Suppression de colis en cours de développement')} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition-colors text-xs font-bold" title="Supprimer le colis">Suppr.</button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {getDhdOrders().length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Aucune commande trouvée pour ce filtre.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Gestion des Produits</h2>
                  <button 
                    onClick={() => setEditingProduct({ id: 'prod_' + Date.now(), name: '', description: '', price: 0, oldPrice: 0, imageUrl: '', isVisible: true, isDhdStored: false, dhdRef: '' })}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    + Nouveau Produit
                  </button>
                </div>

                {editingProduct && (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl mb-8">
                    <h3 className="text-xl font-bold mb-4">{editingProduct.name ? 'Modifier Produit' : 'Nouveau Produit'}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nom du Produit</label>
                        <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                        <textarea value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" rows={3}></textarea>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Prix (DA)</label>
                          <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1">Ancien Prix (DA)</label>
                          <input type="number" value={editingProduct.oldPrice} onChange={(e) => setEditingProduct({...editingProduct, oldPrice: Number(e.target.value)})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">URL de l'image</label>
                        <input type="text" value={editingProduct.imageUrl} onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Type de commande DHD par défaut pour ce produit</label>
                        <select 
                          value={editingProduct.isDhdStored ? 'stock' : 'no_stock'} 
                          onChange={(e) => setEditingProduct({...editingProduct, isDhdStored: e.target.value === 'stock'})}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        >
                          <option value="no_stock">Colis sans stock (Standard)</option>
                          <option value="stock">Colis avec stock (Stocké chez DHD)</option>
                        </select>
                      </div>
                      {editingProduct.isDhdStored && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                          <label className="block text-sm font-bold text-indigo-900 mb-1">Référence du produit (Code DHD) *</label>
                          <p className="text-xs text-indigo-700 mb-2">Obligatoire pour les colis avec stock. Ce code sera envoyé comme "TProduit" à l'API Ecotrack.</p>
                          <input type="text" value={editingProduct.dhdRef || ''} onChange={(e) => setEditingProduct({...editingProduct, dhdRef: e.target.value})} className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-lg outline-none focus:border-indigo-400 font-mono" placeholder="Ex: REF-STOCK-123" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                        <input type="checkbox" checked={editingProduct.isVisible} onChange={(e) => setEditingProduct({...editingProduct, isVisible: e.target.checked})} id="isVisible" className="w-5 h-5" />
                        <label htmlFor="isVisible" className="font-bold text-slate-700">Afficher le produit sur le site</label>
                      </div>
                      
                      <div className="flex gap-4 mt-6">
                        <button 
                          onClick={() => {
                            const newProducts = [...(config.products || [])];
                            const idx = newProducts.findIndex(p => p.id === editingProduct.id);
                            if (idx >= 0) newProducts[idx] = editingProduct;
                            else newProducts.push(editingProduct);
                            setConfig({...config, products: newProducts});
                            setEditingProduct(null);
                          }}
                          className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700"
                        >
                          Appliquer
                        </button>
                        <button onClick={() => setEditingProduct(null)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-xl font-bold hover:bg-slate-300">Annuler</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(config.products || []).map((prod: any, idx: number) => (
                    <div key={idx} className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex gap-4 ${!prod.isVisible ? 'opacity-60 grayscale' : ''}`}>
                      <img src={prod.imageUrl || "https://images.unsplash.com/photo-1584308666744-24d5e4708705?q=80&w=800&auto=format&fit=crop"} className="w-24 h-24 object-cover rounded-xl bg-slate-100" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900">{prod.name}</h4>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingProduct(prod)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">Modifier</button>
                            <button onClick={() => {
                              if(confirm('Supprimer ce produit ?')) {
                                setConfig({...config, products: config.products.filter((p: any) => p.id !== prod.id)});
                              }
                            }} className="text-rose-600 hover:text-rose-800 text-sm font-bold">Suppr.</button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
                        <div className="mt-2 font-black text-emerald-600">{prod.price} DA</div>
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${prod.isVisible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {prod.isVisible ? 'Visible' : 'Masqué'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!config.products || config.products.length === 0) && (
                    <div className="col-span-full text-center py-12 text-slate-500">Aucun produit configuré.</div>
                  )}
                </div>
                
                <div className="mt-8 flex justify-end sticky bottom-4">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 py-4 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 disabled:opacity-70"
                  >
                    <Save size={24} />
                    <span>{saving ? 'Enregistrement...' : 'Sauvegarder les changements'}</span>
                  </button>
                </div>
                {saveMessage && (
                  <div className={`mt-4 px-6 py-4 rounded-2xl font-bold border ${saveMessage.includes('succès') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {saveMessage}
                  </div>
                )}
              </motion.div>
            )}

            
            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Tarifs de Livraison & Wilayas</h2>
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <p className="text-slate-500 text-sm">Consultez les tarifs de livraison par wilaya (Domicile et Stop Desk). Ces données sont utilisées lors de la commande.</p>
                  </div>
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                        <tr>
                          <th className="p-4 font-bold text-slate-600 text-sm">Wilaya</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Tarif Domicile (DA)</th>
                          <th className="p-4 font-bold text-slate-600 text-sm">Tarif Stop Desk (DA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(import_data.DELIVERY_PRICES).map(([wilayaName, prices]: any) => (
                          <tr key={wilayaName} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-800">{wilayaName}</td>
                            <td className="p-4 text-emerald-600 font-black">{prices.home}</td>
                            <td className="p-4 text-emerald-600 font-black">{prices.desk}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            
            {activeTab === 'integrations' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                  <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.5 3h-15C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zM13 17H5v-2h8v2zm6-4H5v-2h14v2zm0-4H5V7h14v2z" />
                    </svg>
                    Intégration Google Sheets
                  </h3>
                  
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Connectez votre compte Google pour exporter et synchroniser automatiquement toutes vos commandes vers un fichier Google Sheets.
                  </p>

                  <div className="flex flex-col gap-6 items-start">
                    {!googleUser ? (
                      <button 
                        onClick={handleGoogleSignIn}
                        className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center gap-3 shadow-sm transition-all"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        Se connecter avec Google
                      </button>
                    ) : (
                      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                              {googleUser.displayName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{googleUser.displayName}</p>
                              <p className="text-sm text-slate-500">{googleUser.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={async () => { await logout(); setGoogleUser(null); setGoogleToken(null); }}
                            className="text-sm text-rose-600 font-bold hover:underline"
                          >
                            Déconnexion
                          </button>
                        </div>
                        
                        <div className="border-t border-slate-200 pt-6">
                          <div className="mb-6">
                            <h4 className="text-md font-bold text-slate-800 mb-3">Lier un fichier Google Sheets</h4>
                            {config.spreadsheetId ? (
                              <div className="mb-4">
                                <p className="text-sm font-bold text-slate-700 mb-1">Fichier Actuel :</p>
                                <a 
                                  href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline break-all"
                                >
                                  Ouvrir le fichier actuel
                                </a>
                              </div>
                            ) : (
                              <p className="text-sm text-amber-600 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                Aucun fichier Sheets n'est encore lié.
                              </p>
                            )}
                            
                            <div className="flex gap-2 mb-2">
                              <input 
                                type="text"
                                placeholder="Lien ou ID du nouveau Google Sheet (Optionnel)"
                                className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={customSheetInput}
                                onChange={(e) => setCustomSheetInput(e.target.value)}
                              />
                              <button 
                                onClick={saveCustomSheetId}
                                disabled={!customSheetInput.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                              >
                                Lier ce fichier
                              </button>
                            </div>
                            <p className="text-xs text-slate-500">Si vous laissez vide et cliquez sur synchroniser, un nouveau fichier sera créé automatiquement.</p>
                          </div>
                          
                          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-emerald-800 mb-2">Synchronisation Manuelle</h4>
                            <p className="text-xs text-emerald-600 mb-4">La synchronisation est automatique lors des nouvelles commandes. Vous pouvez forcer la synchronisation manuellement pour les anciennes commandes.</p>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                              <select 
                                className="bg-white border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm font-bold shadow-sm"
                                value={syncDateFilter}
                                onChange={(e) => setSyncDateFilter(e.target.value)}
                              >
                                <option value="all">Toutes les commandes</option>
                                <option value="today">Aujourd'hui</option>
                                <option value="yesterday">Hier</option>
                                <option value="7days">7 derniers jours</option>
                              </select>

                              <button
                                onClick={handleSyncToSheets}
                                disabled={syncingSheets}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-sm"
                              >
                                <RefreshCw size={20} className={syncingSheets ? 'animate-spin' : ''} />
                                {syncingSheets ? 'Synchronisation...' : 'Synchroniser'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {sheetMessage && (
                      <div className={`w-full p-4 rounded-xl font-bold flex items-center gap-2 ${sheetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {sheetMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {sheetMessage.text}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 className="text-2xl font-black text-slate-900 mb-8">Configurations du Magasin</h2>
                
                <form onSubmit={handleSave} className="space-y-8">
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Tag className="text-indigo-500"/>
                      Paramètres des Prix & Promotion
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Prix de vente (DA)</label>
                        <input 
                          type="number" 
                          value={config.productPrice}
                          onChange={(e) => setConfig({...config, productPrice: Number(e.target.value)})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Prix original avant promo (DA)</label>
                        <input 
                          type="number" 
                          value={config.productOldPrice}
                          onChange={(e) => setConfig({...config, productOldPrice: Number(e.target.value)})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <h4 className="font-bold text-slate-900">Activer la promotion</h4>
                        <p className="text-sm text-slate-500 mt-1">Affiche le prix barré et les badges "Takhfid" sur le site.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={config.promoActive}
                          onChange={(e) => setConfig({...config, promoActive: e.target.checked})}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Texte de la promotion (affiché dans le formulaire)</label>
                      <input 
                        type="text" 
                        value={config.promoText || 'عرض ترويجي محدود!'}
                        onChange={(e) => setConfig({...config, promoText: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-right"
                        dir="rtl"
                      />
                    </div>
                  </div>

                                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <Clock className="text-indigo-500"/>
                      Paramètres du Minuteur
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                      <div>
                        <h4 className="font-bold text-slate-900">Activer le minuteur d'urgence</h4>
                        <p className="text-sm text-slate-500 mt-1">Affiche un compte à rebours sur la page produit.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={config.timerEnabled}
                          onChange={(e) => setConfig({...config, timerEnabled: e.target.checked})}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {config.timerEnabled && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Durée initiale du minuteur (Heures)</label>
                        <input 
                          type="number" 
                          value={config.timerHours || 24}
                          onChange={(e) => setConfig({...config, timerHours: Number(e.target.value)})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                      <TrendingUp className="text-indigo-500"/>
                      Pixels & Tracking
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Facebook Pixel ID <span className="text-slate-400 font-normal">(séparés par des virgules)</span></label>
                        <input 
                          type="text" 
                          value={config.fbPixelId || ''}
                          onChange={(e) => setConfig({...config, fbPixelId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                          placeholder="ex: 123456789, 987654321"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Facebook CAPI Access Token <span className="text-slate-400 font-normal">(Optionnel)</span></label>
                        <input 
                          type="text" 
                          value={config.fbAccessToken || ''}
                          onChange={(e) => setConfig({...config, fbAccessToken: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                          placeholder="Token d'accès Facebook Conversions API"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">TikTok Pixel ID <span className="text-slate-400 font-normal">(séparés par des virgules)</span></label>
                        <input 
                          type="text" 
                          value={config.tiktokPixelId || ''}
                          onChange={(e) => setConfig({...config, tiktokPixelId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                          placeholder="ex: CJ123XYZ, CK987ABC"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">TikTok CAPI Access Token <span className="text-slate-400 font-normal">(Optionnel)</span></label>
                        <input 
                          type="text" 
                          value={config.tiktokAccessToken || ''}
                          onChange={(e) => setConfig({...config, tiktokAccessToken: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                          placeholder="Token d'accès TikTok Events API"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sticky bottom-4">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all disabled:opacity-70 shadow-xl shadow-indigo-200"
                    >
                      <Save size={24} />
                      <span>{saving ? 'Enregistrement...' : 'Enregistrer les configurations'}</span>
                    </button>
                    
                    {saveMessage && (
                      <div className={`px-6 py-4 rounded-2xl font-bold border ${saveMessage.includes('succès') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {saveMessage}
                      </div>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
