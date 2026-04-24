// api/auth.js
// 驗證 Google ID token，確認是否為授權帳號
// Firebase config 完全存於 Vercel 環境變數，前端不可見

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// 初始化 Firebase Admin（使用環境變數，不需 service account 金鑰檔）
function initAdmin() {
    if (getApps().length) return;
    initializeApp({
        credential: cert({
            projectId:   process.env.FIREBASE_PROJECT_ID,
            // Admin SDK 使用 Application Default Credentials
            // 在 Vercel 上透過 projectId 即可驗證 token
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

export default async function handler(req, res) {
    // 允許跨來源請求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '僅支援 POST' });

    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: '缺少 idToken' });

    try {
        initAdmin();
        const auth = getAuth();
        const decoded = await auth.verifyIdToken(idToken);

        // 白名單驗證：僅允許指定 Gmail 帳號
        const allowedEmail = process.env.ALLOWED_EMAIL;
        if (decoded.email !== allowedEmail) {
            return res.status(403).json({ error: `帳號 ${decoded.email} 無存取權限` });
        }

        return res.status(200).json({ ok: true, email: decoded.email });
    } catch (err) {
        return res.status(401).json({ error: `驗證失敗：${err.message}` });
    }
}
