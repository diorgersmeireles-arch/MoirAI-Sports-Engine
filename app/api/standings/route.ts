import { NextResponse } from 'next/server';
import { standings2024, teams } from '@/data/seed';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const competitionId = searchParams.get('competitionId') ?? 'c1';
  const seasonId = searchParams.get('seasonId') ?? 's2024';

  const data = standings2024
    .filter(s => s.competitionId === competitionId && s.seasonId === seasonId)
    .sort((a, b) => a.position - b.position)
    .map(s => ({
      ...s,
      teamName: teams.find(t => t.id === s.teamId)?.name ?? s.teamId,
      teamShort: teams.find(t => t.id === s.teamId)?.shortName ?? s.teamId,
    }));

  return NextResponse.json(data);
}
