import { NextResponse } from 'next/server';
import { players, playerAttributesData, playerCardsData } from '@/data/seed';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const player = players.find(p => p.id === id);
    if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    const attrs = playerAttributesData.filter(a => a.playerId === id);
    const cards = playerCardsData.filter(c => c.playerId === id);
    const latestAttrs = attrs.length > 0
      ? attrs.reduce((a, b) => new Date(a.measuredAt) > new Date(b.measuredAt) ? a : b)
      : null;

    return NextResponse.json({
      ...player,
      attributes: latestAttrs,
      attributeHistory: attrs,
      cards,
    });
  }

  const sport = searchParams.get('sport');
  let result = [...players];
  if (sport) result = result.filter(p => p.sportId === sport);

  const query = searchParams.get('q')?.toLowerCase();
  if (query) result = result.filter(p => p.fullName.toLowerCase().includes(query));

  return NextResponse.json(result.map(p => ({
    ...p,
    attributes: playerAttributesData.filter(a => a.playerId === p.id && a.isActive)[0] ?? null,
  })));
}
