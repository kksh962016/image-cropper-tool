// api/config.js
// 提供前端初始化 Google 登入所需的最小 Firebase 設定
// 僅回傳 apiKey 與 authDomain，不含任何後台權限

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: '僅支援 GET' });

    return res.status(200).json({
        apiKey:    process.env.FIREBASE_API_KEY,
        authDomain:process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        appId:     process.env.FIREBASE_APP_ID
    });
}
