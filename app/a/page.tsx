import { db } from '@/lib/supabase';
import Topbar from '@/components/Topbar';
import ApproveButton from '@/components/ApproveButton';

export const dynamic = 'force-dynamic';

export default async function Admin() {
  const s = db();
  const [{ data: pending }, { count: teachers }, { count: students }, { count: lessons7 }, { count: pairs }] = await Promise.all([
    s.from('users').select('id, name, email, phone, created_at').eq('role', 'teacher').eq('approved', false).order('created_at'),
    s.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher').eq('approved', true),
    s.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    s.from('lessons').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    s.from('enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  return (
    <>
      <Topbar badge="운영자" />
      <div className="eyebrow">Admin</div>
      <h1 className="big">운영 <em>콘솔</em></h1>

      <div className="stu-stats" style={{ marginTop: 16 }}>
        <span className="stat">선생님 <b>{teachers || 0}</b></span>
        <span className="stat">학생 <b>{students || 0}</b></span>
        <span className="stat">활성 페어 <b>{pairs || 0}</b></span>
        <span className="stat good">주간 노트 <b>{lessons7 || 0}</b></span>
      </div>

      <div className="card">
        <div className="card-tag">선생님 승인 대기 {(pending || []).length}건</div>
        {(pending || []).map((t: any) => (
          <div key={t.id} className="inv-row">
            <span><b>{t.name}</b> <span className="hintline">{t.email}{t.phone ? ' · ' + t.phone : ''}</span></span>
            <ApproveButton userId={t.id} />
          </div>
        ))}
        {(pending || []).length === 0 && <p className="desc">대기 중인 선생님이 없어요.</p>}
      </div>
      <p className="hintline" style={{ textAlign: 'center' }}>γ(주간 수업 노트 생성률)가 심장 지표 — 활성 페어 대비 주간 노트 수를 보세요.</p>
    </>
  );
}
