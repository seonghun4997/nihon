import { createHmac, randomBytes } from 'crypto';

// 솔라피 문자 — 수신자 지정 가능 (멀티유저), 키 없으면 건너뜀
export async function sendSMS(to: string | null | undefined, text: string): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_FROM;
  if (!apiKey || !apiSecret || !from || !to) {
    return { sent: false, reason: 'no-keys-or-recipient' };
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
    body: JSON.stringify({ message: { to: to.replace(/-/g, ''), from, text } }),
  });
  if (!res.ok) return { sent: false, reason: `http-${res.status}` };
  return { sent: true };
}
