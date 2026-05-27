import { NextResponse } from 'next/server';
import { getAllMatches, matchStats } from '@/data/seed';

export async function GET() {
  const liveMatches = getAllMatches().filter(m => m.status === 'live' || m.status === 'finished');

  const scanned = liveMatches.slice(0, 5).map(m => {
    const stats = matchStats[m.id];
    return {
      matchId: m.id,
      matchLabel: `${m.homeTeamShort} vs ${m.awayTeamShort}`,
      competition: m.competition?.shortName ?? '',
      minute: 75,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeXg: stats?.homeXg ?? 0,
      awayXg: stats?.awayXg ?? 0,
      homeDangerousAttacks: stats?.homeShots ?? 0,
      awayDangerousAttacks: stats?.awayShots ?? 0,
      matchScore: Math.random(),
      confidence: 'medium' as const,
    };
  });

  return NextResponse.json({ scanned, totalMatchesAnalyzed: liveMatches.length, timestamp: Date.now() });
}
