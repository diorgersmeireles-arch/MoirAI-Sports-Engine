'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ScannedMatch {
  matchId: string; matchLabel: string; competition: string;
  minute: number; homeScore: number; awayScore: number;
  homeXg: number; awayXg: number;
  homeDangerousAttacks: number; awayDangerousAttacks: number;
  matchScore: number; confidence: 'high' | 'medium' | 'low';
}

export default function ScannerPage() {
  const [scanned, setScanned] = useState<ScannedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [minThresh, setMinThresh] = useState(6);
  const [xgThresh, setXgThresh] = useState(1.5);

  useEffect(() => {
    fetch('/api/scanner').then(r => r.json()).then(d => {
      setScanned(d.scanned);
      setLoading(false);
    });
  }, []);

  const filtered = scanned.filter(m => m.matchScore >= minThresh / 10 && m.homeXg + m.awayXg >= xgThresh);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scanner ao Vivo</h1>
        <Link href="/" className="text-xs text-sport-accent hover:underline">Dashboard</Link>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-sport-surface rounded-lg" />)}
        </div>
      ) : scanned.length === 0 ? (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-8 text-center text-sport-dim">
          Nenhuma partida ao vivo no momento
        </div>
      ) : (
        <>
          <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
            <h3 className="text-sm font-semibold mb-4">Filtros de Scanner</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-sport-dim block mb-1">
                  Score Mínimo: {(minThresh / 10).toFixed(1)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={minThresh}
                  onChange={e => setMinThresh(Number(e.target.value))}
                  className="w-full accent-sport-accent"
                />
              </div>
              <div>
                <label className="text-xs text-sport-dim block mb-1">
                  xG Total Mínimo: {xgThresh.toFixed(1)}
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={xgThresh}
                  onChange={e => setXgThresh(Number(e.target.value))}
                  className="w-full accent-sport-accent"
                />
              </div>
            </div>
            <div className="mt-2 text-xs text-sport-dim">
              {filtered.length} de {scanned.length} partidas correspondem aos filtros
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map(m => {
              const totalXg = m.homeXg + m.awayXg;
              return (
                <Link
                  key={m.matchId}
                  href={`/matches/${m.matchId}`}
                  className="block bg-sport-surface rounded-lg border border-sport-border p-4 hover:border-sport-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm">{m.matchLabel}</div>
                      <div className="text-xs text-sport-dim">{m.competition} · {m.minute}'</div>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.confidence === 'high' ? 'bg-sport-home/20 text-sport-home' :
                      m.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-sport-border/50 text-sport-dim'
                    }`}>
                      {m.confidence === 'high' ? 'ALTA' : m.confidence === 'medium' ? 'MÉDIA' : 'BAIXA'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-sport-dim">Score</div>
                      <div className="font-bold text-sport-accent">{m.matchScore.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sport-dim">Placar</div>
                      <div className="font-bold">{m.homeScore}-{m.awayScore}</div>
                    </div>
                    <div>
                      <div className="text-sport-dim">xG Total</div>
                      <div className="font-bold">{totalXg.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sport-dim">Ataques</div>
                      <div className="font-bold">{m.homeDangerousAttacks + m.awayDangerousAttacks}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-sport-dim mb-1">
                      <span>xG Casa: {m.homeXg.toFixed(2)}</span>
                      <span>xG Fora: {m.awayXg.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-sport-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sport-home to-sport-accent rounded-full"
                        style={{ width: `${(m.homeXg / Math.max(totalXg, 0.01)) * 100}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
