import { db } from './supabase';
import { OWNER_ID } from './session';

// 테이블만 있으면 나머지(오너 행·언어 설정 기본값)는 앱이 스스로 만든다
export async function ensureSeed() {
  try {
    const s = db();
    await s.from('users').upsert({
      id: OWNER_ID, email: 'owner@nihon.local', name: '성훈', phone: '00000000000',
      password_hash: 'owner-mode', role: 'student', approved: true,
    }, { onConflict: 'id', ignoreDuplicates: true });
    await s.from('jp_prefs').upsert([
      { lang: 'jp', weekdays: [2, 5] },
      { lang: 'en', weekdays: [5] },
    ], { onConflict: 'lang', ignoreDuplicates: true });
  } catch { /* 진단은 /status가 담당 */ }
}
