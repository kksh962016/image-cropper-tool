// api/save.js
// 將預設清單寫入 Firestore（需通過 token 驗證）

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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: '僅支援 POST' });

    const idToken = req.headers.authorization?.replace('Bearer ', '');
    if (!idToken) return res.status(401).json({ error: '缺少授權 token' });

    const { presets } = req.body;
    if (!Array.isArray(presets)) return res.status(400).json({ error: '資料格式錯誤' });

    try {
        initAdmin();
        const decoded = await getAuth().verifyIdToken(idToken);

        // 白名單驗證
        if (decoded.email !== process.env.ALLOWED_EMAIL) {
            return res.status(403).json({ error: '無存取權限' });
        }

        // 寫入 Firestore
        const db = getFirestore();
        await db.collection('image-cropper-tool').doc('default').set({ presets });

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(401).json({ error: `驗證失敗：${err.message}` });
    }
}
