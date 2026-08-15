import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import jwt from "jsonwebtoken";

const firebaseConfig = {
  projectId: "gen-lang-client-0983661862",
  appId: "1:492139124696:web:b67e8ef2beaa622150c4ad",
  apiKey: "AIzaSyBmaOFGKyMwJ735BkZ4Psmdx6H2rAtBei8",
  authDomain: "gen-lang-client-0983661862.firebaseapp.com",
  storageBucket: "gen-lang-client-0983661862.firebasestorage.app",
  messagingSenderId: "492139124696"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-e9c2d681-7821-46c6-83a5-06aac423e67a");

export default async function handler(req, res) {
  const defaultConfig = {
    productPrice: 2000,
    fbPixelId: "",
    tiktokPixelId: ""
  };

  if (req.method === 'GET') {
    try {
      const docRef = doc(db, "config", "main");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return res.status(200).json({ ...defaultConfig, ...docSnap.data() });
      }
    } catch (error) {
      console.error("Error reading config:", error);
    }
    return res.status(200).json(defaultConfig);
  }

  if (req.method === 'POST') {
    // Auth Check
    const token = req.cookies?.admin_token || req.headers.cookie?.match(/(?:(?:^|.*;\s*)admin_token\s*\=\s*([^;]*).*$)|^.*$/)?.[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      
      let currentConfig = defaultConfig;
      try {
        const docRef = doc(db, "config", "main");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          currentConfig = { ...defaultConfig, ...docSnap.data() };
        }
      } catch (e) {}

      const newConfig = { ...currentConfig, ...req.body };
      await setDoc(doc(db, "config", "main"), newConfig, { merge: true });
      
      return res.status(200).json({ success: true, config: newConfig });
    } catch (error) {
      console.error("Config save error:", error);
      return res.status(401).json({ error: "Invalid token or Firebase error" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
