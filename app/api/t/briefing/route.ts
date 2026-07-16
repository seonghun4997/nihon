import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ moved: true }, { status: 410 }); }
export async function POST() { return NextResponse.json({ moved: true }, { status: 410 }); }
export async function PATCH() { return NextResponse.json({ moved: true }, { status: 410 }); }
export async function DELETE() { return NextResponse.json({ moved: true }, { status: 410 }); }
