'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Competition } from '@/types/database';

interface MatchCard {
  id: string; homeTeamName: string; awayTeamName: string;
  homeTeamShort: string; awayTeamShort: string;
  homeScore: number; awayScore: number; status: string;
  round?: string; scheduledAt: string; competition?: Competition;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(setMatches);
  }, []);

  const filtered = filter === 'all' ? matches : matches.filter(m => m.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partidas</h1>
        <div className="flex gap-2">
          {['all', 'scheduled', 'live', 'finished'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                filter === f
                  ? 'bg-sport-accent/20 border-sport-accent text-sport-accent'
                  : 'border-sport-border text-sport-dim hover:text-sport-text hover:border-sport-border'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'scheduled' ? 'Agendadas' : f === 'live' ? 'Ao Vivo' : 'Finalizadas'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(m => (
          <Link
            key={m.id}
            href={`/matches/${m.id}`}
            className="bg-sport-surface rounded-lg border border-sport-border p-4 hover:border-sport-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-sport-dim uppercase">{m.competition?.shortName}</span>
              <span className="text-[10px] text-sport-dim">
                {m.status === 'live'
                  ? <span className="text-sport-home font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sport-home animate-pulse" />AO VIVO</span>
                  : m.status === 'finished' ? 'Finalizado' : new Date(m.scheduledAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm truncate flex-1">{m.homeTeamName}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xl font-bold tabular-nums ${m.status === 'live' ? 'text-sport-home' : ''}`}>
                  {m.status === 'scheduled' ? '–' : `${m.homeScore}-${m.awayScore}`}
                </span>
              </div>
              <span className="font-semibold text-sm truncate flex-1 text-right">{m.awayTeamName}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
