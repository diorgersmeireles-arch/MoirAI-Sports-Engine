/**
 * MoirAI Sports Engine — Motor Estatístico e Histórico
 * Desenvolvido por MADev
 *
 * Conjunto de funções puras para cálculo de métricas esportivas
 * com precisão decimal rigorosa usando decimal.js.
 */

import Decimal from 'decimal.js';

// Configura precisão global: 20 casas decimais para evitar erros de ponto flutuante
Decimal.set({ precision: 20 });

// =============================================================================
// Interfaces Locais (tipos de entrada/saída)
// =============================================================================

export interface WinRates {
  wins: number;   // 0-1
  draws: number;  // 0-1
  losses: number; // 0-1
  sampleSize: number;
}

export interface FormScoreResult {
  score: number;       // métrica ponderada normalizada (0-1)
  sampleSize: number;
}

export interface H2HResult {
  homeWins: number;
  draws: number;
  awayWins: number;
  totalMatches: number;
  /** Taxa de dominância matemática pura do time da casa */
  homeDominanceRate: number;
  /** Média de gols por partida no histórico */
  averageGoalsPerMatch: number;
}

export interface GoalMetrics {
  home: {
    avgGoalsScored: number;
    avgGoalsConceded: number;
  };
  away: {
    avgGoalsScored: number;
    avgGoalsConceded: number;
  };
  overUnderRates: Record<number, number>; // ex: { 1.5: 0.75, 2.5: 0.60, 3.5: 0.35 }
}

export interface MatchInput {
  goalsHome: number;
  goalsAway: number;
  isHome: boolean;
}

export interface H2HMatchInput {
  homeGoals: number;
  awayGoals: number;
}

// =============================================================================
// Funções Puras
// =============================================================================

/**
 * Calcula as porcentagens de vitórias, empates e derrotas
 * baseada nos últimos N jogos do time.
 *
 * @param results - Array de resultados recentes
 * @param n - Número de jogos a considerar (parâmetro dinâmico)
 * @returns WinRates com valores normalizados entre 0-1
 */
export function calculateWinRates(
  results: { outcome: 'W' | 'D' | 'L' }[],
  n: number
): WinRates {
  if (n <= 0 || results.length === 0) {
    return { wins: 0, draws: 0, losses: 0, sampleSize: 0 };
  }

  // Pega os últimos N jogos (ou menos se não houverem suficientes)
  const sample = results.slice(-n);
  const total = sample.length;

  // Contagem de cada resultado
  const wins = sample.filter((r) => r.outcome === 'W').length;
  const draws = sample.filter((r) => r.outcome === 'D').length;
  const losses = sample.filter((r) => r.outcome === 'L').length;

  // Divisão com Decimal para precisão total
  const totalDec = new Decimal(total);

  return {
    wins: new Decimal(wins).div(totalDec).toNumber(),
    draws: new Decimal(draws).div(totalDec).toNumber(),
    losses: new Decimal(losses).div(totalDec).toNumber(),
    sampleSize: total,
  };
}

/**
 * Calcula uma métrica ponderada de momento (Form Score).
 * Atribui maior peso ao jogo mais recente (t-1) do que ao
 * jogo t-5 usando uma progressão linear decrescente.
 *
 * Fórmula: ∑ (peso_i * resultado_i) / ∑ peso_i
 * onde resultado_i = 1 (W), 0.5 (D), 0 (L)
 * e peso_i = (n - i + 1) para o jogo mais recente ter maior peso
 *
 * @param results - Array de resultados (mais recente por último)
 * @param n - Número de jogos a considerar
 * @returns FormScoreResult normalizado entre 0-1
 */
export function calculateFormScore(
  results: RecentResultInput[],
  n: number
): FormScoreResult {
  if (n <= 0 || results.length === 0) {
    return { score: 0, sampleSize: 0 };
  }

  const sample = results.slice(-n);
  const total = sample.length;

  // Pesos decrescentes: o jogo mais recente (último no array) recebe peso = total,
  // o mais antigo recebe peso = 1
  let weightedSum = new Decimal(0);
  let totalWeight = new Decimal(0);

  for (let i = 0; i < sample.length; i++) {
    const weight = i + 1; // peso linear crescente: jogo mais recente pesa mais
    const r = sample[i]!;

    // Mapeia resultado para valor numérico
    let value: number;
    if (r.outcome === 'W') {
      value = 1;
    } else if (r.outcome === 'D') {
      value = 0.5;
    } else {
      value = 0;
    }

    weightedSum = weightedSum.plus(new Decimal(weight).times(value));
    totalWeight = totalWeight.plus(weight);
  }

  const score = totalWeight.isZero()
    ? 0
    : weightedSum.div(totalWeight).toNumber();

  return { score, sampleSize: total };
}

/**
 * Interface de entrada para resultados de forma recente
 */
export interface RecentResultInput {
  outcome: 'W' | 'D' | 'L';
}

// =============================================================================
// Cabeça a Cabeça (Head-to-Head / H2H)
// =============================================================================

/**
 * Analisa o histórico de confrontos diretos entre dois times
 * e extrai a taxa de dominância matemática pura.
 *
 * Dominância = (gols_marcados_casa / total_gols) ajustada por mando de campo
 *
 * @param homeGoals - Array de gols do time da casa em cada confronto
 * @param awayGoals - Array de gols do time visitante em cada confronto
 * @returns H2HResult com estatísticas completas
 */
export function calculateH2H(
  homeGoals: number[],
  awayGoals: number[]
): H2HResult {
  if (homeGoals.length === 0 || homeGoals.length !== awayGoals.length) {
    return {
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      totalMatches: 0,
      homeDominanceRate: 0.5, // neutro quando sem dados
      averageGoalsPerMatch: 0,
    };
  }

  const total = homeGoals.length;
  let homeWinsCount = 0;
  let drawsCount = 0;
  let awayWinsCount = 0;
  let totalGoals = new Decimal(0);

  for (let i = 0; i < total; i++) {
    const hg = homeGoals[i]!;
    const ag = awayGoals[i]!;

    if (hg > ag) homeWinsCount++;
    else if (hg === ag) drawsCount++;
    else awayWinsCount++;

    totalGoals = totalGoals.plus(hg + ag);
  }

  // Taxa de dominância: (gols_casa / total_gols)
  const homeTotalGoals = homeGoals.reduce((s, g) => s + g, 0);
  const awayTotalGoals = awayGoals.reduce((s, g) => s + g, 0);
  const allGoals = homeTotalGoals + awayTotalGoals;

  const homeDominanceRate = allGoals > 0
    ? new Decimal(homeTotalGoals).div(allGoals).toNumber()
    : 0.5;

  const averageGoalsPerMatch = total > 0
    ? totalGoals.div(total).toNumber()
    : 0;

  return {
    homeWins: homeWinsCount,
    draws: drawsCount,
    awayWins: awayWinsCount,
    totalMatches: total,
    homeDominanceRate,
    averageGoalsPerMatch,
  };
}

// =============================================================================
// Métricas de Gols
// =============================================================================

/**
 * Calcula médias de gols marcados/sofridos dentro e fora de casa,
 * bem como a taxa percentual de Over/Under para linhas específicas.
 *
 * Over acontece quando o total de gols na partida > linha.
 * Under acontece quando o total de gols na partida <= linha.
 *
 * @param matches - Array de partidas com gols do time e do oponente
 * @param lines - Array de linhas para calcular Over/Under (ex: [1.5, 2.5, 3.5])
 * @returns GoalMetrics com todas as médias e taxas
 */
export function calculateGoalMetrics(
  matches: MatchInput[],
  lines: number[]
): GoalMetrics {
  if (matches.length === 0) {
    return {
      home: { avgGoalsScored: 0, avgGoalsConceded: 0 },
      away: { avgGoalsScored: 0, avgGoalsConceded: 0 },
      overUnderRates: Object.fromEntries(lines.map((l) => [l, 0])),
    };
  }

  const homeMatches = matches.filter((m) => m.isHome);
  const awayMatches = matches.filter((m) => !m.isHome);

  // Médias para jogos em casa
  const homeScored = homeMatches.length > 0
    ? new Decimal(homeMatches.reduce((s, m) => s + m.goalsHome, 0)).div(homeMatches.length).toNumber()
    : 0;
  const homeConceded = homeMatches.length > 0
    ? new Decimal(homeMatches.reduce((s, m) => s + m.goalsAway, 0)).div(homeMatches.length).toNumber()
    : 0;

  // Médias para jogos fora
  const awayScored = awayMatches.length > 0
    ? new Decimal(awayMatches.reduce((s, m) => s + m.goalsAway, 0)).div(awayMatches.length).toNumber()
    : 0;
  const awayConceded = awayMatches.length > 0
    ? new Decimal(awayMatches.reduce((s, m) => s + m.goalsHome, 0)).div(awayMatches.length).toNumber()
    : 0;

  // Over/Under rates
  const totalMatches = matches.length;
  const overUnderRates: Record<number, number> = {};

  for (const line of lines) {
    const overCount = matches.filter(
      (m) => m.goalsHome + m.goalsAway > line
    ).length;
    overUnderRates[line] = new Decimal(overCount).div(totalMatches).toNumber();
  }

  return {
    home: { avgGoalsScored: homeScored, avgGoalsConceded: homeConceded },
    away: { avgGoalsScored: awayScored, avgGoalsConceded: awayConceded },
    overUnderRates,
  };
}
