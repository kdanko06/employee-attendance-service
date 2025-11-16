import { NextResponse } from 'next/server.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'employee-attendance-service' });
}
