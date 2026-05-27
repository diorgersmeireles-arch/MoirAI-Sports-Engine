/**
 * MoirAI Sports Engine — Componente de Acompanhamento ao Vivo
 * Desenvolvido por MADev
 *
 * Componente React funcional que simula o consumo de dados via WebSocket
 * e exibe gráficos estatísticos de probabilidade flutuando dinamicamente
 * à medida que o jogo avança segundo a segundo.
 *
 * Funciona como uma "ponte" entre o motor de analytics e a interface,
 * atualizando o estado interno a cada tick simulado.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  LiveAnalytics,
  BettingOdds,
} from '../types/sports';
import {
  predictLiveOutcome,
  projectTotalGoals,
  type PredictionResult,
} from '../services/predictionEngine';
import {
  calculateExpectedValue,
  calculateKellyCriterion,
  type EVResult,
  type KellyResult,
} from '../utils/financeEngine';

// =============================================================================
// Tipos Locais
// =============================================================================

/** Propriedades do componente */
export interface LiveMatchTrackerProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  /** Média histórica de gols do time da casa (fornecido pelo mathEngine) */
  homeGoalsAvg: number;
  /** Média histórica de gols do time visitante */
  awayGoalsAvg: number;
  /** FormScore do time da casa */
  homeFormScore: number;
  /** FormScore do time visitante */
  awayFormScore: number;
  /** Taxa de dominância do time da casa no H2H */
  h2hHomeDominance: number;
  /** Banca do usuário para cálculo de Kelly */
  bankroll: number;
  /** Odds atuais do mercado */
  odds: BettingOdds;
}

/** Estado interno do tracker */
interface TrackerState {
  minute: number;
  analytics: LiveAnalytics | null;
  prediction: PredictionResult | null;
  evResult: EVResult | null;
  kellyResult: KellyResult | null;
  history: HistoryEntry[];
  isSimulating: boolean;
}

/** Entrada do histórico de probabilidades (para o gráfico) */
interface HistoryEntry {
  minute: number;
  homeWin: number;
  draw: number;
  awayWin: number;
}

// =============================================================================
/** Geração de dados simulados de analytics para demonstração */
function generateSimulatedAnalytics(
  matchId: string,
  minute: number,
  homeProb: number,
  drawProb: number,
  awayProb: number,
  previousAnalytics: LiveAnalytics | null
): LiveAnalytics {
  // Base para variação randômica controlada
  const basePossession = 50 + Math.sin(minute * 0.1) * 10;

  // Se temos dados anteriores, evoluímos a partir deles; senão inicializamos
  const prev = previousAnalytics;

  return {
    matchId,
    minute,
    probabilities: {
      homeWin: homeProb,
      draw: drawProb,
      awayWin: awayProb,
      calculatedAt: Date.now(),
    },
    possession: {
      home: prev?.possession.home ?? basePossession + Math.random() * 5,
      away: prev?.possession.away ?? 100 - (basePossession + Math.random() * 5),
    },
    dangerousAttacks: {
      home: prev
        ? prev.dangerousAttacks.home + (Math.random() > 0.6 ? 1 : 0)
        : Math.floor(Math.random() * 5),
      away: prev
        ? prev.dangerousAttacks.away + (Math.random() > 0.6 ? 1 : 0)
        : Math.floor(Math.random() * 5),
    },
    shotsOnGoal: {
      home: prev
        ? prev.shotsOnGoal.home + (Math.random() > 0.7 ? 1 : 0)
        : Math.floor(Math.random() * 3),
      away: prev
        ? prev.shotsOnGoal.away + (Math.random() > 0.7 ? 1 : 0)
        : Math.floor(Math.random() * 3),
    },
    cards: {
      yellow: {
        home: prev?.cards.yellow.home ?? 0,
        away: prev?.cards.yellow.away ?? 0,
      },
      red: {
        home: prev?.cards.red.home ?? 0,
        away: prev?.cards.red.away ?? 0,
      },
    },
    xG: {
      home: prev
        ? prev.xG.home + (homeProb > 0.4 ? Math.random() * 0.15 : Math.random() * 0.05)
        : homeProb * 2,
      away: prev
        ? prev.xG.away + (awayProb > 0.4 ? Math.random() * 0.15 : Math.random() * 0.05)
        : awayProb * 2,
      perMinute: [],
    },
    projectedTotalGoals: homeProb + drawProb + awayProb * 2,
    dangerousAttacksLast10Min: {
      home: Math.floor(Math.random() * 12),
      away: Math.floor(Math.random() * 12),
    },
  };
}

// =============================================================================
// Paleta de Cores
// =============================================================================

const COLORS = {
  home: '#22c55e',
  draw: '#a855f7',
  away: '#ef4444',
  background: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  text: '#f8fafc',
  textDim: '#94a3b8',
  accent: '#3b82f6',
};

// =============================================================================
// Estilos Inline
// =============================================================================

const styles = {
  container: {
    background: COLORS.background,
    color: COLORS.text,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    padding: '24px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    maxWidth: '720px',
    margin: '0 auto',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.border}`,
  } as React.CSSProperties,
  matchTitle: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,
  badge: {
    background: COLORS.accent,
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  } as React.CSSProperties,
  card: {
    background: COLORS.surface,
    borderRadius: '8px',
    padding: '14px',
    border: `1px solid ${COLORS.border}`,
  } as React.CSSProperties,
  cardFull: {
    background: COLORS.surface,
    borderRadius: '8px',
    padding: '14px',
    border: `1px solid ${COLORS.border}`,
    gridColumn: '1 / -1',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: COLORS.textDim,
    marginBottom: '8px',
  } as React.CSSProperties,
  probBar: {
    display: 'flex',
    height: '28px',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '8px',
  } as React.CSSProperties,
  probSegment: (color: string, width: number) =>
    ({
      width: `${width}%`,
      background: color,
      transition: 'width 0.3s ease-in-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 700,
      color: '#fff',
      minWidth: width > 0 ? '0' : undefined,
    }) as React.CSSProperties,
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '13px',
  } as React.CSSProperties,
  statBar: (_homePct: number, _awayPct: number) =>
    ({
      display: 'flex',
      height: '6px',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '4px',
    }) as React.CSSProperties,
  statBarSegment: (color: string, width: number) =>
    ({
      width: `${width}%`,
      background: color,
      transition: 'width 0.5s ease',
    }) as React.CSSProperties,
  graph: {
    position: 'relative' as const,
    height: '100px',
    marginTop: '8px',
  } as React.CSSProperties,
  lineChart: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  } as React.CSSProperties,
  valueBadge: (isPositive: boolean) =>
    ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 700,
      background: isPositive ? '#166534' : '#7f1d1d',
      color: isPositive ? '#86efac' : '#fca5a5',
      marginTop: '4px',
    }) as React.CSSProperties,
  button: {
    background: COLORS.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '12px',
  } as React.CSSProperties,
};

// =============================================================================
// Sub-componentes de Visualização
// =============================================================================

interface ProbabilityBarProps {
  homeWin: number;
  draw: number;
  awayWin: number;
}

function ProbabilityBar({ homeWin, draw, awayWin }: ProbabilityBarProps): React.ReactElement {
  return (
    <div style={styles.probBar}>
      <div style={styles.probSegment(COLORS.home, homeWin * 100)}>
        {(homeWin * 100).toFixed(1)}%
      </div>
      <div style={styles.probSegment(COLORS.draw, draw * 100)}>
        {(draw * 100).toFixed(1)}%
      </div>
      <div style={styles.probSegment(COLORS.away, awayWin * 100)}>
        {(awayWin * 100).toFixed(1)}%
      </div>
    </div>
  );
}

/** Gráfico de linha SVG das probabilidades ao longo do jogo */
function ProbabilityChart({ history }: { history: HistoryEntry[] }): React.ReactElement {
  if (history.length < 2) {
    return <div style={{ ...styles.graph, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textDim, fontSize: '13px' }}>Aguardando dados...</div>;
  }

  const width = 600;
  const height = 100;
  const padding = { top: 8, bottom: 16, left: 8, right: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxMinute = Math.max(...history.map((h) => h.minute), 90);
  const xScale = (minute: number) =>
    padding.left + (minute / maxMinute) * chartW;
  const yScale = (prob: number) =>
    padding.top + (1 - prob) * chartH;

  const buildPath = (key: 'homeWin' | 'draw' | 'awayWin') => {
    return history
      .map((h, i) => {
        const x = xScale(h.minute);
        const y = yScale(h[key]);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const colorMap: Record<string, string> = {
    homeWin: COLORS.home,
    draw: COLORS.draw,
    awayWin: COLORS.away,
  };

  return (
    <div style={styles.graph}>
      <svg viewBox={`0 0 ${width} ${height}`} style={styles.lineChart} preserveAspectRatio="none">
        {/* Grid linhas horizontais */}
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <line
            key={v}
            x1={padding.left}
            y1={yScale(v)}
            x2={width - padding.right}
            y2={yScale(v)}
            stroke={COLORS.border}
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        ))}
        {/* Linhas de probabilidade */}
        {(['homeWin', 'draw', 'awayWin'] as const).map((key) => (
          <path
            key={key}
            d={buildPath(key)}
            fill="none"
            stroke={colorMap[key]!}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* Label dos eixos */}
        <text x={padding.left} y={height - 2} fill={COLORS.textDim} fontSize={10}>
          0'
        </text>
        <text x={width - padding.right - 16} y={height - 2} fill={COLORS.textDim} fontSize={10}>
          {maxMinute}'
        </text>
      </svg>
    </div>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function LiveMatchTracker({
  matchId,
  homeTeamName,
  awayTeamName,
  homeGoalsAvg,
  awayGoalsAvg,
  homeFormScore,
  awayFormScore,
  h2hHomeDominance,
  bankroll,
  odds,
}: LiveMatchTrackerProps): React.ReactElement {
  // Estado do tracker
  const [state, setState] = useState<TrackerState>({
    minute: 0,
    analytics: null,
    prediction: null,
    evResult: null,
    kellyResult: null,
    history: [],
    isSimulating: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyticsRef = useRef<LiveAnalytics | null>(null);

  // ===========================================================================
  // Simulador de WebSocket
  // ===========================================================================

  const stopSimulation = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isSimulating: false }));
  }, []);

  const startSimulation = useCallback(() => {
    stopSimulation();

    setState((prev) => ({ ...prev, isSimulating: true }));

    let currentMinute = 0;

    intervalRef.current = setInterval(() => {
      currentMinute++;

      if (currentMinute > 95) {
        stopSimulation();
        return;
      }

      setState((prev) => {
        // Obtém analytics anteriores para evolução realista
        const prevAnalytics = analyticsRef.current;

        // Executa o motor de previsão com dados atuais
        const prediction = predictLiveOutcome(
          homeGoalsAvg,
          awayGoalsAvg,
          { score: homeFormScore, sampleSize: 10 },
          { score: awayFormScore, sampleSize: 10 },
          {
            homeWins: Math.round(h2hHomeDominance * 10),
            draws: Math.round((1 - h2hHomeDominance) * 5),
            awayWins: Math.round((1 - h2hHomeDominance) * 5),
            totalMatches: 10,
            homeDominanceRate: h2hHomeDominance,
            averageGoalsPerMatch: homeGoalsAvg + awayGoalsAvg,
          },
          // Usamos o analytics gerado ou um inicial
          prevAnalytics ?? {
            matchId,
            minute: currentMinute,
            probabilities: { homeWin: 0.4, draw: 0.3, awayWin: 0.3, calculatedAt: Date.now() },
            possession: { home: 50, away: 50 },
            dangerousAttacks: { home: 0, away: 0 },
            shotsOnGoal: { home: 0, away: 0 },
            cards: { yellow: { home: 0, away: 0 }, red: { home: 0, away: 0 } },
            xG: { home: 0, away: 0, perMinute: [] },
            projectedTotalGoals: homeGoalsAvg + awayGoalsAvg,
            dangerousAttacksLast10Min: { home: 0, away: 0 },
          }
        );

        // Gera analytics simulados para este tick
        const newAnalytics = generateSimulatedAnalytics(
          matchId,
          currentMinute,
          prediction.homeWinProb,
          prediction.drawProb,
          prediction.awayWinProb,
          prevAnalytics
        );

        // Atualiza ref para próximo tick
        analyticsRef.current = newAnalytics;

        // Projeta gols totais
        const projected = projectTotalGoals(prediction, newAnalytics);

        // Calcula EV para a odd da casa (usando a melhor oportunidade)
        const evResult = calculateExpectedValue(
          prediction.homeWinProb,
          odds.moneyline.home
        );

        // Calcula Kelly se houver valor
        const kellyResult = evResult.isValueBet
          ? calculateKellyCriterion(
              prediction.homeWinProb,
              odds.moneyline.home,
              bankroll
            )
          : { fraction: 0, currencyAmount: 0, percentage: 0, isFractional: true };

        // Histórico para o gráfico (amostrar a cada 5 minutos para evitar poluição)
        const shouldRecord = currentMinute % 5 === 0 || currentMinute === 1;

        return {
          minute: currentMinute,
          analytics: newAnalytics,
          prediction: {
            ...prediction,
            projectedTotalGoals: projected,
          },
          evResult,
          kellyResult,
          history: shouldRecord
            ? [
                ...prev.history,
                {
                  minute: currentMinute,
                  homeWin: prediction.homeWinProb,
                  draw: prediction.drawProb,
                  awayWin: prediction.awayWinProb,
                },
              ]
            : prev.history,
          isSimulating: true,
        };
      });
    }, 1000); // 1 segundo = 1 minuto de jogo
  }, [
    matchId,
    homeTeamName,
    awayTeamName,
    homeGoalsAvg,
    awayGoalsAvg,
    homeFormScore,
    awayFormScore,
    h2hHomeDominance,
    bankroll,
    odds,
    stopSimulation,
  ]);

  // Limpa o intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ===========================================================================
  // Render
  // ===========================================================================

  const { analytics, prediction, evResult, kellyResult, history, isSimulating } = state;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.matchTitle}>
          {homeTeamName} vs {awayTeamName}
        </div>
        <div style={styles.badge}>
          {state.minute > 0 && state.minute <= 95
            ? `${state.minute}'`
            : 'AGUARDANDO'}
        </div>
      </div>

      {/* Barra de Probabilidades */}
      {analytics && (
        <>
          <div style={{ ...styles.cardTitle, marginBottom: '4px' }}>Probabilidades ao Vivo</div>
          <ProbabilityBar
            homeWin={analytics.probabilities.homeWin}
            draw={analytics.probabilities.draw}
            awayWin={analytics.probabilities.awayWin}
          />
        </>
      )}

      {/* Gráfico de Tendência */}
      <div style={{ ...styles.cardFull, marginTop: '12px' }}>
        <div style={styles.cardTitle}>Tendência das Probabilidades</div>
        <ProbabilityChart history={history} />
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '8px', fontSize: '11px' }}>
          <span style={{ color: COLORS.home }}>■ Casa</span>
          <span style={{ color: COLORS.draw }}>■ Empate</span>
          <span style={{ color: COLORS.away }}>■ Visitante</span>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div style={styles.grid}>
        {/* Estatísticas da Partida */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Posse de Bola</div>
          <div style={styles.statRow}>
            <span style={{ color: COLORS.home }}>{analytics?.possession.home.toFixed(1) ?? '-'}%</span>
            <span style={{ color: COLORS.textDim }}>vs</span>
            <span style={{ color: COLORS.away }}>{analytics?.possession.away.toFixed(1) ?? '-'}%</span>
          </div>
          {analytics && (
            <div style={styles.statBar(analytics.possession.home, analytics.possession.away)}>
              <div style={styles.statBarSegment(COLORS.home, analytics.possession.home)} />
              <div style={styles.statBarSegment(COLORS.away, analytics.possession.away)} />
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>xG (Expected Goals)</div>
          <div style={styles.statRow}>
            <span style={{ color: COLORS.home }}>{analytics?.xG.home.toFixed(2) ?? '-'}</span>
            <span style={{ color: COLORS.textDim }}>vs</span>
            <span style={{ color: COLORS.away }}>{analytics?.xG.away.toFixed(2) ?? '-'}</span>
          </div>
          {analytics && (
            <div style={styles.statBar(
              Math.max(analytics.xG.home, 0.1),
              Math.max(analytics.xG.away, 0.1)
            )}>
              <div style={styles.statBarSegment(COLORS.home, 
                analytics.xG.home / (analytics.xG.home + analytics.xG.away) * 100
              )} />
              <div style={styles.statBarSegment(COLORS.away, 
                analytics.xG.away / (analytics.xG.home + analytics.xG.away) * 100
              )} />
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Ataques Perigosos (últ. 10')</div>
          <div style={styles.statRow}>
            <span style={{ color: COLORS.home }}>{analytics?.dangerousAttacksLast10Min.home ?? '-'}</span>
            <span style={{ color: COLORS.textDim }}>vs</span>
            <span style={{ color: COLORS.away }}>{analytics?.dangerousAttacksLast10Min.away ?? '-'}</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Projeção de Gols</div>
          <div style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>
            {prediction?.projectedTotalGoals.toFixed(2) ?? '-'}
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textDim, textAlign: 'center' }}>
            Total esperado até o fim
          </div>
        </div>
      </div>

      {/* Inteligência Financeira */}
      <div style={styles.cardFull}>
        <div style={styles.cardTitle}>Inteligência Financeira</div>
        <div style={styles.grid}>
          <div>
            <div style={{ fontSize: '12px', color: COLORS.textDim }}>Valor Esperado (EV)</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
              {evResult
                ? `${(evResult.expectedValue * 100).toFixed(2)}%`
                : '-'}
            </div>
            {evResult && (
              <div style={styles.valueBadge(evResult.isValueBet)}>
                {evResult.recommendation}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: COLORS.textDim }}>Kelly Criterion</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
              {kellyResult && kellyResult.fraction > 0
                ? `${kellyResult.percentage.toFixed(2)}% (R$ ${kellyResult.currencyAmount.toFixed(2)})`
                : 'Sem aposta recomendada'}
            </div>
            {kellyResult && kellyResult.fraction > 0 && (
              <div style={{ fontSize: '11px', color: COLORS.textDim }}>
                Kelly Fracionário (1/4)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botão de Controle */}
      <div style={{ textAlign: 'center' }}>
        {!isSimulating ? (
          <button
            style={styles.button}
            onClick={startSimulation}
            type="button"
          >
            ▶ Iniciar Simulação ao Vivo
          </button>
        ) : (
          <button
            style={{ ...styles.button, background: '#dc2626' }}
            onClick={stopSimulation}
            type="button"
          >
            ⏹ Parar Simulação
          </button>
        )}
      </div>

      {/* Créditos */}
      <div
        style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '10px',
          color: COLORS.textDim,
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: '12px',
        }}
      >
        MoirAI Sports Engine — Desenvolvido por MADev
      </div>
    </div>
  );
}
