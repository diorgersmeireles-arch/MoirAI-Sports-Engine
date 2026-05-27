import { NextResponse } from 'next/server';
import {
  allPlayers,
  allTeams,
  allMatches,
  playerAttributesData,
  playerCardsData,
  playerStats,
} from '@/data/seed';

function getPlayerTeam(playerId: string): string | undefined {
  for (const m of allMatches) {
    const fStats = playerStats[m.id];
    if (!fStats) continue;
    const ps = fStats.find(p => p.playerId === playerId);
    if (ps) return ps.teamId;
  }
  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const player = allPlayers.find(p => p.id === id);
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    const attrs = playerAttributesData.filter(a => a.playerId === id);
    const cards = playerCardsData.filter(c => c.playerId === id);
    const latestAttrs = attrs.length > 0
      ? attrs.reduce((a, b) => new Date(a.measuredAt) > new Date(b.measuredAt) ? a : b)
      : null;

    const teamId = getPlayerTeam(id);
    const teamName = teamId ? allTeams.find(t => t.id === teamId)?.name : undefined;

    return NextResponse.json({
      ...player,
      teamId,
      teamName,
      attributes: latestAttrs,
      attributeHistory: attrs,
      cards,
    });
  }

  const sport = searchParams.get('sport');
  let result = [...allPlayers];
  if (sport) result = result.filter(p => p.sportId === sport);

  const query = searchParams.get('q')?.toLowerCase();
  if (query) result = result.filter(p => p.fullName.toLowerCase().includes(query));

  return NextResponse.json(result.map(p => ({
    ...p,
    attributes: playerAttributesData.filter(a => a.playerId === p.id && a.isActive)[0] ?? null,
  })));
}
