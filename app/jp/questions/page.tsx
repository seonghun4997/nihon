import { redirect } from 'next/navigation';
// v2 개인허브 경로 — v3에서 이전됨 (업로드 덮어쓰기용 스텁)
export default function Moved() { redirect('/'); }
