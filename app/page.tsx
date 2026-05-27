'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Competition, Standing } from '@/types/database';

interface MatchCard {
  id: string; homeTeamName: string; awayTeamName: string;
  homeTeamShort: string; awayTeamShort: string;
  homeScore: number; awayScore: number; status: string;
  round?: string; competition?: Competition;
}

export default function Dashboard() {
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [scannerCount, setScannerCount] = useState(0);

  useEffect(() => {
    fetch('/api/matches').then(r => r.json()).then(setMatches);
    fetch('/api/standings?competitionId=c1&seasonId=s2024').then(r => r.json()).then(setStandings);
    fetch('/api/scanner').then(r => r.json()).then(d => setScannerCount(d.totalMatchesAnalyzed));
  }, []);

  const liveMatches = matches.filter(m => m.status === 'live');
  const recentMatches = matches.filter(m => m.status === 'finished').slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sport-text">Dashboard</h1>
        <span className="text-xs text-sport-dim">2025 Season</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Partidas" value={matches.length} />
        <StatCard label="Ao Vivo" value={liveMatches.length} color="text-sport-home" />
        <StatCard label="Scanner" value={scannerCount} color="text-sport-accent" />
        <StatCard label="Standings" value={standings.length} color="text-sport-gold" />
      </div>

      {liveMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sport-home animate-pulse" />
            Ao Vivo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Últimos Resultados</h2>
            <Link href="/matches" className="text-xs text-sport-accent hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {recentMatches.map(m => <MatchCard key={m.id} match={m} compact />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Brasileirão 2024</h2>
            <Link href="/competitions" className="text-xs text-sport-accent hover:underline">Ver tudo</Link>
          </div>
          <div className="bg-sport-surface rounded-lg border border-sport-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sport-border text-sport-dim">
                  <th className="p-2 text-left w-8">#</th>
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-center">P</th>
                  <th className="p-2 text-center">V</th>
                  <th className="p-2 text-center">E</th>
                  <th className="p-2 text-center">D</th>
                  <th className="p-2 text-center">SG</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 5).map(s => (
                  <tr key={s.id} className="border-b border-sport-border/50 hover:bg-sport-bg/50">
                    <td className={`p-2 text-center font-bold ${s.position <= 4 ? 'text-sport-accent' : s.position <= 6 ? 'text-sport-home' : ''}`}>
                      {s.position}º
                    </td>
                    <td className="p-2">{s.teamId}</td>
                    <td className="p-2 text-center font-bold">{s.points}</td>
                    <td className="p-2 text-center text-sport-home">{s.wins}</td>
                    <td className="p-2 text-center text-sport-draw">{s.draws}</td>
                    <td className="p-2 text-center text-sport-away">{s.losses}</td>
                    <td className="p-2 text-center">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Scanner Rápido</h2>
          <Link href="/scanner" className="text-xs text-sport-accent hover:underline">Abrir Scanner</Link>
        </div>
        <div className="bg-sport-surface rounded-lg border border-sport-border p-4 text-center text-sport-dim text-sm">
          {scannerCount > 0
            ? `${scannerCount} partidas analisadas pelo scanner ao vivo`
            : 'Scanner aguardando dados...'}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
      <div className="text-xs text-sport-dim mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color ?? 'text-sport-text'}`}>{value}</div>
    </div>
  );
}

function MatchCard({ match, compact }: { match: MatchCard; compact?: boolean }) {
  const isLive = match.status === 'live';
  return (
    <Link
      href={`/matches/${match.id}`}
      className={`block bg-sport-surface rounded-lg border border-sport-border hover:border-sport-accent/50 transition-colors ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-center justify-between mb-2">
        {match.competition && (
          <span className="text-[10px] text-sport-dim uppercase tracking-wider">{match.competition.shortName}</span>
        )}
        {match.round && <span className="text-[10px] text-sport-dim">Rodada {match.round}</span>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className={`font-semibold text-sm truncate ${compact ? 'max-w-24' : 'max-w-32'}`}>{match.homeTeamShort}</span>
        <div className="flex items-center gap-3 shrink-0">
          {isLive && <span className="w-2 h-2 rounded-full bg-sport-home animate-pulse" />}
          <span className={`font-bold text-lg tabular-nums ${isLive ? 'text-sport-home' : ''}`}>
            {match.status === 'scheduled' ? '—' : `${match.homeScore}-${match.awayScore}`}
          </span>
          {isLive && <span className="text-[10px] text-sport-home font-bold">LIVE</span>}
        </div>
        <span className={`font-semibold text-sm truncate text-right ${compact ? 'max-w-24' : 'max-w-32'}`}>{match.awayTeamShort}</span>
      </div>
    </Link>
  );
}
