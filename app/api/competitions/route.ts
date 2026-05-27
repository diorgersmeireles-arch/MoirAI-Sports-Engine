import { NextResponse } from 'next/server';
import { competitions, seasons } from '@/data/seed';
import { standings2024 } from '@/data/seed';
import { teams } from '@/data/seed';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const comp = competitions.find(c => c.id === id);
    if (!comp) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const compSeasons = seasons.filter(s => s.competitionId === id);
    return NextResponse.json({ ...comp, seasons: compSeasons });
  }

  return NextResponse.json(competitions);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.type === 'standings') {
    return NextResponse.json(
      standings2024
        .filter(s => s.competitionId === body.competitionId && s.seasonId === body.seasonId)
        .sort((a, b) => a.position - b.position)
        .map(s => ({
          ...s,
          teamName: teams.find(t => t.id === s.teamId)?.name ?? s.teamId,
          teamShort: teams.find(t => t.id === s.teamId)?.shortName ?? s.teamId,
        }))
    );
  }
  return NextResponse.json([]);
}
