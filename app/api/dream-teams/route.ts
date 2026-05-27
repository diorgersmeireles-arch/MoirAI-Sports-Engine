import { NextResponse } from 'next/server';
import {
  dreamTeamsData,
  dreamTeamPlayersData,
  legendsData,
} from '@/data/seed';
import type { DreamTeamPlayer } from '@/types/database';

function getPlayer(playerId: string) {
  return legendsData.find(p => p.id === playerId);
}

export async function GET() {
  const teams = dreamTeamsData.map(dt => ({
    ...dt,
    players: dreamTeamPlayersData
      .filter(dtp => dtp.dreamTeamId === dt.id)
      .map(dtp => ({
        ...dtp,
        player: getPlayer(dtp.playerId),
      })),
  }));
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, sportId, formation, playerIds } = body;

  if (!name || !sportId) {
    return NextResponse.json({ error: 'name and sportId are required' }, { status: 400 });
  }

  const newTeam = {
    id: `dt${Date.now()}`,
    tenantId: 'ten1',
    name,
    sportId,
    formation: formation ?? null,
    maxPlayers: 11,
    isPublic: false,
    totalRating: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newPlayers: DreamTeamPlayer[] = (playerIds ?? []).map((pid: string, i: number) => ({
    id: `dtp${Date.now()}_${i}`,
    dreamTeamId: newTeam.id,
    playerId: pid,
    slotPosition: null,
    shirtNumber: null,
    isCaptain: i === 0,
    isViceCaptain: i === 1,
    addedAt: new Date().toISOString(),
  }));

  return NextResponse.json({ team: newTeam, players: newPlayers }, { status: 201 });
}
