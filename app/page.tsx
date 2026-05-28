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

const roadmapItems = [
  {
    icon: '🧠', title: 'Neural Scouting',
    desc: 'Casamento preditivo de atletas e simulação automática de transferências por IA.',
    color: 'border-[#d4af37]/40',
  },
  {
    icon: '📈', title: 'Live Betting Engine',
    desc: 'Motor matemático para precificação instantânea de odds baseada em momentum.',
    color: 'border-[#d4af37]/40',
  },
  {
    icon: '🫀', title: 'Biometrics Hub',
    desc: 'Medicina esportiva preditiva: detecção de lesões e recuperação pós-jogo.',
    color: 'border-[#d4af37]/40',
  },
];

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
        <h1 className="text-2xl font-bold text-[#f5f0e8] tracking-tight">
          Dashboard
          <span className="block text-xs text-[#d4af37]/60 font-normal tracking-[0.2em] uppercase mt-0.5">MoirAI Sports Engine</span>
        </h1>
        <span className="text-[10px] text-[#888] tracking-wider">2025 Season</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Partidas" value={matches.length} />
        <StatCard label="Ao Vivo" value={liveMatches.length} color="text-[#22c55e]" />
        <StatCard label="Scanner" value={scannerCount} color="text-[#d4af37]" />
        <StatCard label="Standings" value={standings.length} color="text-[#a855f7]" />
      </div>

      {liveMatches.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3 tracking-wider uppercase text-[#d4af37]/70 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
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
            <h2 className="text-sm font-semibold tracking-wider uppercase text-[#d4af37]/70">Últimos Resultados</h2>
            <Link href="/matches" className="text-[11px] text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {recentMatches.length > 0 ? recentMatches.map(m => <MatchCard key={m.id} match={m} compact />)
              : <p className="text-sm text-[#888] text-center py-4">Nenhuma partida finalizada</p>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-[#d4af37]/70">Brasileirão 2024</h2>
            <Link href="/competitions" className="text-[11px] text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">Ver tudo</Link>
          </div>
          <div className="bg-[#111] rounded-lg border border-[#1f1f1f] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1f1f1f] text-[#888]">
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
                  <tr key={s.id} className="border-b border-[#1f1f1f]/50 hover:bg-[#d4af37]/5 transition-colors">
                    <td className={`p-2 text-center font-bold ${s.position <= 4 ? 'text-[#d4af37]' : s.position <= 6 ? 'text-[#22c55e]' : ''}`}>
                      {s.position}º
                    </td>
                    <td className="p-2 text-[#f5f0e8]">{s.teamId}</td>
                    <td className="p-2 text-center font-bold text-[#f5f0e8]">{s.points}</td>
                    <td className="p-2 text-center text-[#22c55e]">{s.wins}</td>
                    <td className="p-2 text-center text-[#a855f7]">{s.draws}</td>
                    <td className="p-2 text-center text-[#ef4444]">{s.losses}</td>
                    <td className="p-2 text-center text-[#888]">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[#d4af37]/70">Scanner Rápido</h2>
          <Link href="/scanner" className="text-[11px] text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">Abrir Scanner</Link>
        </div>
        <div className="bg-[#111] rounded-lg border border-[#1f1f1f] p-4 text-center text-[#888] text-sm">
          {scannerCount > 0
            ? `${scannerCount} partidas analisadas pelo scanner ao vivo`
            : 'Scanner aguardando dados...'}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-wider uppercase text-[#d4af37]/70">Próximos Módulos</h2>
          <Link href="/roadmap" className="text-[11px] text-[#d4af37]/60 hover:text-[#d4af37] transition-colors">Explorar</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {roadmapItems.map(item => (
            <Link
              key={item.title}
              href="/roadmap"
              className="bg-[#111] rounded-lg border border-[#1f1f1f] hover:border-[#d4af37]/40 p-4 transition-all group"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-semibold text-[#f5f0e8] group-hover:text-[#d4af37] transition-colors">{item.title}</div>
              <div className="text-xs text-[#888] mt-1 leading-relaxed">{item.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-[#111] rounded-lg border border-[#1f1f1f] p-4 hover:border-[#d4af37]/20 transition-colors">
      <div className="text-[10px] text-[#888] tracking-wider uppercase mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color ?? 'text-[#f5f0e8]'}`}>{value}</div>
    </div>
  );
}

function MatchCard({ match, compact }: { match: MatchCard; compact?: boolean }) {
  const isLive = match.status === 'live';
  return (
    <Link
      href={`/matches/${match.id}`}
      className={`block bg-[#111] rounded-lg border border-[#1f1f1f] hover:border-[#d4af37]/30 transition-all ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className="flex items-center justify-between mb-2">
        {match.competition && (
          <span className="text-[10px] text-[#888] uppercase tracking-wider">{match.competition.shortName}</span>
        )}
        {match.round && <span className="text-[10px] text-[#888]">Rodada {match.round}</span>}
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className={`font-semibold text-sm truncate text-[#f5f0e8] ${compact ? 'max-w-24' : 'max-w-32'}`}>{match.homeTeamShort}</span>
        <div className="flex items-center gap-3 shrink-0">
          {isLive && <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />}
          <span className={`font-bold text-lg tabular-nums ${isLive ? 'text-[#22c55e]' : 'text-[#d4af37]'}`}>
            {match.status === 'scheduled' ? '—' : `${match.homeScore}-${match.awayScore}`}
          </span>
          {isLive && <span className="text-[10px] text-[#22c55e] font-bold">LIVE</span>}
        </div>
        <span className={`font-semibold text-sm truncate text-right text-[#f5f0e8] ${compact ? 'max-w-24' : 'max-w-32'}`}>{match.awayTeamShort}</span>
      </div>
    </Link>
  );
}
