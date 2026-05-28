import { NextResponse } from 'next/server';
import { allMatches, competitions, teams, matchStats, playerStats } from '@/data/seed';
import { getMatches, getMatchById, getLiveMatches } from '@/lib/queries/matches';
import type { Match } from '@/types/database';
import { checkConnection } from '@/lib/db';

function enrichMatch(m: Match) {
  const home = teams.find(t => t.id === m.homeTeamId);
  const away = teams.find(t => t.id === m.awayTeamId);
  const comp = competitions.find(c => c.id === m.competitionId);
  return {
    ...m,
    homeTeamName: home?.name ?? m.homeTeamId,
    awayTeamName: away?.name ?? m.awayTeamId,
    homeTeamShort: home?.shortName,
    awayTeamShort: away?.shortName,
    competition: comp,
    stats: matchStats[m.id] ?? null,
    playerStats: playerStats[m.id] ?? [],
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const sport = searchParams.get('sport');

  const dbOnline = await checkConnection().catch(() => false);

  if (id) {
    if (dbOnline) {
      const match = await getMatchById(id);
      if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      return NextResponse.json(match);
    }
    const match = allMatches.find(m => m.id === id);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    return NextResponse.json(enrichMatch(match));
  }

  if (dbOnline) {
    const matches = status === 'live' ? await getLiveMatches() : await getMatches({ sport: sport ?? undefined, status: status ?? undefined });
    return NextResponse.json(matches);
  }

  let result = [...allMatches];
  if (status) result = result.filter(m => m.status === status);
  if (sport) result = result.filter(m => m.sportId === sport);
  result.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return NextResponse.json(result.slice(0, 50).map(enrichMatch));
}
