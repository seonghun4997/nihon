import { db } from '@/lib/supabase';
import { getSession, OWNER_ID } from '@/lib/session';

export const dynamic = 'force-dynamic';

// 자가진단 — 업로드 후 이 페이지 하나로 남은 일이 뭔지 판정
export default async function Status({ searchParams }: { searchParams: { key?: string } }) {
  const authed = !!getSession() || (!!process.env.ACCESS_CODE && searchParams?.key === process.env.ACCESS_CODE);

  const checks: { name: string; ok: boolean | null; fix?: string; link?: string }[] = [];

  // 1. 환경변수
  const url = process.env.SUPABASE_URL || '';
  const urlOK = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url);
  checks.push({ name: 'ACCESS_CODE 등록', ok: !!process.env.ACCESS_CODE, fix: 'Vercel 환경변수에 ACCESS_CODE 추가 후 Redeploy', link: 'https://vercel.com/jari3/nihon/settings/environment-variables' });
  checks.push({ name: 'SUPABASE_URL 형식 (https://xxxx.supabase.co)', ok: !!url && urlOK, fix: 'Supabase → Settings → API의 Project URL을 복사해 교체 → Redeploy', link: 'https://vercel.com/jari3/nihon/settings/environment-variables' });
  checks.push({ name: 'SUPABASE_SERVICE_ROLE_KEY 등록', ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY, fix: 'Supabase → Settings → API의 service_role 키(secret) 등록 → Redeploy', link: 'https://vercel.com/jari3/nihon/settings/environment-variables' });
  checks.push({ name: 'ANTHROPIC_API_KEY 등록 (노트 엔진용)', ok: !!process.env.ANTHROPIC_API_KEY, fix: 'Vercel 환경변수에 추가 → Redeploy' });

  // 2. DB 연결 + 테이블 + 시드 (인증된 경우만 실제 조회)
  let dbReach: boolean | null = null, tables: boolean | null = null, seeded: boolean | null = null;
  if (authed && url && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { error } = await db().from('users').select('id', { count: 'exact', head: true });
      if (error) {
        dbReach = true;
        tables = !/relation|does not exist|schema cache/i.test(error.message);
      } else {
        dbReach = true;
        const [{ error: e1 }, { error: e2 }] = await Promise.all([
          db().from('speaks').select('id', { count: 'exact', head: true }),
          db().from('jp_prefs').select('lang', { count: 'exact', head: true }),
        ]);
        tables = !e1 && !e2;
        if (tables) {
          const { data } = await db().from('users').select('id').eq('id', OWNER_ID).maybeSingle();
          seeded = !!data;
        }
      }
    } catch {
      dbReach = false;
    }
  }
  checks.push({ name: 'Supabase 연결', ok: dbReach, fix: 'SUPABASE_URL 값이 틀렸을 가능성이 커요 — 위 2번 항목 확인' });
  checks.push({ name: '테이블 설치 (all-in-one.sql)', ok: tables, fix: 'Supabase SQL Editor에 supabase/all-in-one.sql 전체 붙여넣고 Run — 이게 마지막 남은 한 번입니다', link: 'https://supabase.com/dashboard/projects' });
  checks.push({ name: '초기 데이터 (자동 — 로그인하면 앱이 만듦)', ok: seeded, fix: '테이블 설치 후 로그인 한 번이면 자동 생성돼요' });

  const allOK = checks.every((c) => c.ok === true);

  return (
    <div className="wrap" style={{ paddingBottom: 60 }}>
      <header className="topbar"><div className="gem" /> <b>NIHON</b> <span className="right"><span className="role-badge">진단</span></span></header>
      <div className="eyebrow">Setup Status</div>
      <h1 className="big">{allOK ? <>준비 <em>완료</em> 🎉</> : <>남은 일이 <em>여기</em> 보입니다</>}</h1>
      <div className="sub">{authed ? '아래에서 ❌인 항목의 처방만 따라 하면 끝나요.' : '전체 진단은 로그인 후 또는 주소 뒤에 ?key=접속코드 를 붙여 확인하세요.'}</div>

      <div className="card" style={{ marginTop: 18 }}>
        {checks.map((c, i) => (
          <div key={i} className="inv-row">
            <span style={{ fontSize: 13.5 }}>
              {c.ok === true ? '✅' : c.ok === false ? '❌' : '⏸'} {c.name}
              {c.ok === false && c.fix && (
                <span className="hintline" style={{ display: 'block', marginTop: 3 }}>
                  → {c.fix}{c.link ? <> · <a href={c.link} style={{ color: 'var(--green)' }} target="_blank">바로가기</a></> : null}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {allOK && (
        <div className="row" style={{ marginTop: 16 }}>
          <a href="/s" className="btn block">앱 시작하기 →</a>
        </div>
      )}
      <p className="hintline" style={{ textAlign: 'center', marginTop: 14 }}>업로드 직후엔 이 페이지부터: nihon-kappa.vercel.app/status</p>
    </div>
  );
}
