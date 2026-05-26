/**
 * MoirAI Sports Engine — Tipagens Estritas do Domínio Esportivo
 * Desenvolvido por MADev
 *
 * Este módulo define todos os contratos de dados da plataforma.
 * Nenhum tipo 'any' é permitido — tipagem exaustiva obrigatória.
 */

// =============================================================================
// Enums
// =============================================================================

/** Status de uma partida no ciclo de vida */
export enum MatchStatus {
  Scheduled = 'scheduled',
  Live = 'live',
  Finished = 'finished',
  Postponed = 'postponed',
  Cancelled = 'cancelled',
}

/** Posições dos jogadores em campo para ponderação de impacto */
export enum PlayerPosition {
  Goalkeeper = 'gk',
  Defender = 'def',
  Midfielder = 'mid',
  Forward = 'fwd',
}

/** Tipo de cartão disciplinar */
export enum CardType {
  Yellow = 'yellow',
  Red = 'red',
  SecondYellow = 'second_yellow',
}

/** Lado do mercado Over/Under */
export enum OverUnderLine {
  OnePointFive = 1.5,
  TwoPointFive = 2.5,
  ThreePointFive = 3.5,
  FourPointFive = 4.5,
}

/** Status de um alerta gerado pelo scanner */
export enum AlertStatus {
  Active = 'active',
  Expired = 'expired',
  Triggered = 'triggered',
}

// =============================================================================
// Interfaces Base
// =============================================================================

/** Estatísticas agregadas de um time (geral, casa ou fora) */
export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
}

/** Resultado de uma partida para computar forma recente */
export interface RecentResult {
  matchId: string;
  date: Date;
  opponentId: string;
  isHome: boolean;
  goalsScored: number;
  goalsConceded: number;
  outcome: 'W' | 'D' | 'L';
}

/** Jogador presente na escalação */
export interface LineupPlayer {
  id: string;
  name: string;
  position: PlayerPosition;
  jerseyNumber: number;
  isStarter: boolean;
  /** Peso de impacto (0-1) para o modelo preditivo — default 1.0 para titulares */
  impactWeight: number;
}

/** Escalação oficial de um time */
export interface Lineup {
  formation: string; // ex: "4-3-3"
  players: LineupPlayer[];
  missingKeyPlayers: string[]; // IDs de jogadores importantes ausentes
}

// =============================================================================
// Entidades Principais
// =============================================================================

/** Time / Clube */
export interface Team {
  id: string;
  name: string;
  shortName: string;
  shieldUrl: string;
  stats: {
    overall: TeamStats;
    home: TeamStats;
    away: TeamStats;
  };
  recentForm: RecentResult[];
  /** Última atualização das estatísticas */
  updatedAt: Date;
}

/** Placar atual de uma partida */
export interface Score {
  home: number;
  away: number;
  /** Placar ao final do primeiro tempo */
  halftime?: { home: number; away: number } | null;
}

/** Evento ocorrido durante a partida */
export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'card' | 'substitution' | 'penalty' | 'own_goal' | 'injury';
  team: 'home' | 'away';
  playerId?: string | null;
  playerName?: string | null;
  detail?: string | null; // ex: "Golaço de fora da área"
}

/** Partida completa */
export interface Match {
  id: string;
  competitionId: string;
  date: Date;
  status: MatchStatus;
  minute: number; // minutos decorridos (0-90+)
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  homeLineup: Lineup;
  awayLineup: Lineup;
  events: MatchEvent[];
  /** Estatísticas acumuladas da partida */
  stats: MatchStats;
  /** Odds atuais do mercado para esta partida */
  odds: BettingOdds;
}

/** Estatísticas cumulativas de uma partida em andamento */
export interface MatchStats {
  possession: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  shotsOffTarget: { home: number; away: number };
  dangerousAttacks: { home: number; away: number };
  totalAttacks: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  offsides: { home: number; away: number };
}

/** Classificação de uma competição */
export interface StandingsEntry {
  teamId: string;
  teamName: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  points: number;
  recentForm: string; // ex: "WDLWW"
}

/** Competição / Campeonato */
export interface Competition {
  id: string;
  name: string;
  country: string;
  season: string; // ex: "2025/2026"
  division: number;
  standings: StandingsEntry[];
}

// =============================================================================
// Analytics ao Vivo
// =============================================================================

/** Probabilidades ao vivo calculadas pelo motor de previsão */
export interface LiveProbabilities {
  homeWin: number;   // 0-1
  draw: number;      // 0-1
  awayWin: number;   // 0-1
  /** Timestamp do cálculo */
  calculatedAt: number;
}

/** Métricas de xG (Expected Goals) */
export interface ExpectedGoals {
  home: number;
  away: number;
  /** Array com xG por minuto para gráfico de linha */
  perMinute: { minute: number; home: number; away: number }[];
}

/** Analytics completo ao vivo */
export interface LiveAnalytics {
  matchId: string;
  minute: number;
  probabilities: LiveProbabilities;
  possession: { home: number; away: number };
  dangerousAttacks: { home: number; away: number };
  shotsOnGoal: { home: number; away: number };
  cards: {
    yellow: { home: number; away: number };
    red: { home: number; away: number };
  };
  xG: ExpectedGoals;
  /** Projeção atualizada de gols totais esperados até o fim */
  projectedTotalGoals: number;
  /** Ataques perigosos nos últimos 10 minutos (para scanner) */
  dangerousAttacksLast10Min: { home: number; away: number };
}

// =============================================================================
// Mercado de Odds
// =============================================================================

/** Odds de um mercado específico */
export interface MarketOdds {
  home: number;
  draw: number;
  away: number;
}

/** Odds Over/Under para diferentes linhas */
export interface OverUnderOdds {
  over: number;
  under: number;
}

/** Odds completas do mercado */
export interface BettingOdds {
  matchId: string;
  moneyline: MarketOdds;
  overUnder: Record<OverUnderLine, OverUnderOdds>;
  /** Timestamp de quando as odds foram capturadas */
  capturedAt: Date;
  /** Casa de apostas de origem */
  bookmaker: string;
}

// =============================================================================
// Scanner e Alertas
// =============================================================================

/** Thresholds configuráveis para o scanner ao vivo */
export interface ScannerThreshold {
  minMinute: number;
  maxMinute: number;
  maxGoalDifference: number; // diferença máxima de gols (ex: 0 ou 1)
  minXG: number;             // xG acumulado mínimo do time pressionando
  minDangerousAttacksLast10: number;
  /** Time a ser observado: 'home' | 'away' | 'either' */
  targetTeam: 'home' | 'away' | 'either';
}

/** Payload de notificação gerado pelo scanner */
export interface NotificationPayload {
  id: string;
  matchId: string;
  matchLabel: string; // ex: "Flamengo vs Palmeiras"
  minute: number;
  score: string;      // ex: "1-0"
  triggeredAt: Date;
  threshold: ScannerThreshold;
  analyticsSnapshot: LiveAnalytics;
  status: AlertStatus;
  /** Mensagem formatada para Webhook */
  formattedMessage: string;
}

// =============================================================================
// WebSocket Payloads
// =============================================================================

/** Mensagem recebida via WebSocket do provedor de dados */
export interface WebSocketMessage {
  type: 'analytics_update' | 'match_update' | 'odds_update' | 'lineup_update';
  matchId: string;
  timestamp: number;
  data: LiveAnalytics | Match | BettingOdds | Lineup;
}

// =============================================================================
// Utility Types
// =============================================================================

/** Garante que um objeto tenha exatamente uma de duas chaves */
export type Either<A, B> = { [K in keyof A]: A[K] } & { [K in keyof B]?: never } | { [K in keyof B]: B[K] } & { [K in keyof A]?: never };

/** Resultado genérico de operação (Either monad simplificado) */
export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };
