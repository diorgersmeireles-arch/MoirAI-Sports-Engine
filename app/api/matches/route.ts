import { NextResponse } from 'next/server';
import { getAllMatches, getMatchWithDetails } from '@/data/seed';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');

  if (id) {
    const match = getMatchWithDetails(id);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    return NextResponse.json(match);
  }

  let all = getAllMatches();
  if (status) {
    all = all.filter(m => m.status === status);
  }
  return NextResponse.json(all);
}
