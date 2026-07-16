import { db } from '@/lib/supabase';
import JoinForm from '@/components/JoinForm';

export const dynamic = 'force-dynamic';

export default async function Join({ params }: { params: { code: string } }) {
  const { data: invite } = await db()
    .from('invites')
    .select('code, used_by, teacher:teacher_id(name)')
    .eq('code', params.code)
    .maybeSingle();

  const teacherName = (invite as any)?.teacher?.name;
  const valid = !!invite && !invite.used_by;

  return (
    <div className="login">
      <div className="topbar" style={{ padding: 0 }}><div className="gem" /> <b>NIHON</b></div>
      {valid ? (
        <>
          <h1><em>{teacherName}</em> 선생님의 초대</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', textAlign: 'center', maxWidth: 320, marginTop: -6 }}>
            가입하면 수업 노트·복습·일정이 이 계정에 쌓여요.
          </p>
          <JoinForm code={params.code} />
        </>
      ) : (
        <>
          <h1>유효하지 않은 <em>초대 링크</em></h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted)' }}>이미 사용됐거나 잘못된 링크예요. 선생님께 새 링크를 요청해 주세요.</p>
        </>
      )}
    </div>
  );
}
