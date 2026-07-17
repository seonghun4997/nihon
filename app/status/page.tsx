import { db, resolveSupabaseUrl } from '@/lib/supabase';
import { getSession, OWNER_ID } from '@/lib/session';
import { ensureSeed } from '@/lib/seed';

export const dynamic = 'force-dynamic';

// 자가진단 — 업로드 후 이 페이지 하나로 남은 일이 뭔지 판정
export default async function Status({ searchParams }: { searchParams: { key?: string } }) {
  const authed = !!getSession() || (!!process.env.ACCESS_CODE && searchParams?.key === process.env.ACCESS_CODE);

  const checks: { name: string; ok: boolean | null; fix?: string; link?: string }[] = [];

  // 1. 환경변수 (틀려도 키에서 자동 복원)
  const resolved = resolveSupabaseUrl();
  const url = resolved.url || '';
  const urlOK = !!resolved.url && resolved.source !== 'none';
  checks.push({ name: 'ACCESS_CODE 등록', ok: !!process.env.ACCESS_CODE, fix: 'Vercel 환경변수에 ACCESS_CODE 추가 후 Redeploy', link: 'https://vercel.com/jari3/nihon/settings/environment-variables' });
  const masked = url ? url.replace(/^(https?:\/\/)?([^.\/]{0,5})[^\/]*/, (m, p1, p2) => (p1 || '') + p2 + '…') : '(비어있음)';
  checks.push({ name: `SUPABASE 주소 — ${masked}${resolved.source === 'key' ? ' (환경변수가 틀려서 키에서 자동 복원함)' : ''}`, ok: urlOK, fix: 'SERVICE_ROLE_KEY를 Supabase → Settings → API의 service_role 값으로 재등록 → Redeploy', link: 'https://vercel.com/jari3/nihon/settings/environment-variables' });
  checks.push({ name: 'SUPABASE_SERVICE_ROLE_KEY 등록', ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY, fix: 'Supabase → Settings → API의 service_role 키(secret) 등록 → Redeploy', link: 'https://vercel.com/jari3/nihon/settings/environment-variables' });
  checks.push({ name: 'ANTHROPIC_API_KEY 등록 (노트 엔진용)', ok: !!process.env.ANTHROPIC_API_KEY, fix: 'Vercel 환경변수에 추가 → Redeploy' });

  // 2. DB 연결 + 테이블 + 시드 (인증된 경우만 실제 조회)
  let dbReach: boolean | null = null, tables: boolean | null = null, seeded: boolean | null = null;
  let seedReason = '';
  let dbError = '';
  if (authed && url && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { error } = await db().from('users').select('id', { count: 'exact', head: true });
      if (error) {
        // 테이블 없음 계열만 "연결은 됨"으로 인정 — 그 외 모든 에러는 연결 ❌ + 원문 표시
        if (/relation|does not exist|schema cache/i.test(error.message)) {
          dbReach = true;
          tables = false;
        } else {
          dbReach = false;
          dbError = error.message;
        }
      } else {
        dbReach = true;
        const [{ error: e1 }, { error: e2 }] = await Promise.all([
          db().from('speaks').select('id', { count: 'exact', head: true }),
          db().from('jp_prefs').select('lang', { count: 'exact', head: true }),
        ]);
        tables = !e1 && !e2;
        if (tables) {
          const seedErr = await ensureSeed(); // 이 페이지를 여는 것만으로 초기 데이터 자동 생성
          const { data } = await db().from('users').select('id').eq('id', OWNER_ID).maybeSingle();
          seeded = !!data;
          if (!seeded && seedErr) seedReason = seedErr;
        }
      }
    } catch {
      dbReach = false;
    }
  }
  checks.push({ name: 'Supabase 연결 (실제 통신)', ok: dbReach, fix: (dbError ? `서버가 말한 원인: "${dbError}" — ` : '') + 'SUPABASE_URL을 Supabase → Settings → API → Project URL 값으로 교체 후 Redeploy', link: 'https://vercel.com/jari3/nihon/settings/environment-variables' });
  checks.push({ name: '테이블 설치 (all-in-one.sql)', ok: tables, fix: 'Supabase SQL Editor에 supabase/all-in-one.sql 전체 붙여넣고 Run — 이게 마지막 남은 한 번입니다', link: 'https://supabase.com/dashboard/projects' });
  checks.push({ name: '초기 데이터 (이 페이지가 자동 생성)', ok: seeded, fix: seedReason ? `실패 원인: ${seedReason} — 이 문구를 그대로 전달해 주세요` : '이 페이지 새로고침만으로 만들어져요' });

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
