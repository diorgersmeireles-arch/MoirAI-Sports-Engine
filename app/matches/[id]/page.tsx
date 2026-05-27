'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LiveMatchTracker from '@/components/LiveMatchTracker';
import type { FootballMatchStats, FootballPlayerStats, Competition } from '@/types/database';

interface MatchDetail {
  id: string; homeTeamId: string; awayTeamId: string;
  homeTeamName: string; awayTeamName: string;
  homeTeamShort: string; awayTeamShort: string;
  homeScore: number; awayScore: number; status: string;
  round?: string; scheduledAt: string; attendance?: number; referee?: string;
  competition?: Competition;
  stats: FootballMatchStats | null;
  playerStats: FootballPlayerStats[];
}

export default function MatchDetailPage() {
  const { id } = useParams();
  const [match, setMatch] = useState<MatchDetail | null>(null);

  useEffect(() => {
    fetch(`/api/matches?id=${id}`).then(r => r.json()).then(setMatch);
  }, [id]);

  if (!match) return <LoadingSkeleton />;

  const odds = {
    matchId: match.id,
    moneyline: { home: 2.1, draw: 3.2, away: 3.8 },
    overUnder: {
      1.5: { over: 1.25, under: 3.5 },
      2.5: { over: 1.9, under: 1.9 },
      3.5: { over: 3.2, under: 1.35 },
      4.5: { over: 5.5, under: 1.15 },
    },
    capturedAt: new Date(),
    bookmaker: 'MoirAI',
  };
  const stats = match.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-sport-dim">
        <Link href="/matches" className="hover:text-sport-accent">Partidas</Link>
        <span>/</span>
        <span className="text-sport-text">{match.homeTeamShort} vs {match.awayTeamShort}</span>
      </div>

      <div className="bg-sport-surface rounded-lg border border-sport-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-sport-dim uppercase">{match.competition?.name}</span>
            {match.round && <span className="text-xs text-sport-dim ml-3">Rodada {match.round}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-sport-dim">
            {match.attendance && <span>👥 {match.attendance.toLocaleString()}</span>}
            {match.referee && <span>⚖️ {match.referee}</span>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-8 py-6">
          <div className="text-right">
            <div className="text-lg font-bold">{match.homeTeamName}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-5xl font-bold tabular-nums ${match.status === 'live' ? 'text-sport-home' : ''}`}>
              {match.homeScore}
            </span>
            <span className="text-2xl text-sport-dim">×</span>
            <span className={`text-5xl font-bold tabular-nums ${match.status === 'live' ? 'text-sport-away' : ''}`}>
              {match.awayScore}
            </span>
          </div>
          <div className="text-left">
            <div className="text-lg font-bold">{match.awayTeamName}</div>
          </div>
        </div>

        <div className="text-center">
          {match.status === 'live' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sport-home/20 text-sport-home text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-sport-home animate-pulse" />AO VIVO
            </span>
          ) : match.status === 'finished' ? (
            <span className="text-xs text-sport-dim">Finalizado</span>
          ) : (
            <span className="text-xs text-sport-dim">{new Date(match.scheduledAt).toLocaleString('pt-BR')}</span>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatItem label="Posse" home={`${stats.homePossession}%`} away={`${stats.awayPossession}%`} />
          <StatItem label="Chutes" home={stats.homeShots} away={stats.awayShots} />
          <StatItem label="No Alvo" home={stats.homeShotsOnTarget} away={stats.awayShotsOnTarget} />
          <StatItem label="Escanteios" home={stats.homeCorners} away={stats.awayCorners} />
          <StatItem label="Faltas" home={stats.homeFouls} away={stats.awayFouls} />
          <StatItem label="Cartões Amarelos" home={stats.homeYellowCards} away={stats.awayYellowCards} />
          <StatItem label="Cartões Vermelhos" home={stats.homeRedCards} away={stats.awayRedCards} />
          <StatItem label="Impedimentos" home={stats.homeOffsides} away={stats.awayOffsides} />
          <StatItem label="Laterais" home={stats.homeThrowIns} away={stats.awayThrowIns} />
          <StatItem label="xG" home={stats.homeXg.toFixed(2)} away={stats.awayXg.toFixed(2)} />
          <StatItem label="Passes" home={stats.homePasses} away={stats.awayPasses} />
          <StatItem label="Precisão Passes" home={`${stats.homePassAccuracy}%`} away={`${stats.awayPassAccuracy}%`} />
        </div>
      )}

      {match.status === 'live' && (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
          <h3 className="text-sm font-semibold mb-3 text-sport-accent">⚡ Predição ao Vivo</h3>
          <LiveMatchTracker
            matchId={match.id}
            homeTeamName={match.homeTeamName}
            awayTeamName={match.awayTeamName}
            homeGoalsAvg={1.8}
            awayGoalsAvg={1.4}
            homeFormScore={0.72}
            awayFormScore={0.65}
            h2hHomeDominance={0.55}
            bankroll={1000}
            odds={odds}
          />
        </div>
      )}

      {match.playerStats.length > 0 && (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
          <h3 className="text-sm font-semibold mb-3">Estatísticas dos Jogadores</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sport-border text-sport-dim">
                  <th className="p-2 text-left">Jogador</th>
                  <th className="p-2 text-center">G</th>
                  <th className="p-2 text-center">A</th>
                  <th className="p-2 text-center">CH</th>
                  <th className="p-2 text-center">CH①</th>
                  <th className="p-2 text-center">PA</th>
                  <th className="p-2 text-center">%PA</th>
                  <th className="p-2 text-center">DS</th>
                  <th className="p-2 text-center">FC</th>
                  <th className="p-2 text-center">CA</th>
                  <th className="p-2 text-center">NOTA</th>
                </tr>
              </thead>
              <tbody>
                {match.playerStats.map(ps => (
                  <tr key={ps.id} className="border-b border-sport-border/30 hover:bg-sport-bg/30">
                    <td className="p-2 font-medium">{ps.playerId}</td>
                    <td className="p-2 text-center text-sport-home">{ps.goals}</td>
                    <td className="p-2 text-center">{ps.assists}</td>
                    <td className="p-2 text-center">{ps.shots}</td>
                    <td className="p-2 text-center">{ps.shotsOnTarget}</td>
                    <td className="p-2 text-center">{ps.passes}</td>
                    <td className="p-2 text-center">{ps.passAccuracy}%</td>
                    <td className="p-2 text-center">{ps.dribbles}</td>
                    <td className="p-2 text-center">{ps.foulsCommitted}</td>
                    <td className="p-2 text-center">
                      {Array(ps.yellowCards).fill(null).map((_, i) => <span key={i} className="text-yellow-400">🟨</span>)}
                      {Array(ps.redCards).fill(null).map((_, i) => <span key={i} className="text-red-500">🟥</span>)}
                    </td>
                    <td className="p-2 text-center font-bold">{ps.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, home, away }: { label: string; home: string | number; away: string | number }) {
  return (
    <div className="bg-sport-surface rounded-lg border border-sport-border p-3">
      <div className="text-[10px] text-sport-dim uppercase mb-2 text-center">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-sport-home text-right flex-1">{home}</span>
        <span className="text-[10px] text-sport-dim">vs</span>
        <span className="text-sm font-bold text-sport-away flex-1">{away}</span>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-sport-surface rounded" />
      <div className="h-48 bg-sport-surface rounded-lg" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-sport-surface rounded-lg" />)}
      </div>
    </div>
  );
}
