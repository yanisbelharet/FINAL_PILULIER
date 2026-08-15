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
    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1d' });
    
    // Set cookie
    res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, error: "Invalid password" });
  }
}
