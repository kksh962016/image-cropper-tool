// api/auth.js
// 驗證 Google ID token，確認是否為授權帳號
// 所有 Firebase 設定完全存於 Vercel 環境變數，前端不可見

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// 使用 Service Account 環境變數初始化 Firebase Admin
function initAdmin() {
    if (getApps().length) return;
    initializeApp({
        credential: cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Vercel 環境變數會將 \n 轉為字面字串，需還原為換行符號
            privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '僅支援 POST' });

    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: '缺少 idToken' });

    try {
        initAdmin();
        const decoded = await getAuth().verifyIdToken(idToken);

        // 白名單驗證：僅允許指定 Gmail 帳號
        if (decoded.email !== process.env.ALLOWED_EMAIL) {
            return res.status(403).json({ error: `帳號 ${decoded.email} 無存取權限` });
        }

        return res.status(200).json({ ok: true, email: decoded.email });
    } catch (err) {
        return res.status(401).json({ error: `驗證失敗：${err.message}` });
    }
}
