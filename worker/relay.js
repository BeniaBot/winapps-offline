// ממסר CORS זעיר — מה שהופך את האתר לכלי האורז בעצמו.
//
// דפדפן לא מורשה לגשת ישירות לשרתי מיקרוסופט או ל-rg-adguard (אין שם CORS).
// ה-Worker הזה רק מעביר את הבקשה כמות שהיא ומחזיר את התשובה עם הכותרת
// שמתירה לדפדפן לקרוא אותה. שום קובץ לא נשמר כאן.
//
// פריסה (5 דקות, חינם):
//   1. חשבון Cloudflare ← Workers & Pages ← Create Worker.
//   2. להדביק את הקובץ הזה במקום הקוד שנוצר, Deploy.
//   3. את הכתובת (https://xxx.workers.dev) לשים ב-index.html במשתנה RELAY_URL,
//      או ב-localStorage.relay לבדיקה מקומית.

const ALLOWED = [
  'store.rg-adguard.net',
  'delivery.mp.microsoft.com',   // כולל tlu.dl / dl וכו'
];

function allowed(host) {
  return ALLOWED.some(a => host === a || host.endsWith('.' + a));
}

function cors(h) {
  const out = new Headers(h);
  out.set('Access-Control-Allow-Origin', '*');
  out.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  return out;
}

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
      }});
    }

    const target = new URL(req.url).searchParams.get('u');
    if (!target) return new Response('missing ?u=', { status: 400 });

    let t;
    try { t = new URL(target); } catch { return new Response('bad url', { status: 400 }); }
    if (!allowed(t.hostname)) return new Response('host not allowed', { status: 403 });

    const init = { method: req.method, headers: {} };
    const range = req.headers.get('Range');
    if (range) init.headers['Range'] = range;
    init.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

    if (req.method === 'POST') {
      init.body = await req.text();
      init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      init.headers['Referer'] = 'https://store.rg-adguard.net/';
      init.headers['Origin'] = 'https://store.rg-adguard.net';
    }

    const r = await fetch(t.toString(), init);
    return new Response(r.body, { status: r.status, headers: cors(r.headers) });
  }
};
