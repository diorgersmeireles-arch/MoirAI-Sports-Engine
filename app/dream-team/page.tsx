'use client';

import { useEffect, useState, useCallback } from 'react';

interface LegendOption {
  id: string; fullName: string; shortName?: string; sportId: string;
  legendRating?: number; imageUrl?: string; nationality?: string;
}

interface DreamTeamResponse {
  id: string; name: string; sportId: string; formation?: string;
  totalRating?: number; players: { id: string; playerId: string; slotPosition?: string; isCaptain: boolean; isViceCaptain: boolean; player?: LegendOption }[];
}

const formacaoSlots = [
  { pos: 'GK', label: 'Goleiro', x: 50, y: 5 },
  { pos: 'LB', label: 'Lateral E', x: 15, y: 25 },
  { pos: 'CB', label: 'Zagueiro', x: 50, y: 20 },
  { pos: 'RB', label: 'Lateral D', x: 85, y: 25 },
  { pos: 'CM', label: 'Meia', x: 50, y: 45 },
  { pos: 'LW', label: 'Ponta E', x: 20, y: 65 },
  { pos: 'RW', label: 'Ponta D', x: 80, y: 65 },
  { pos: 'ST', label: 'Atacante', x: 50, y: 80 },
  { pos: 'CAM', label: 'Meia Ofensivo', x: 50, y: 58 },
  { pos: 'CDM', label: 'Volante', x: 50, y: 33 },
  { pos: 'CF', label: 'Centroavante', x: 50, y: 72 },
];

export default function DreamTeamPage() {
  const [legends, setLegends] = useState<LegendOption[]>([]);
  const [selectedSport, setSelectedSport] = useState('football');
  const [teamName, setTeamName] = useState('');
  const [lineup, setLineup] = useState<Record<string, string>>({});
  const [savedTeams, setSavedTeams] = useState<DreamTeamResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'builder' | 'saved'>('builder');

  useEffect(() => {
    Promise.all([
      fetch(`/api/legends?sport=${selectedSport}`).then(r => r.json()),
      fetch('/api/dream-teams').then(r => r.json()),
    ])
      .then(([legendsData, teamsData]) => {
        setLegends(legendsData);
        setSavedTeams(teamsData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedSport]);

  const handleSlotSelect = useCallback((pos: string, playerId: string) => {
    setLineup(prev => {
      const next = { ...prev };
      if (next[pos] === playerId) {
        delete next[pos];
      } else {
        Object.keys(next).forEach(k => { if (next[k] === playerId) delete next[k]; });
        next[pos] = playerId;
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!teamName.trim()) { setError('Dê um nome ao seu Dream Team'); return; }
    const playerIds = Object.values(lineup);
    if (playerIds.length < 3) { setError('Selecione pelo menos 3 lendas'); return; }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/dream-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName, sportId: selectedSport, playerIds }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      const data = await res.json();
      setSavedTeams(prev => [...prev, { ...data.team, players: [] }]);
      setSuccess(`Dream Team "${teamName}" criado com sucesso!`);
      setTeamName('');
      setLineup({});
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }, [teamName, selectedSport, lineup]);

  const getPlayerName = useCallback((playerId: string) => {
    return legends.find(l => l.id === playerId)?.shortName ?? legends.find(l => l.id === playerId)?.fullName ?? playerId;
  }, [legends]);

  const getPlayerRating = useCallback((playerId: string) => {
    return legends.find(l => l.id === playerId)?.legendRating;
  }, [legends]);

  const averageRating = Object.values(lineup).length > 0
    ? Math.round(Object.values(lineup).reduce((sum, pid) => sum + (getPlayerRating(pid) ?? 0), 0) / Object.values(lineup).length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🏆 Dream Team</h1>
          <p className="text-sm text-sport-dim mt-1">Monte o time dos sonhos com as maiores lendas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('builder')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === 'builder' ? 'bg-sport-accent/20 text-sport-accent' : 'text-sport-dim hover:text-sport-text'}`}
          >
            Montar Time
          </button>
          <button
            onClick={() => setTab('saved')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === 'saved' ? 'bg-sport-accent/20 text-sport-accent' : 'text-sport-dim hover:text-sport-text'}`}
          >
            Meus Times
          </button>
        </div>
      </div>

      {tab === 'builder' ? (
        <>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Nome do Dream Team..."
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="bg-sport-surface border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text placeholder:text-sport-dim/50 w-56 outline-none focus:border-sport-accent"
            />
            <select
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              className="bg-sport-surface border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text outline-none focus:border-sport-accent"
            >
              <option value="football">⚽ Futebol</option>
              <option value="volleyball">🏐 Vôlei</option>
              <option value="basketball">🏀 Basquete</option>
              <option value="baseball">⚾ Beisebol</option>
            </select>
            {Object.values(lineup).length > 0 && (
              <span className="text-xs text-sport-dim">
                {Object.values(lineup).length} lendas · Média{' '}
                <span className="text-sport-gold font-bold">{averageRating}</span>
              </span>
            )}
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-400">{success}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campo tático */}
            <div className="bg-sport-surface rounded-xl border border-sport-border p-4">
              <h2 className="text-sm font-semibold mb-3">Campo</h2>
              <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-900/60 to-green-800/40 rounded-lg border border-green-700/30 overflow-hidden">
                {formacaoSlots.map(slot => {
                  const playerId = lineup[slot.pos];
                  const filled = !!playerId;
                  const rating = playerId ? getPlayerRating(playerId) : undefined;
                  return (
                    <div
                      key={slot.pos}
                      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 cursor-pointer transition-all ${
                          filled
                            ? 'bg-sport-accent/30 border-sport-accent text-sport-accent shadow-lg shadow-sport-accent/20'
                            : 'bg-sport-bg/50 border-sport-border/50 text-sport-dim hover:border-sport-accent/50'
                        }`}
                        title={slot.label}
                      >
                        {filled ? getPlayerName(playerId).substring(0, 3).toUpperCase() : slot.pos}
                      </div>
                      {filled && rating && (
                        <span className="text-[10px] text-sport-gold font-bold mt-0.5">{rating}</span>
                      )}
                      <span className="text-[10px] text-sport-dim mt-0.5">{slot.label}</span>
                      {filled && (
                        <button
                          onClick={() => handleSlotSelect(slot.pos, playerId)}
                          className="text-[10px] text-red-400/70 hover:text-red-400 mt-0.5"
                        >
                          remover
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista de lendas */}
            <div>
              <h2 className="text-sm font-semibold mb-3">Lendas Disponíveis</h2>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-sport-surface rounded-lg border border-sport-border p-3 h-14" />
                  ))}
                </div>
              ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {legends.map(l => {
                  const selected = Object.values(lineup).includes(l.id);
                  return (
                    <button
                      key={l.id}
                      onClick={() => {
                        const emptySlot = formacaoSlots.find(s => !lineup[s.pos]);
                        if (emptySlot) handleSlotSelect(emptySlot.pos, l.id);
                      }}
                      disabled={selected}
                      className={`w-full flex items-center gap-3 bg-sport-surface rounded-lg border p-3 text-left transition-all ${
                        selected
                          ? 'border-sport-accent bg-sport-accent/10'
                          : 'border-sport-border hover:border-sport-accent/50'
                      } disabled:opacity-60`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sport-gold/30 to-sport-accent/30 flex items-center justify-center text-sm font-bold text-sport-gold shrink-0">
                        {l.shortName?.[0] ?? l.fullName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{l.fullName}</div>
                        <div className="text-xs text-sport-dim">{l.nationality ?? ''}</div>
                      </div>
                      {l.legendRating && (
                        <span className="text-base font-black text-sport-gold">{l.legendRating}</span>
                      )}
                      {selected && <span className="text-xs text-sport-accent">✓</span>}
                    </button>
                  );
                })}
              </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || Object.values(lineup).length < 3}
              className="px-5 py-2 bg-sport-accent text-sport-bg font-bold rounded-lg text-sm hover:bg-sport-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Salvando...' : `Salvar Dream Team (${Object.values(lineup).length} lendas)`}
            </button>
          </div>
        </>
      ) : (
        // Aba "Meus Times"
        <div className="space-y-4">
          {savedTeams.length === 0 ? (
            <div className="bg-sport-surface rounded-lg border border-sport-border p-8 text-center text-sport-dim">
              Nenhum Dream Team salvo ainda
            </div>
          ) : (
            savedTeams.map(dt => (
              <div key={dt.id} className="bg-sport-surface rounded-xl border border-sport-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{dt.name}</h3>
                    <span className="text-xs text-sport-dim">
                      {dt.sportId === 'football' ? '⚽' : dt.sportId === 'basketball' ? '🏀' : dt.sportId === 'volleyball' ? '🏐' : '⚾'}
                      {' '}{dt.totalRating ? `Rating: ${dt.totalRating}` : `${dt.players?.length ?? 0} lendas`}
                    </span>
                  </div>
                  {dt.totalRating && (
                    <span className="text-lg font-black text-sport-gold">{dt.totalRating}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dt.players?.map(dp => (
                    <div
                      key={dp.id}
                      className="flex items-center gap-2 bg-sport-bg/50 rounded-full px-3 py-1 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-sport-gold/30 to-sport-accent/30 flex items-center justify-center text-[10px] font-bold text-sport-gold">
                        {dp.player?.shortName?.[0] ?? dp.playerId[0]}
                      </span>
                      {dp.player?.shortName ?? dp.playerId}
                      {dp.isCaptain && <span className="text-sport-gold">(C)</span>}
                      {dp.slotPosition && <span className="text-sport-dim">{dp.slotPosition}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
