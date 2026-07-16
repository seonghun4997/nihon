import { createHmac, randomBytes } from 'crypto';

// 솔라피 문자 발송 — 키가 없으면 조용히 건너뜀 (개발 중에도 앱이 죽지 않게)
export async function sendSMS(text: string): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_FROM;
  const to = process.env.SOLAPI_TO;
  if (!apiKey || !apiSecret || !from || !to) {
    console.log('[solapi] 키 미설정 — 발송 건너뜀:', text.slice(0, 60));
    return { sent: false, reason: 'no-keys' };
  }

  const date = new Date().toISOString();
  const salt = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', apiSecret).update(date + salt).digest('hex');

  const res = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    },
    body: JSON.stringify({ message: { to, from, text } }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error('[solapi] 발송 실패:', res.status, t.slice(0, 200));
    return { sent: false, reason: `http-${res.status}` };
  }
  return { sent: true };
}
