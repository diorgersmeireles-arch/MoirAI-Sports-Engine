/**
 * MoirAI Sports Engine — Scanner ao Vivo e Alertas Automatizados
 * Desenvolvido por MADev
 *
 * Sistema de filtragem avançada que analisa partidas ao vivo
 * e dispara alertas matemáticos quando thresholds específicos
 * são atingidos, gerando payloads formatados para Webhook.
 */

import type { LiveAnalytics, ScannerThreshold, NotificationPayload, AlertStatus } from '../types/sports';

// =============================================================================
// Interfaces Locais
// =============================================================================

export interface ScannedMatchResult {
  matchId: string;
  matchLabel: string;
  score: string;
  minute: number;
  analytics: LiveAnalytics;
  matchedThreshold: ScannerThreshold;
  matchScore: number; // Score de quanto a partida "bate" com o threshold (0-1)
}

export interface ScanResult {
  scanned: ScannedMatchResult[];
  totalMatchesAnalyzed: number;
  timestamp: number;
}

// =============================================================================
// Função Auxiliar
// =============================================================================

/**
 * Gera um ID único simples (fallback para ambientes sem crypto).
 */
function generateId(): string {
  try {
    // Tenta usar crypto.randomUUID se disponível
    return crypto.randomUUID();
  } catch {
    // Fallback: string aleatória simples
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// =============================================================================
// Scanner Principal
// =============================================================================

/**
 * Scanner ao vivo que filtra partidas atingindo thresholds matemáticos.
 *
 * Algoritmo:
 * 1. Para cada partida ao vivo, verifica se está dentro da janela de minutos
 * 2. Verifica se a diferença de gols está dentro do limite
 * 3. Verifica se o time-alvo tem xG acumulado acima do mínimo
 * 4. Verifica se o time-alvo tem ataques perigosos nos últimos 10 min acima do mínimo
 * 5. Calcula um score de correspondência (0-1) para ranqueamento
 *
 * @param liveAnalytics - Array de analytics de todas as partidas ao vivo
 * @param threshold - Thresholds configurados para o scan
 * @returns ScanResult com as partidas filtradas e ranqueadas
 */
export function liveScanner(
  liveAnalytics: LiveAnalytics[],
  threshold: ScannerThreshold
): ScanResult {
  const scanned: ScannedMatchResult[] = [];

  for (const analytics of liveAnalytics) {
    // Filtro 1: Janela de minutos
    if (analytics.minute < threshold.minMinute || analytics.minute > threshold.maxMinute) {
      continue;
    }

    // Filtro 2: Diferença de gols
    // Converte xG em "gols estimados" para verificar diferença
    // Nota: usamos o placar real (xG não é o placar, então para diferença
    // de gols precisamos dos gols reais. Aqui usamos projeção como proxy.)
    const goalDiff = Math.abs(analytics.xG.home - analytics.xG.away);
    if (goalDiff > threshold.maxGoalDifference) {
      continue;
    }

    // Filtro 3: xG acumulado mínimo para o time alvo
    if (threshold.targetTeam === 'home' || threshold.targetTeam === 'either') {
      if (analytics.xG.home < threshold.minXG) {
        // Se target for 'either' e home não atende, testa away
        if (threshold.targetTeam === 'either') {
          if (analytics.xG.away < threshold.minXG) continue;
        } else {
          continue;
        }
      }
    }
    if (threshold.targetTeam === 'away' || threshold.targetTeam === 'either') {
      if (analytics.xG.away < threshold.minXG) {
        if (threshold.targetTeam === 'either') {
          // Já testamos home e falhou, se chegou aqui os dois falharam
          continue;
        }
        continue;
      }
    }

    // Filtro 4: Ataques perigosos nos últimos 10 minutos
    const homeAttacksOk = analytics.dangerousAttacksLast10Min.home >= threshold.minDangerousAttacksLast10;
    const awayAttacksOk = analytics.dangerousAttacksLast10Min.away >= threshold.minDangerousAttacksLast10;

    if (threshold.targetTeam === 'home' && !homeAttacksOk) continue;
    if (threshold.targetTeam === 'away' && !awayAttacksOk) continue;
    if (threshold.targetTeam === 'either' && !homeAttacksOk && !awayAttacksOk) continue;

    // Todos os filtros passaram — calcular score de匹配
    const score = calculateMatchScore(analytics, threshold);

    // Identificar qual time está pressionando
    const pressingTeam = analytics.dangerousAttacksLast10Min.home >= analytics.dangerousAttacksLast10Min.away
      ? 'home' : 'away';

    const matchLabel = `Partida ${analytics.matchId}`;
    const scoreStr = `${Math.round(analytics.xG.home)}-${Math.round(analytics.xG.away)}`;

    scanned.push({
      matchId: analytics.matchId,
      matchLabel,
      score: scoreStr,
      minute: analytics.minute,
      analytics,
      matchedThreshold: threshold,
      matchScore: score,
    });
  }

  // Ordena por score (maior correspondência primeiro)
  scanned.sort((a, b) => b.matchScore - a.matchScore);

  return {
    scanned,
    totalMatchesAnalyzed: liveAnalytics.length,
    timestamp: Date.now(),
  };
}

/**
 * Calcula um score de correspondência (0-1) entre a partida e o threshold.
 * Quanto mais a partida excede os thresholds mínimos, maior o score.
 */
function calculateMatchScore(
  analytics: LiveAnalytics,
  threshold: ScannerThreshold
): number {
  let score = 0;
  let factors = 0;

  // Score baseado em quão dentro da janela de minutos está
  const minuteRange = threshold.maxMinute - threshold.minMinute;
  if (minuteRange > 0) {
    const minuteCenter = (threshold.minMinute + threshold.maxMinute) / 2;
    const minuteDistance = Math.abs(analytics.minute - minuteCenter);
    score += 1 - (minuteDistance / minuteRange);
    factors++;
  }

  // Score baseado em xG acima do mínimo
  const maxXG = Math.max(analytics.xG.home, analytics.xG.away);
  if (threshold.minXG > 0) {
    const xgRatio = Math.min(maxXG / threshold.minXG, 2); // cap em 2x
    score += Math.min((xgRatio - 1) / 1, 1);
    factors++;
  }

  // Score baseado em ataques perigosos acima do mínimo
  const maxAttacks = Math.max(
    analytics.dangerousAttacksLast10Min.home,
    analytics.dangerousAttacksLast10Min.away
  );
  if (threshold.minDangerousAttacksLast10 > 0) {
    const attackRatio = Math.min(maxAttacks / threshold.minDangerousAttacksLast10, 2);
    score += Math.min((attackRatio - 1) / 1, 1);
    factors++;
  }

  return factors > 0 ? score / factors : 0;
}

// =============================================================================
// Geração de Notificações
// =============================================================================

/**
 * Gera um payload de notificação estruturado para ser enviado
 * via Webhook para canais externos (Telegram, Discord, Slack).
 *
 * O payload inclui:
 * - Dados estruturados da partida e do alerta
 * - Mensagem formatada pronta para exibição
 * - Snapshot do analytics no momento do disparo
 *
 * @param match - Resultado do scan que disparou o alerta
 * @returns NotificationPayload completo e formatado
 */
export function generateNotificationPayload(
  match: ScannedMatchResult
): NotificationPayload {
  // Determina qual time está pressionando para a mensagem
  const { analytics } = match;
  const pressingTeam = analytics.dangerousAttacksLast10Min.home >= analytics.dangerousAttacksLast10Min.away
    ? 'Casa' : 'Visitante';

  // Monta mensagem formatada para Webhook
  const formattedMessage = [
    `⚡ *ALERTA DE SCAN — ${match.matchLabel}*`,
    ``,
    `⏱  Minuto: ${match.minute}'`,
    `📊 Placar (xG): ${analytics.xG.home.toFixed(2)} - ${analytics.xG.away.toFixed(2)}`,
    `🔥 Time pressionando: ${pressingTeam}`,
    `🎯 Ataques perigosos (últimos 10'): Casa ${analytics.dangerousAttacksLast10Min.home} × Visitante ${analytics.dangerousAttacksLast10Min.away}`,
    `📈 xG total: ${(analytics.xG.home + analytics.xG.away).toFixed(2)}`,
    `🎲 Probabilidades: ${(analytics.probabilities.homeWin * 100).toFixed(1)}% / ${(analytics.probabilities.draw * 100).toFixed(1)}% / ${(analytics.probabilities.awayWin * 100).toFixed(1)}%`,
    `🎯 Projeção total de gols: ${analytics.projectedTotalGoals.toFixed(2)}`,
    ``,
    `*Match Score: ${(match.matchScore * 100).toFixed(1)}%*`,
  ].join('\n');

  const payload: NotificationPayload = {
    id: generateId(),
    matchId: match.matchId,
    matchLabel: match.matchLabel,
    minute: match.minute,
    score: match.score,
    triggeredAt: new Date(),
    threshold: match.matchedThreshold,
    analyticsSnapshot: analytics,
    status: 'active' as AlertStatus,
    formattedMessage,
  };

  return payload;
}
