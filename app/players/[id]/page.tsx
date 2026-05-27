'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PlayerAttributes {
  overall: number; pace: number; shooting: number; passing: number; defending: number; physical: number; dribbling: number;
  vision: number; crossing: number; finishing: number; heading: number; longShots: number; penalties: number;
  composure: number; reactions: number; marking: number; tackling: number; interceptions: number; positioning: number;
  stamina: number; strength: number; agility: number; balance: number; jumping: number; acceleration: number;
  shortPassing: number; longPassing: number; curve: number; freeKick: number;
}

interface PlayerDetail {
  id: string; fullName: string; sportId: string; position: string; shirtNumber?: number; teamId?: string;
  birthDate?: string; nationality?: string; height?: number; weight?: number; preferredFoot?: string;
  attributes: PlayerAttributes | null;
  cards: { id: string; cardType: string; reason: string; matchId: string; createdAt: string }[];
}

const RADAR_CATEGORIES = [
  { key: 'pace', label: 'Ritmo' },
  { key: 'shooting', label: 'Finalização' },
  { key: 'passing', label: 'Passe' },
  { key: 'defending', label: 'Defesa' },
  { key: 'physical', label: 'Físico' },
  { key: 'dribbling', label: 'Drible' },
];

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);

  useEffect(() => {
    fetch(`/api/players?id=${id}`).then(r => r.json()).then(setPlayer);
  }, [id]);

  if (!player) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-sport-dim">
        <Link href="/players" className="hover:text-sport-accent">Atletas</Link>
        <span>/</span>
        <span className="text-sport-text">{player.fullName}</span>
      </div>

      <div className="bg-sport-surface rounded-lg border border-sport-border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-sport-accent/20 flex items-center justify-center text-2xl">
                {player.sportId === 'football' ? '⚽' : player.sportId === 'basketball' ? '🏀' : player.sportId === 'volleyball' ? '🏐' : '⚾'}
              </div>
              <div>
                <h1 className="text-xl font-bold">{player.fullName}</h1>
                <div className="text-xs text-sport-dim">
                  {player.position}
                  {player.shirtNumber && <span> · #{player.shirtNumber}</span>}
                  {player.nationality && <span> · {player.nationality}</span>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {player.birthDate && <InfoItem label="Nascimento" value={new Date(player.birthDate).toLocaleDateString('pt-BR')} />}
              {player.height && <InfoItem label="Altura" value={`${player.height} cm`} />}
              {player.weight && <InfoItem label="Peso" value={`${player.weight} kg`} />}
              {player.preferredFoot && <InfoItem label="Pé" value={player.preferredFoot === 'right' ? 'Destro' : 'Canhoto'} />}
            </div>
          </div>

          {player.attributes && (
            <div className="lg:col-span-2 flex justify-center">
              <RadarChart attributes={player.attributes} />
            </div>
          )}
        </div>
      </div>

      {player.attributes && (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
          <h3 className="text-sm font-semibold mb-3">Atributos Detalhados</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(player.attributes).filter(([k]) => k !== 'overall').map(([key, value]) => (
              <div key={key} className="bg-sport-bg/50 rounded p-2">
                <div className="text-[10px] text-sport-dim uppercase">{key}</div>
                <div className="text-sm font-bold">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {player.cards.length > 0 && (
        <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
          <h3 className="text-sm font-semibold mb-3">Cartões Disciplinares</h3>
          <div className="space-y-2">
            {player.cards.map(card => (
              <div key={card.id} className="flex items-center gap-3 text-xs bg-sport-bg/30 rounded p-2">
                <span className={card.cardType === 'red' ? 'text-red-500' : 'text-yellow-400'}>
                  {card.cardType === 'red' ? '🟥' : '🟨'}
                </span>
                <span>{card.reason}</span>
                <span className="text-sport-dim ml-auto">{new Date(card.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RadarChart({ attributes }: { attributes: PlayerAttributes }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const levels = 5;

  const points = useMemo(() => {
    const n = RADAR_CATEGORIES.length;
    return RADAR_CATEGORIES.map((cat, i) => {
      const val = attributes[cat.key as keyof PlayerAttributes] / 100;
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return {
        label: cat.label,
        value: val,
        x: cx + radius * val * Math.cos(angle),
        y: cy + radius * val * Math.sin(angle),
        angle,
      };
    });
  }, [attributes]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {[...Array(levels)].map((_, level) => {
        const r = (radius * (level + 1)) / levels;
        const n = RADAR_CATEGORIES.length;
        const pts = RADAR_CATEGORIES.map((_, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
        }).join(' ');
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="currentColor"
            className="text-sport-border/50"
            strokeWidth={1}
          />
        );
      })}

      {RADAR_CATEGORIES.map((_, i) => {
        const a = (Math.PI * 2 * i) / RADAR_CATEGORIES.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + radius * Math.cos(a)}
            y2={cy + radius * Math.sin(a)}
            stroke="currentColor"
            className="text-sport-border/30"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={points.map(p => `${p.x},${p.y}`).join(' ')}
        fill="currentColor"
        className="text-sport-accent/20 [stroke:currentColor] [stroke-width:2]"
      />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-sport-accent" />
      ))}

      {points.map((p, i) => {
        const cat = RADAR_CATEGORIES[i]!;
        const labelR = radius + 24;
        const lx = cx + labelR * Math.cos(p.angle);
        const ly = cy + labelR * Math.sin(p.angle);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-sport-dim text-[10px]"
          >
            {p.label} {attributes[cat.key as keyof PlayerAttributes]}
          </text>
        );
      })}
    </svg>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sport-dim">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-sport-surface rounded" />
      <div className="h-80 bg-sport-surface rounded-lg" />
    </div>
  );
}
