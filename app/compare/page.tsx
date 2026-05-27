'use client';

import { useEffect, useState, useMemo } from 'react';

interface PlayerSummary {
  id: string; fullName: string; sportId: string; position: string; teamId?: string;
  attributes: Record<string, number> | null;
}

interface PlayerDetail {
  id: string; fullName: string; sportId: string; position: string;
  teamName?: string; nationality?: string; heightCm?: number; weightKg?: number;
  attributes: Record<string, number> | null;
}

const COMPARE_KEYS = ['overall', 'pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical', 'stamina', 'vision', 'agility', 'composure', 'leadership'];

export default function ComparePage() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [p1, setP1] = useState<PlayerDetail | null>(null);
  const [p2, setP2] = useState<PlayerDetail | null>(null);

  useEffect(() => {
    fetch('/api/players').then(r => r.json()).then(setPlayers);
  }, []);

  useEffect(() => {
    if (p1Id) fetch(`/api/players?id=${p1Id}`).then(r => r.json()).then(setP1);
    else setP1(null);
  }, [p1Id]);

  useEffect(() => {
    if (p2Id) fetch(`/api/players?id=${p2Id}`).then(r => r.json()).then(setP2);
    else setP2(null);
  }, [p2Id]);

  const allKeys = useMemo(() => {
    if (!p1?.attributes && !p2?.attributes) return [];
    const merged = new Set<string>();
    if (p1?.attributes) Object.keys(p1.attributes).forEach(k => merged.add(k));
    if (p2?.attributes) Object.keys(p2.attributes).forEach(k => merged.add(k));
    return COMPARE_KEYS.filter(k => merged.has(k));
  }, [p1, p2]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comparar Atletas</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <select
          value={p1Id}
          onChange={e => setP1Id(e.target.value)}
          className="bg-sport-surface border border-sport-border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Selecionar atleta A</option>
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.fullName} ({p.sportId})</option>
          ))}
        </select>
        <select
          value={p2Id}
          onChange={e => setP2Id(e.target.value)}
          className="bg-sport-surface border border-sport-border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Selecionar atleta B</option>
          {players.filter(p => p.id !== p1Id).map(p => (
            <option key={p.id} value={p.id}>{p.fullName} ({p.sportId})</option>
          ))}
        </select>
      </div>

      {p1 && p2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PlayerCard player={p1} color="home" />
          <PlayerCard player={p2} color="away" />
        </div>
      )}

      {p1?.attributes && p2?.attributes && allKeys.length > 0 && (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
          <h2 className="text-sm font-semibold mb-3">Comparação de Atributos</h2>
          <div className="flex justify-center">
            <ComparisonRadar attrs1={p1.attributes} attrs2={p2.attributes} keys={allKeys} />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sport-border text-sport-dim">
                  <th className="p-2 text-left">Atributo</th>
                  <th className="p-2 text-right text-sport-home">{p1.fullName}</th>
                  <th className="p-2 text-center">Diferença</th>
                  <th className="p-2 text-left text-sport-away">{p2.fullName}</th>
                </tr>
              </thead>
              <tbody>
                {allKeys.map(key => {
                  const v1 = p1.attributes![key] ?? 0;
                  const v2 = p2.attributes![key] ?? 0;
                  const diff = v1 - v2;
                  return (
                    <tr key={key} className="border-b border-sport-border/20">
                      <td className="p-2 font-medium capitalize">{key}</td>
                      <td className={`p-2 text-right font-bold ${v1 > v2 ? 'text-sport-home' : ''}`}>{v1}</td>
                      <td className={`p-2 text-center font-bold ${diff > 0 ? 'text-sport-home' : diff < 0 ? 'text-sport-away' : 'text-sport-dim'}`}>
                        {diff > 0 ? `+${diff}` : diff === 0 ? '—' : diff}
                      </td>
                      <td className={`p-2 font-bold ${v2 > v1 ? 'text-sport-away' : ''}`}>{v2}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!p1 && !p2 && (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-8 text-center text-sport-dim">
          Selecione dois atletas para comparar
        </div>
      )}
    </div>
  );
}

function PlayerCard({ player, color }: { player: PlayerDetail; color: 'home' | 'away' }) {
  const accent = color === 'home' ? 'text-sport-home border-sport-home/30' : 'text-sport-away border-sport-away/30';
  return (
    <div className={`bg-sport-surface rounded-lg border p-4 ${accent}`}>
      <div className="text-lg font-bold mb-2">{player.fullName}</div>
      <div className="text-xs text-sport-dim space-y-1">
        <div>{player.position}</div>
        {player.teamName && <div>{player.teamName}</div>}
        {player.nationality && <div>{player.nationality}</div>}
        {player.heightCm && <div>{player.heightCm} cm</div>}
      </div>
      {player.attributes && (
        <div className="mt-3 text-3xl font-bold">{player.attributes.overall ?? '—'}</div>
      )}
    </div>
  );
}

function ComparisonRadar({ attrs1, attrs2, keys }: { attrs1: Record<string, number>; attrs2: Record<string, number>; keys: string[] }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const levels = 5;
  const n = keys.length;

  const points1 = keys.map((key, i) => {
    const val = (attrs1[key] ?? 50) / 100;
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + radius * val * Math.cos(angle), y: cy + radius * val * Math.sin(angle), val, angle };
  });
  const points2 = keys.map((key, i) => {
    const val = (attrs2[key] ?? 50) / 100;
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + radius * val * Math.cos(angle), y: cy + radius * val * Math.sin(angle), val, angle };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[...Array(levels)].map((_, level) => {
        const r = (radius * (level + 1)) / levels;
        const pts = keys.map((_, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(' ');
        return <polygon key={level} points={pts} fill="none" stroke="#334155" strokeWidth={1} />;
      })}
      {keys.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + radius * Math.cos(a)} y2={cy + radius * Math.sin(a)} stroke="#334155" strokeWidth={1} />;
      })}
      <polygon points={points1.map(p => `${p.x},${p.y}`).join(' ')} fill="#22c55e33" stroke="#22c55e" strokeWidth={2} />
      <polygon points={points2.map(p => `${p.x},${p.y}`).join(' ')} fill="#ef444433" stroke="#ef4444" strokeWidth={2} />
      {points1.map((p, i) => <circle key={`p1-${i}`} cx={p.x} cy={p.y} r={3} fill="#22c55e" />)}
      {points2.map((p, i) => <circle key={`p2-${i}`} cx={p.x} cy={p.y} r={3} fill="#ef4444" />)}
      {keys.map((key, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + (radius + 20) * Math.cos(a);
        const ly = cy + (radius + 20) * Math.sin(a);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={9}>
            {key}
          </text>
        );
      })}
    </svg>
  );
}
