'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PlayerCard {
  id: string; fullName: string; sportId: string; position: string;
  shirtNumber?: number; teamId?: string;
  attributes: { overall: number; pace: number; shooting: number; passing: number; defending: number; physical: number } | null;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (search) params.set('q', search);
    fetch(`/api/players?${params.toString()}`).then(r => r.json()).then(setPlayers);
  }, [sport, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Atletas</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar atleta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-sport-surface border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text placeholder:text-sport-dim/50 w-48 outline-none focus:border-sport-accent"
          />
          <select
            value={sport}
            onChange={e => setSport(e.target.value)}
            className="bg-sport-surface border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text outline-none focus:border-sport-accent"
          >
            <option value="">Todos</option>
            <option value="football">⚽ Futebol</option>
            <option value="volleyball">🏐 Vôlei</option>
            <option value="basketball">🏀 Basquete</option>
            <option value="baseball">⚾ Beisebol</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {players.map(p => (
          <Link
            key={p.id}
            href={`/players/${p.id}`}
            className="bg-sport-surface rounded-lg border border-sport-border p-4 hover:border-sport-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-sport-dim uppercase">{p.sportId === 'football' ? '⚽' : p.sportId === 'basketball' ? '🏀' : p.sportId === 'volleyball' ? '🏐' : '⚾'}</span>
              {p.shirtNumber && <span className="text-[10px] text-sport-dim">#{p.shirtNumber}</span>}
            </div>
            <div className="text-sm font-bold truncate">{p.fullName}</div>
            <div className="text-xs text-sport-dim">{p.position}</div>
            {p.attributes && (
              <div className="mt-3 pt-3 border-t border-sport-border/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-sport-dim">Overall</span>
                  <span className="text-sm font-bold text-sport-accent">{p.attributes.overall}</span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {(['pace', 'shooting', 'passing', 'defending', 'physical'] as const).map(attr => (
                    <div key={attr} className="text-center">
                      <div className="text-[10px] text-sport-dim">{attr === 'pace' ? 'RIT' : attr === 'shooting' ? 'FIN' : attr === 'passing' ? 'PAS' : attr === 'defending' ? 'DEF' : 'FIS'}</div>
                      <div className="text-xs font-bold">{p.attributes![attr]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
