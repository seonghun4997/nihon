'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApproveButton({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function ok() {
    setBusy(true);
    await fetch('/api/a/approve', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: userId }),
    });
    router.refresh();
  }
  return <button className="chip" onClick={ok} disabled={busy}>{busy ? '…' : '승인 ✓'}</button>;
}
