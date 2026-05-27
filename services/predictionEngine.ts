/**
 * MoirAI Sports Engine — Algoritmo de Previsão ao Vivo e Simulação
 * Desenvolvido por MADev
 *
 * Motor preditivo em tempo real baseado na Distribuição de Poisson
 * combinada com tempo decorrido, eventos críticos e escalações.
 *
 * A Distribuição de Poisson modela a probabilidade de k gols
 * em uma partida dado um lambda (média esperada de gols):
 *   P(X = k) = (e^(-λ) * λ^k) / k!
 */

import Decimal from 'decimal.js';
import type { LiveAnalytics, Lineup, LineupPlayer } from '../types/sports';
import { PlayerPosition } from '../types/sports';
import type { H2HResult, FormScoreResult } from '../utils/mathEngine';

Decimal.set({ precision: 20 });

// =============================================================================
// Constantes de Peso para Eventos
// =============================================================================

/** Fator de impacto de um cartão vermelho para o time adversário */
const RED_CARD_IMPACT = 0.35;
/** Fator de impacto de um cartão vermelho para o time beneficiado */
const RED_CARD_BENEFIT = 1.25;

/** Fator de impacto de ataque perigoso por minuto acima da média */
const DANGEROUS_ATTACK_FACTOR = 0.015;

/** Peso de impacto por posição em caso de ausência de jogador-chave */
const POSITION_IMPACT_WEIGHTS: Record<PlayerPosition, number> = {
  [PlayerPosition.Goalkeeper]: 0.20,
  [PlayerPosition.Defender]: 0.15,
  [PlayerPosition.Midfielder]: 0.10,
  [PlayerPosition.Forward]: 0.25,
};

// =============================================================================
// Interfaces de Retorno
// =============================================================================

export interface PredictionResult {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  projectedTotalGoals: number;
  homeExpectedGoals: number;
  awayExpectedGoals: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  adjustmentsApplied: string[];
  calculatedAt: number;
}

// =============================================================================
// Funções Auxiliares (Matemática)
// =============================================================================

/**
 * Calcula o fatorial de um número inteiro não negativo.
 * Usa abordagem iterativa para evitar problemas de recursão.
 */
function factorial(n: number): Decimal {
  if (n < 0) return new Decimal(0);
  if (n === 0 || n === 1) return new Decimal(1);

  let result = new Decimal(1);
  for (let i = 2; i <= n; i++) {
    result = result.times(i);
  }
  return result;
}

/**
 * Calcula a probabilidade de Poisson para um dado lambda e k:
 *   P(X = k) = (e^(-λ) * λ^k) / k!
 *
 * @param lambda - Média esperada de ocorrências
 * @param k - Número de ocorrências a testar
 * @returns Probabilidade entre 0-1
 */
function poissonProbability(lambda: number, k: number): number {
  const lambdaDec = new Decimal(lambda);

  const expNegLambda = Decimal.exp(lambdaDec.negated());

  // λ^k
  const lambdaPowK = lambdaDec.pow(k);

  // k!
  const kFactorial = factorial(k);

  return expNegLambda.times(lambdaPowK).div(kFactorial).toNumber();
}

/**
 * Estima o lambda (média de gols) de um time com base em:
 * - Média histórica de gols marcados
 * - Forma recente
 * - Dominância no H2H
 * - Fator de ajuste por tempo decorrido
 */
function estimateLambda(
  baseGoalsAvg: number,
  formScore: number,
  h2hDominance: number,
  elapsedMinutes: number,
  totalMinutes: number = 90
): number {
  const base = new Decimal(baseGoalsAvg);
  const formFactor = new Decimal(formScore).minus(0.5).times(0.3); // forma ajusta ±15%
  const h2hFactor = new Decimal(h2hDominance).minus(0.5).times(0.2); // h2h ajusta ±10%

  // Fator de tempo: quanto mais tempo passou, menor o potencial de gols restantes
  const remainingFraction = new Decimal(totalMinutes - elapsedMinutes).div(totalMinutes);
  const timeFactor = remainingFraction.greaterThan(0)
    ? remainingFraction
    : new Decimal(0);

  // Lambda base ajustado
  const lambda = base
    .plus(formFactor)
    .plus(h2hFactor)
    .times(timeFactor.plus(0.3)) // mantém baseline de 30% mesmo no fim
    .toNumber();

  return Math.max(lambda, 0.01); // nunca zero (sempre há chance mínima)
}

// =============================================================================
// Funções Principais
// =============================================================================

/**
 * Recalcula dinamicamente a probabilidade de vitória (Home / Draw / Away)
 * utilizando a Distribuição de Poisson combinada com o tempo decorrido
 * de jogo e eventos críticos de alto impacto.
 *
 * Processo:
 * 1. Estima λ₁ (gols esperados do time da casa) e λ₂ (visitante)
 * 2. Calcula P(X=k) para k = 0..10 gols para cada time
 * 3. Soma probabilidades conjuntas para Home, Draw, Away
 * 4. Aplica ajustes por eventos críticos (cartões vermelhos, ataques/min)
 *
 * @param homeGoalsAvg - Média histórica de gols do time da casa
 * @param awayGoalsAvg - Média histórica de gols do time visitante
 * @param formHome - FormScore do time da casa
 * @param formAway - FormScore do time visitante
 * @param h2h - Resultado do confronto direto
 * @param live - Analytics ao vivo da partida
 * @returns PredictionResult com todas as probabilidades
 */
export function predictLiveOutcome(
  homeGoalsAvg: number,
  awayGoalsAvg: number,
  formHome: FormScoreResult,
  formAway: FormScoreResult,
  h2h: H2HResult,
  live: LiveAnalytics
): PredictionResult {
  const adjustmentsApplied: string[] = [];

  // Passo 1: Estimar lambdas
  let lambdaHome = estimateLambda(
    homeGoalsAvg,
    formHome.score,
    h2h.homeDominanceRate,
    live.minute
  );

  let lambdaAway = estimateLambda(
    awayGoalsAvg,
    formAway.score,
    1 - h2h.homeDominanceRate, // dominância do visitante
    live.minute
  );

  // Passo 2: Ajustar por eventos críticos
  // Cartão vermelho: reduz drasticamente o lambda do time afetado
  if (live.cards.red.home > 0) {
    lambdaHome *= RED_CARD_IMPACT;
    lambdaAway *= RED_CARD_BENEFIT;
    adjustmentsApplied.push(
      `Cartão vermelho para o time da casa: λ_home ajustado para ${lambdaHome.toFixed(3)}`
    );
  }
  if (live.cards.red.away > 0) {
    lambdaAway *= RED_CARD_IMPACT;
    lambdaHome *= RED_CARD_BENEFIT;
    adjustmentsApplied.push(
      `Cartão vermelho para o time visitante: λ_away ajustado para ${lambdaAway.toFixed(3)}`
    );
  }

  // Ataques perigosos nos últimos 10 min acima da média aumentam lambda
  const avgDangerousPerMin = 1.5; // média de referência
  const homeAttackRate = live.dangerousAttacksLast10Min.home / 10;
  const awayAttackRate = live.dangerousAttacksLast10Min.away / 10;

  if (homeAttackRate > avgDangerousPerMin) {
    const boost = (homeAttackRate - avgDangerousPerMin) * DANGEROUS_ATTACK_FACTOR;
    lambdaHome *= 1 + boost;
    adjustmentsApplied.push(
      `Alta taxa de ataques perigosos do time da casa (${homeAttackRate.toFixed(1)}/min): λ_home +${(boost * 100).toFixed(1)}%`
    );
  }
  if (awayAttackRate > avgDangerousPerMin) {
    const boost = (awayAttackRate - avgDangerousPerMin) * DANGEROUS_ATTACK_FACTOR;
    lambdaAway *= 1 + boost;
    adjustmentsApplied.push(
      `Alta taxa de ataques perigosos do time visitante (${awayAttackRate.toFixed(1)}/min): λ_away +${(boost * 100).toFixed(1)}%`
    );
  }

  // Passo 3: Calcular matriz de Poisson para 0..10 gols
  const maxGoals = 10;
  const homeProbs: number[] = [];
  const awayProbs: number[] = [];

  for (let k = 0; k <= maxGoals; k++) {
    homeProbs.push(poissonProbability(lambdaHome, k));
    awayProbs.push(poissonProbability(lambdaAway, k));
  }

  // Passo 4: Calcular probabilidades de resultado
  let homeWinSum = 0;
  let drawSum = 0;
  let awayWinSum = 0;

  for (let i = 0; i <= maxGoals; i++) {
    for (let j = 0; j <= maxGoals; j++) {
      const prob = homeProbs[i]! * awayProbs[j]!;
      if (i > j) homeWinSum += prob;
      else if (i === j) drawSum += prob;
      else awayWinSum += prob;
    }
  }

  // Normalizar para garantir que soma = 1
  const total = homeWinSum + drawSum + awayWinSum;
  const homeWinProb = total > 0 ? homeWinSum / total : 0.333;
  const drawProb = total > 0 ? drawSum / total : 0.334;
  const awayWinProb = total > 0 ? awayWinSum / total : 0.333;

  // Projeção de gols totais (soma dos lambdas)
  const projectedTotalGoals = lambdaHome + lambdaAway;

  // Nível de confiança baseado no tempo decorrido e volume de dados
  const confidenceLevel: PredictionResult['confidenceLevel'] =
    live.minute >= 60 ? 'high' :
    live.minute >= 30 ? 'medium' : 'low';

  return {
    homeWinProb,
    drawProb,
    awayWinProb,
    projectedTotalGoals,
    homeExpectedGoals: lambdaHome,
    awayExpectedGoals: lambdaAway,
    confidenceLevel,
    adjustmentsApplied,
    calculatedAt: Date.now(),
  };
}

/**
 * Projeta o número total ajustado de gols até o final da partida.
 *
 * Usa a soma dos lambdas estimados e considera:
 * - Tempo restante (proporcional)
 * - Momentum atual (gols já marcados + xG restante)
 *
 * @param prediction - Resultado da previsão atual
 * @param live - Analytics ao vivo
 * @returns Projeção final de gols totais
 */
export function projectTotalGoals(
  prediction: PredictionResult,
  live: LiveAnalytics
): number {
  const currentTotal = live.xG.home + live.xG.away;
  const remainingProjection = prediction.projectedTotalGoals;

  // Ponderação: xG realizado tem peso 40%, projeção futura 60%
  const weighted = new Decimal(currentTotal)
    .times(0.4)
    .plus(new Decimal(remainingProjection).times(0.6));

  return weighted.toNumber();
}

/**
 * Ajusta o favoritismo inicial se a escalação oficial (lineup)
 * indicar ausência de jogadores-chave com pesos customizados por posição.
 *
 * Para cada jogador ausente na lista de titulares, aplica um redutor
 * no lambda (gols esperados) proporcional ao peso da posição.
 *
 * @param baseLambda - Lambda base do time
 * @param lineup - Escalação oficial
 * @param missingPlayerIds - IDs de jogadores importantes ausentes
 * @returns Lambda ajustado
 */
export function adjustForLineups(
  baseLambda: number,
  lineup: Lineup,
  missingPlayerIds: string[]
): number {
  if (missingPlayerIds.length === 0) return baseLambda;

  let totalAdjustment = new Decimal(1); // 1 = 100% (sem ajuste)

  for (const playerId of missingPlayerIds) {
    const player = lineup.players.find((p: LineupPlayer) => p.id === playerId);
    if (player && player.isStarter) {
      // O peso de impacto do jogador combinado com o peso da posição
      const positionWeight = POSITION_IMPACT_WEIGHTS[player.position] ?? 0.1;
      const reduction = player.impactWeight * positionWeight;
      totalAdjustment = totalAdjustment.times(new Decimal(1).minus(reduction));
    }
  }

  return new Decimal(baseLambda).times(totalAdjustment).toNumber();
}
