'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Competition {
  id: string; name: string; shortName: string; sportId: string; country?: string; logoUrl?: string;
  seasons?: { id: string; name: string }[];
}

interface StandingEntry {
  position: number; teamId: string; teamName: string; teamShort: string;
  points: number; played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number;
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState('c1');
  const [selectedSeason, setSelectedSeason] = useState('s2024');
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/competitions')
      .then(r => { if (!r.ok) throw new Error('Erro ao carregar'); return r.json(); })
      .then(setCompetitions)
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/api/competitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'standings', competitionId: selectedComp, seasonId: selectedSeason }),
    }).then(r => {
      if (!r.ok) return [];
      return r.json();
    }).then(d => { setStandings(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [selectedComp, selectedSeason]);

  const currentComp = competitions.find(c => c.id === selectedComp);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Competições</h1>
        <div className="flex gap-2">
          <select
            value={selectedComp}
            onChange={e => setSelectedComp(e.target.value)}
            className="bg-sport-surface border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text"
          >
            {competitions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="bg-sport-surface border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text"
          >
            {currentComp?.seasons?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            )) ?? <option value="s2024">2024</option>}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="bg-sport-surface rounded-lg border border-sport-border overflow-hidden animate-pulse p-8">
          <div className="h-64 bg-sport-bg/50 rounded" />
        </div>
      ) : (
      <div className="bg-sport-surface rounded-lg border border-sport-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sport-border text-sport-dim">
              <th className="p-3 text-left w-10">#</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-center">P</th>
              <th className="p-3 text-center">J</th>
              <th className="p-3 text-center">V</th>
              <th className="p-3 text-center">E</th>
              <th className="p-3 text-center">D</th>
              <th className="p-3 text-center">GP</th>
              <th className="p-3 text-center">GC</th>
              <th className="p-3 text-center">SG</th>
            </tr>
          </thead>
          <tbody>
            {standings.map(s => (
              <tr
                key={s.teamId}
                className={`border-b border-sport-border/40 hover:bg-sport-bg/30 ${
                  s.position <= 4 ? 'border-l-2 border-l-sport-accent' :
                  s.position <= 6 ? 'border-l-2 border-l-sport-home' :
                  s.position >= 17 ? 'border-l-2 border-l-red-500/50' : ''
                }`}
              >
                <td className={`p-3 text-center font-bold ${
                  s.position <= 4 ? 'text-sport-accent' :
                  s.position <= 6 ? 'text-sport-home' :
                  s.position >= 17 ? 'text-red-400' : ''
                }`}>{s.position}º</td>
                <td className="p-3 font-medium">
                  <Link href={`/players?team=${s.teamId}`} className="hover:text-sport-accent transition-colors">
                    {s.teamName}
                  </Link>
                  <span className="text-sport-dim text-xs ml-2">{s.teamShort}</span>
                </td>
                <td className="p-3 text-center font-bold text-sport-accent">{s.points}</td>
                <td className="p-3 text-center text-sport-dim">{s.played}</td>
                <td className="p-3 text-center text-sport-home">{s.wins}</td>
                <td className="p-3 text-center text-yellow-400">{s.draws}</td>
                <td className="p-3 text-center text-sport-away">{s.losses}</td>
                <td className="p-3 text-center">{s.goalsFor}</td>
                <td className="p-3 text-center">{s.goalsAgainst}</td>
                <td className={`p-3 text-center font-bold ${s.goalDifference > 0 ? 'text-sport-home' : s.goalDifference < 0 ? 'text-sport-away' : ''}`}>
                  {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
