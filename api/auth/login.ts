import jwt from "jsonwebtoken";

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error("Failed to parse body", e);
    }
  }

  const password = body?.password;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  
  if (password === adminPassword) {
    // L'app mobile (/app) demande une session longue pour ne pas se reconnecter chaque jour
    const remember = body?.remember === true;
    const maxAge = remember ? 30 * 24 * 3600 : 86400;
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'supersecret', { expiresIn: maxAge });
    
    // Set cookie
    res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    // Le jeton est aussi renvoyé : l'app /app l'utilise (Authorization: Bearer), /admin le stocke déjà s'il est présent
    return res.status(200).json({ success: true, token });
  } else {
    return res.status(401).json({ success: false, error: "Invalid password" });
  }
}
