// api/presets.js
// 從 Firestore 讀取預設清單（需通過 token 驗證）

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin() {
    if (getApps().length) return;
    initializeApp({
        credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID }),
        projectId:  process.env.FIREBASE_PROJECT_ID
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: '僅支援 GET' });

    // 從 Authorization header 取得 ID token
    const idToken = req.headers.authorization?.replace('Bearer ', '');
    if (!idToken) return res.status(401).json({ error: '缺少授權 token' });

    try {
        initAdmin();
        const decoded = await getAuth().verifyIdToken(idToken);

        // 白名單驗證
        if (decoded.email !== process.env.ALLOWED_EMAIL) {
            return res.status(403).json({ error: '無存取權限' });
        }

        // 從 Firestore 讀取
        const db   = getFirestore();
        const snap = await db.collection('image-cropper-tool').doc('default').get();
        const presets = snap.exists ? (snap.data().presets || []) : [];

        return res.status(200).json({ presets });
    } catch (err) {
        return res.status(401).json({ error: `驗證失敗：${err.message}` });
    }
}
