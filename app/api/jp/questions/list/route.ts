import { NextResponse } from 'next/server';
// v2 API — v3에서 /api/s·/api/t·/api/cron 으로 이전됨
export async function GET() { return NextResponse.json({ moved: true }, { status: 410 }); }
export async function POST() { return NextResponse.json({ moved: true }, { status: 410 }); }
export async function PATCH() { return NextResponse.json({ moved: true }, { status: 410 }); }
