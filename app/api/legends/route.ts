import { NextResponse } from 'next/server';
import { legendsData, playerCardsData } from '@/data/seed';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');

  let result = [...legendsData];
  if (sport) result = result.filter(l => l.sportId === sport);

  return NextResponse.json(result.map(l => ({
    ...l,
    overall: Math.round((l.legendRating ?? 80) * 0.95),
    cards: playerCardsData.filter(c => c.playerId === l.id),
  })));
}
