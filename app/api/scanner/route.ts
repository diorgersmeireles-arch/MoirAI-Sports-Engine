import { NextResponse } from 'next/server';
import { getAllMatches, matchStats } from '@/data/seed';
import { liveScanner } from '@/services/scannerService';
import type { LiveAnalytics, LiveProbabilities, ExpectedGoals } from '@/types/sports';
import type { ScannerThreshold } from '@/types/sports';

function buildLiveAnalytics(matchId: string): LiveAnalytics | null {
  const match = getAllMatches().find(m => m.id === matchId);
  const stats = matchStats[matchId];
  if (!match || !stats) return null;

  const minute = match.status === 'finished' ? 90 : match.status === 'live' ? 75 : 0;
  const totalXg = stats.homeXg + stats.awayXg;

  const probs: LiveProbabilities = {
    homeWin: stats.homeXg / (totalXg || 1) * 0.7 + 0.15,
    draw: 0.2,
    awayWin: stats.awayXg / (totalXg || 1) * 0.7 + 0.15,
    calculatedAt: Date.now(),
  };

  const xg: ExpectedGoals = {
    home: stats.homeXg,
    away: stats.awayXg,
    perMinute: Array.from({ length: minute }, (_, i) => ({
      minute: i + 1,
      home: (stats.homeXg / minute) * (1 + Math.sin(i * 0.1) * 0.3),
      away: (stats.awayXg / minute) * (1 + Math.cos(i * 0.1) * 0.3),
    })),
  };

  return {
    matchId,
    minute,
    probabilities: probs,
    possession: { home: stats.homePossession, away: stats.awayPossession },
    dangerousAttacks: { home: stats.homeShots, away: stats.awayShots },
    shotsOnGoal: { home: stats.homeShotsOnTarget, away: stats.awayShotsOnTarget },
    cards: {
      yellow: { home: stats.homeYellowCards, away: stats.awayYellowCards },
      red: { home: stats.homeRedCards, away: stats.awayRedCards },
    },
    xG: xg,
    projectedTotalGoals: totalXg,
    dangerousAttacksLast10Min: {
      home: Math.round(stats.homeShots * 0.4),
      away: Math.round(stats.awayShots * 0.35),
    },
  };
}

export async function GET() {
  const liveMatches = getAllMatches().filter(m => m.status === 'live' || m.status === 'finished');

  const threshold: ScannerThreshold = {
    minMinute: 30,
    maxMinute: 95,
    maxGoalDifference: 3,
    minXG: 0.5,
    minDangerousAttacksLast10: 2,
    targetTeam: 'either',
  };

  const analyticsList: LiveAnalytics[] = [];
  for (const m of liveMatches) {
    const a = buildLiveAnalytics(m.id);
    if (a) analyticsList.push(a);
  }

  const result = liveScanner(analyticsList, threshold);

  return NextResponse.json({
    scanned: result.scanned.map(s => ({
      matchId: s.matchId,
      matchLabel: s.matchLabel,
      competition: liveMatches.find(m => m.id === s.matchId)?.competition?.shortName ?? '',
      minute: s.minute,
      homeScore: liveMatches.find(m => m.id === s.matchId)?.homeScore ?? 0,
      awayScore: liveMatches.find(m => m.id === s.matchId)?.awayScore ?? 0,
      homeXg: s.analytics.xG.home,
      awayXg: s.analytics.xG.away,
      homeDangerousAttacks: s.analytics.dangerousAttacks.home,
      awayDangerousAttacks: s.analytics.dangerousAttacks.away,
      matchScore: s.matchScore,
      confidence: s.matchScore > 0.6 ? 'high' as const : s.matchScore > 0.3 ? 'medium' as const : 'low' as const,
    })),
    totalMatchesAnalyzed: result.totalMatchesAnalyzed,
    timestamp: result.timestamp,
  });
}
