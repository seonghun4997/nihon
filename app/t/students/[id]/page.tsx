import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import { reviewRate7d, parseSlots } from '@/lib/data';
import { formatKo, monthStr } from '@/lib/dates';
import AnswerForm from '@/components/AnswerForm';
import EnrollmentSettings from '@/components/EnrollmentSettings';
import AttendanceControls from '@/components/AttendanceControls';

export const dynamic = 'force-dynamic';

export default async function StudentDetail({ params }: { params: { id: string } }) {
  const sess = getSession()!;
  const s = db();
  const { data: enr } = await s
    .from('enrollments')
    .select('*, student:student_id(id, name, email, phone)')
    .eq('id', params.id)
    .maybeSingle();
  if (!enr || enr.teacher_id !== sess.id) notFound();
  const sid = (enr as any).student.id;
  const m = monthStr();

  const [rate, { data: lessons }, { data: questions }, { data: confs }, { data: atts }] = await Promise.all([
    reviewRate7d(sid),
    s.from('lessons').select('id, lesson_date, title, note').eq('student_id', sid).order('lesson_date', { ascending: false }).limit(10),
    s.from('questions').select('*').eq('enrollment_id', enr.id).order('created_at', { ascending: false }).limit(30),
    s.from('confusions').select('text, count').eq('student_id', sid).eq('resolved', false).order('count', { ascending: false }).limit(6),
    s.from('attendances').select('*').eq('enrollment_id', enr.id).gte('att_date', `${m}-01`).order('att_date', { ascending: false }),
  ]);

  const pending = (questions || []).filter((q) => q.ask_teacher && !q.answered_at);
  const others = (questions || []).filter((q) => !(q.ask_teacher && !q.answered_at));

  return (
    <>
      <header className="topbar"><Link href="/t/students" style={{ color: 'var(--dim)', fontSize: 13 }}>← 학생</Link></header>
      <div className="eyebrow">Student</div>
      <h1 className="big">{(enr as any).student.name} <em>학생</em></h1>
      <div className="sub">주간 복습 {rate}% · 이번 달 출석 {(atts || []).length}회</div>

      {(confs || []).length > 0 && (
        <div className="card">
          <div className="card-tag">헷갈림 노트 — 수업에서 짚어주세요</div>
          <div className="conf" style={{ marginTop: 10 }}>
            {(confs || []).map((c: any, i: number) => (
              <span key={i} className={c.count >= 2 ? 'hot' : ''}>{c.count >= 2 ? '⭐ ' : ''}{c.text}{c.count >= 2 ? ` (${c.count}회)` : ''}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-tag">질문 박스 {pending.length > 0 ? `— 답변 대기 ${pending.length}건` : ''}</div>
        <div className="qa" style={{ marginTop: 6 }}>
          {[...pending, ...others].slice(0, 10).map((q: any) => (
            <div key={q.id} className="item" style={{ background: 'var(--card-2)' }}>
              <div className="q">{q.question}</div>
              {q.ai_answer && <div className="a">{q.ai_answer}</div>}
              {q.teacher_answer
                ? <div className="t-answer"><span className="who">내 답변</span>{q.teacher_answer}</div>
                : <AnswerForm questionId={q.id} />}
            </div>
          ))}
          {(questions || []).length === 0 && <p className="desc">아직 질문이 없어요.</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-tag">최근 수업 노트</div>
        <div className="note-list" style={{ marginTop: 8 }}>
          {(lessons || []).map((l: any) => (
            <div key={l.id} className="note-item" style={{ background: 'var(--card-2)' }}>
              <div className="t"><b>{formatKo(String(l.lesson_date))} · {l.title}</b>
                <div>표현 {(l.note?.expressions || []).length} · 문법 {(l.note?.grammar || []).length}</div></div>
            </div>
          ))}
          {(lessons || []).length === 0 && <p className="desc">학생이 첫 수업 텍스트를 붙여넣으면 여기 쌓여요.</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-tag">이번 달 출석 ({m})</div>
        <AttendanceControls enrollmentId={enr.id} attendances={(atts || []) as any} />
      </div>

      <div className="card">
        <div className="card-tag">수업 설정 — 요금 · 정기 일정</div>
        <EnrollmentSettings
          enrollmentId={enr.id}
          initial={{ rate: enr.rate, rate_type: enr.rate_type, slots: parseSlots(enr.slots), status: enr.status, memo: enr.memo }}
        />
      </div>
    </>
  );
}
