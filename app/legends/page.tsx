'use client';

import { useEffect, useState } from 'react';

interface LegendCard {
  id: string; fullName: string; shortName?: string; sportId: string;
  nationality?: string; heightCm?: number; weightKg?: number;
  isLegend: boolean; legendRating?: number; overall?: number;
  imageUrl?: string; retired: boolean;
  metadata?: Record<string, unknown>;
}

const sportIcons: Record<string, string> = {
  football: '⚽', volleyball: '🏐', basketball: '🏀', baseball: '⚾',
};

const sportNames: Record<string, string> = {
  football: 'Futebol', volleyball: 'Vôlei', basketball: 'Basquete', baseball: 'Beisebol',
};

const sportColors: Record<string, string> = {
  football: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  volleyball: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  basketball: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  baseball: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export default function LegendsPage() {
  const [legends, setLegends] = useState<LegendCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sport, setSport] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    fetch(`/api/legends?${params.toString()}`)
      .then(r => { if (!r.ok) throw new Error('Erro ao carregar'); return r.json(); })
      .then(setLegends)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sport]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏆 Lendas do Esporte</h1>
          <p className="text-sm text-sport-dim mt-1">Os maiores atletas de todos os tempos</p>
        </div>
        <select
          value={sport}
          onChange={e => setSport(e.target.value)}
          className="bg-sport-surface border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text outline-none focus:border-sport-accent"
        >
          <option value="">Todos os esportes</option>
          <option value="football">⚽ Futebol</option>
          <option value="volleyball">🏐 Vôlei</option>
          <option value="basketball">🏀 Basquete</option>
          <option value="baseball">⚾ Beisebol</option>
        </select>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-sport-surface rounded-xl border border-sport-border p-5 h-48" />
          ))}
        </div>
      ) : legends.length === 0 ? (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-8 text-center text-sport-dim">
          Nenhuma lenda encontrada
        </div>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {legends.map(l => (
          <div
            key={l.id}
            className="bg-sport-surface rounded-xl border border-sport-border p-5 hover:border-sport-accent/40 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${sportColors[l.sportId] || 'bg-sport-border/50 text-sport-dim'}`}>
                {sportIcons[l.sportId] ?? ''} {sportNames[l.sportId] ?? l.sportId}
              </span>
              {l.legendRating && (
                <span className="text-lg font-black text-sport-gold">{l.legendRating}</span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sport-gold/30 to-sport-accent/30 flex items-center justify-center text-xl font-bold text-sport-gold shrink-0 border border-sport-gold/30">
                {l.shortName?.[0] ?? l.fullName[0]}
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{l.fullName}</div>
                {l.nationality && (
                  <div className="text-xs text-sport-dim">{l.nationality}</div>
                )}
              </div>
            </div>

            {l.overall && (
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-sport-dim">Overall</span>
                <div className="flex-1 h-1.5 bg-sport-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sport-accent to-sport-gold rounded-full"
                    style={{ width: `${Math.min(l.overall, 99)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-sport-accent">{l.overall}</span>
              </div>
            )}

            <div className="flex gap-2 text-[11px] text-sport-dim">
              {l.heightCm && <span>{l.heightCm}cm</span>}
              {l.weightKg && <span>{l.weightKg}kg</span>}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
