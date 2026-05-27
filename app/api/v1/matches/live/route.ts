import { NextResponse } from 'next/server';
import { matches } from '@/data/seed';

// v0.3.5 — Rota de partidas ao vivo (source: Redis SMEMBERS em produção)
// Cache TTL sugerido: 5s (pode ser cacheado via Next.js fetchCache = 'force-cache')
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = request.headers.get('x-tenant-id') ?? searchParams.get('tenant_id');
  const sportId = searchParams.get('sport_id');

  // Filtra partidas com status 'live' (em produção: Redis SMEMBERS live:match:*)
  let liveMatches = matches.filter(m => m.status === 'live');

  // Aplica isolamento de tenant (em produção: resolvido via RLS/Redis key prefix)
  if (tenantId) {
    // Nota: em produção o tenant_id é validado via JWT e aplicado no Redis key namespace
  }

  // Filtro opcional por esporte
  if (sportId) {
    liveMatches = liveMatches.filter(m => m.sportId === sportId);
  }

  // Mapeia para o formato de resposta com campos enriquecidos
  const payload = liveMatches.map(m => ({
    id: m.id,
    sport_id: m.sportId,
    home_team_id: m.homeTeamId,
    away_team_id: m.awayTeamId,
    home_score: m.homeScore,
    away_score: m.awayScore,
    status: m.status,
    started_at: m.startedAt,
    round: m.round,
    // Em produção: busca do Redis em live:match:{id}
    live_meta: null as Record<string, unknown> | null,
  }));

  return NextResponse.json({
    data: payload,
    meta: {
      total: payload.length,
      source: 'seed',
      cached_at: new Date().toISOString(),
    },
  });
}
