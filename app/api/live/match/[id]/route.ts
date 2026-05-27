import { NextResponse } from 'next/server';
import { getMatchWithDetails, snapshotsData } from '@/data/seed';

// v0.3.5 — Gateway de estado ao vivo da partida
// Em produção: Redis Pub/Sub + WebSocket (conexão async via Socket.IO ou SSE)
// Fallback REST: retorna o snapshot mais recente + metadados da partida
// Distribuição: Redis channel "tenant:{tenant_id}:match:{match_id}:events"
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const tenantId = request.headers.get('x-tenant-id');

  // Busca detalhes da partida
  const match = getMatchWithDetails(id);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // Busca snapshots mais recentes (em produção: Redis LRANGE live:snapshots:{id})
  const matchSnapshots = snapshotsData
    .filter(s => s.matchId === id)
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());

  return NextResponse.json({
    data: {
      match: {
        id: match.id,
        sport_id: match.sportId,
        home_team: { id: match.homeTeamId, name: match.homeTeamName, short: match.homeTeamShort },
        away_team: { id: match.awayTeamId, name: match.awayTeamName, short: match.awayTeamShort },
        home_score: match.homeScore,
        away_score: match.awayScore,
        status: match.status,
        minute: matchSnapshots[0]?.minute ?? 0,
        period: matchSnapshots[0]?.period ?? null,
      },
      latest_snapshot: matchSnapshots[0] ?? null,
      snapshot_history: matchSnapshots.slice(0, 10), // Últimos 10 snapshots
      stats: match.stats,
    },
    meta: {
      source: 'seed',
      tenant_id: tenantId ?? null,
      cached_at: new Date().toISOString(),
      // Em produção: connection_handshake valida tenant_id via JWT
      ws_gateway: `/live/match/${id}`,
      ws_protocol: 'Redis Pub/Sub → WebSocket',
    },
  });
}
