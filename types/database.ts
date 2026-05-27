// =============================================================================
// MoirAI Sports Engine — Tipagens do Banco de Dados
// Schema completo: Futebol, Vôlei, Basquete, Baseball
// Desenvolvido por MADev
// =============================================================================

export type SportType = 'football' | 'volleyball' | 'basketball' | 'baseball';
export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
export type MatchPeriod = 'first_half' | 'second_half' | 'extra_time' | 'penalties';
export type CardType = 'yellow' | 'red' | 'second_yellow';
export type FootballEventType = 'goal' | 'card' | 'substitution' | 'penalty' | 'own_goal';
export type VolleyballEventType = 'point' | 'block' | 'serve_ace' | 'attack_error' | 'substitution' | 'timeout';
export type BasketballEventType = 'two_pointer' | 'three_pointer' | 'free_throw' | 'rebound' | 'assist' | 'steal' | 'block' | 'foul' | 'turnover' | 'substitution' | 'timeout';
export type BaseballEventType = 'hit' | 'home_run' | 'strikeout' | 'walk' | 'error' | 'double_play' | 'stolen_base' | 'caught_stealing';
export type FoulType = 'personal' | 'technical' | 'flagrant' | 'offensive';
export type GoalType = 'open_play' | 'penalty' | 'free_kick' | 'corner' | 'header' | 'own_goal';
export type HitType = 'single' | 'double' | 'triple' | 'home_run';

// =============================================================================
// DOMÍNIO (Compartilhado)
// =============================================================================

export interface Sport {
  id: SportType;
  name: string;
  description?: string;
  icon?: string;
}

export interface Competition {
  id: string;
  sportId: SportType;
  name: string;
  shortName?: string;
  country?: string;
  organization?: string;
  logoUrl?: string;
  type?: 'league' | 'cup' | 'tournament' | 'friendly';
  createdAt: string;
}

export interface Season {
  id: string;
  competitionId: string;
  name: string;
  yearStart: number;
  yearEnd: number;
  isCurrent: boolean;
  startDate?: string;
  endDate?: string;
}

export interface Venue {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  capacity?: number;
  sportType?: SportType;
  latitude?: number;
  longitude?: number;
}

export interface Team {
  id: string;
  sportId: SportType;
  name: string;
  shortName?: string;
  country?: string;
  city?: string;
  foundedYear?: number;
  logoUrl?: string;
  venueId?: string;
}

export interface CompetitionTeam {
  id: string;
  competitionId: string;
  seasonId: string;
  teamId: string;
  groupName?: string;
}

export interface Player {
  id: string;
  sportId: SportType;
  fullName: string;
  shortName?: string;
  birthDate?: string;
  nationality?: string;
  heightCm?: number;
  weightKg?: number;
  imageUrl?: string;
  retired: boolean;
  metadata?: PlayerMetadata;
}

export type PlayerMetadata =
  | FootballPlayerMetadata
  | VolleyballPlayerMetadata
  | BasketballPlayerMetadata
  | BaseballPlayerMetadata;

export interface FootballPlayerMetadata {
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  preferredFoot: 'left' | 'right';
  shirtNumber?: number;
}

export interface VolleyballPlayerMetadata {
  position: 'outside_hitter' | 'opposite' | 'setter' | 'middle_blocker' | 'libero';
  reachCm: number;
  shirtNumber?: number;
}

export interface BasketballPlayerMetadata {
  position: 'point_guard' | 'shooting_guard' | 'small_forward' | 'power_forward' | 'center';
  wingspanCm?: number;
  jerseyNumber?: number;
}

export interface BaseballPlayerMetadata {
  primaryPosition: 'pitcher' | 'catcher' | 'first_base' | 'second_base' | 'shortstop' | 'third_base' | 'left_field' | 'center_field' | 'right_field' | 'designated_hitter';
  battingHand: 'left' | 'right' | 'switch';
  throwingHand: 'left' | 'right';
}

export interface TeamPlayer {
  id: string;
  teamId: string;
  playerId: string;
  seasonId: string;
  shirtNumber?: number;
  position?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

// =============================================================================
// PARTIDAS
// =============================================================================

export interface Match {
  id: string;
  sportId: SportType;
  competitionId: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  venueId?: string;
  round?: string;
  groupName?: string;
  status: MatchStatus;
  scheduledAt: string;
  startedAt?: string;
  finishedAt?: string;
  homeScore: number;
  awayScore: number;
  homeScoreExtra?: number;
  awayScoreExtra?: number;
  homeScorePenalties?: number;
  awayScorePenalties?: number;
  winnerTeamId?: string;
  attendance?: number;
  referee?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TABELAS DE FUTEBOL
// =============================================================================

export interface FootballMatchStats {
  matchId: string;
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeCorners: number;
  awayCorners: number;
  homeFouls: number;
  awayFouls: number;
  homeOffsides: number;
  awayOffsides: number;
  homeYellowCards: number;
  awayYellowCards: number;
  homeRedCards: number;
  awayRedCards: number;
  homeThrowIns: number;
  awayThrowIns: number;
  homeGoalKicks: number;
  awayGoalKicks: number;
  homeFreeKicks: number;
  awayFreeKicks: number;
  homeXg: number;
  awayXg: number;
  homeSaves: number;
  awaySaves: number;
  homePasses: number;
  awayPasses: number;
  homePassAccuracy: number;
  awayPassAccuracy: number;
  homeBallRecoveries: number;
  awayBallRecoveries: number;
  homeDribbles: number;
  awayDribbles: number;
  homeTackles: number;
  awayTackles: number;
  homeInterceptions: number;
  awayInterceptions: number;
  homeClearances: number;
  awayClearances: number;
  homeCrosses: number;
  awayCrosses: number;
}

export interface FootballEvent {
  id: string;
  matchId: string;
  teamId: string;
  playerId?: string;
  eventType: FootballEventType;
  minute: number;
  extraMinute?: number;
  period: MatchPeriod;
  scorerId?: string;
  assistId?: string;
  goalType?: GoalType;
  cardType?: CardType;
  cardReason?: string;
  playerOffId?: string;
  playerOnId?: string;
  substitutionReason?: 'tactical' | 'injury' | 'time_wasting';
  posX?: number;
  posY?: number;
  detail?: string;
  createdAt: string;
}

export interface FootballPlayerStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  dribbles: number;
  foulsCommitted: number;
  foulsSuffered: number;
  yellowCards: number;
  redCards: number;
  offsides: number;
  cornersTaken: number;
  crosses: number;
  saves: number;
  goalsConceded: number;
  rating: number;
}

// =============================================================================
// TABELAS DE VÔLEI
// =============================================================================

export interface VolleyballSet {
  id: string;
  matchId: string;
  setNumber: number;
  homeScore: number;
  awayScore: number;
  durationSeconds?: number;
}

export interface VolleyballMatchStats {
  matchId: string;
  homeAces: number;
  awayAces: number;
  homeBlocks: number;
  awayBlocks: number;
  homeAttacks: number;
  awayAttacks: number;
  homeAttackErrors: number;
  awayAttackErrors: number;
  homeKillPercentage: number;
  awayKillPercentage: number;
  homeDigs: number;
  awayDigs: number;
  homeAssists: number;
  awayAssists: number;
  homeServiceErrors: number;
  awayServiceErrors: number;
  homeReceptionErrors: number;
  awayReceptionErrors: number;
}

export interface VolleyballEvent {
  id: string;
  matchId: string;
  setId: string;
  teamId: string;
  playerId?: string;
  eventType: VolleyballEventType;
  pointHome: number;
  pointAway: number;
  rotation?: number;
  zone?: string;
  detail?: string;
  createdAt: string;
}

export interface VolleyballPlayerStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  setsPlayed: number;
  points: number;
  attacks: number;
  kills: number;
  attackErrors: number;
  attackPercentage: number;
  blocks: number;
  blockErrors: number;
  aces: number;
  serviceErrors: number;
  digs: number;
  receptionErrors: number;
  assists: number;
}

// =============================================================================
// TABELAS DE BASQUETE
// =============================================================================

export interface BasketballPeriod {
  id: string;
  matchId: string;
  periodNumber: number;
  periodType: 'quarter' | 'half' | 'overtime';
  homeScore: number;
  awayScore: number;
  durationSeconds?: number;
}

export interface BasketballMatchStats {
  matchId: string;
  homeFieldGoalsMade: number;
  awayFieldGoalsMade: number;
  homeFieldGoalsAttempted: number;
  awayFieldGoalsAttempted: number;
  homeThreeMade: number;
  awayThreeMade: number;
  homeThreeAttempted: number;
  awayThreeAttempted: number;
  homeFreeThrowsMade: number;
  awayFreeThrowsMade: number;
  homeFreeThrowsAttempted: number;
  awayFreeThrowsAttempted: number;
  homeReboundsOffensive: number;
  awayReboundsOffensive: number;
  homeReboundsDefensive: number;
  awayReboundsDefensive: number;
  homeAssists: number;
  awayAssists: number;
  homeSteals: number;
  awaySteals: number;
  homeBlocks: number;
  awayBlocks: number;
  homeTurnovers: number;
  awayTurnovers: number;
  homePersonalFouls: number;
  awayPersonalFouls: number;
  homeTechnicalFouls: number;
  awayTechnicalFouls: number;
  homeFlagrantFouls: number;
  awayFlagrantFouls: number;
  homeFastBreakPoints: number;
  awayFastBreakPoints: number;
  homePointsInPaint: number;
  awayPointsInPaint: number;
  homeSecondChancePoints: number;
  awaySecondChancePoints: number;
  homeBiggestLead: number;
  awayBiggestLead: number;
  homeTimeouts: number;
  awayTimeouts: number;
  homeFoulsTotal: number;
  awayFoulsTotal: number;
  homeFieldGoalPct: number;
  awayFieldGoalPct: number;
  homeThreePct: number;
  awayThreePct: number;
  homeFreeThrowPct: number;
  awayFreeThrowPct: number;
}

export interface BasketballEvent {
  id: string;
  matchId: string;
  periodId: string;
  teamId: string;
  playerId?: string;
  eventType: BasketballEventType;
  minute: number;
  secondsRemaining?: number;
  homeScore: number;
  awayScore: number;
  shotDistance?: number;
  shotZone?: string;
  shotMade?: boolean;
  assistedBy?: string;
  reboundType?: 'offensive' | 'defensive';
  foulType?: FoulType;
  posX?: number;
  posY?: number;
  detail?: string;
  createdAt: string;
}

export interface BasketballPlayerStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minutesPlayed: number;
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threeMade: number;
  threeAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  reboundsOffensive: number;
  reboundsDefensive: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  plusMinus: number;
  efficiency: number;
}

// =============================================================================
// TABELAS DE BASEBALL
// =============================================================================

export interface BaseballInning {
  id: string;
  matchId: string;
  inningNumber: number;
  isTop: boolean;
  homeScore: number;
  awayScore: number;
  runsScored: number;
  hits: number;
  errors: number;
  leftOnBase: number;
  durationSeconds?: number;
}

export interface BaseballMatchStats {
  matchId: string;
  homeRuns: number;
  awayRuns: number;
  homeHits: number;
  awayHits: number;
  homeErrors: number;
  awayErrors: number;
  homeWalks: number;
  awayWalks: number;
  homeStrikeouts: number;
  awayStrikeouts: number;
  homeHomeRuns: number;
  awayHomeRuns: number;
  homeDoubles: number;
  awayDoubles: number;
  homeTriples: number;
  awayTriples: number;
  homeStolenBases: number;
  awayStolenBases: number;
  homeCaughtStealing: number;
  awayCaughtStealing: number;
  homeDoublePlays: number;
  awayDoublePlays: number;
  homeLeftOnBase: number;
  awayLeftOnBase: number;
  homeAtBats: number;
  awayAtBats: number;
  homeBattingAvg: number;
  awayBattingAvg: number;
  homeOnBasePct: number;
  awayOnBasePct: number;
  homeSluggingPct: number;
  awaySluggingPct: number;
  homePitchesCount: number;
  awayPitchesCount: number;
  homeStrikes: number;
  awayStrikes: number;
  homeBalls: number;
  awayBalls: number;
}

export interface BaseballEvent {
  id: string;
  matchId: string;
  inningId: string;
  teamId: string;
  batterId?: string;
  pitcherId?: string;
  eventType: BaseballEventType;
  outs: number;
  balls: number;
  strikes: number;
  homeScore: number;
  awayScore: number;
  hitType?: HitType;
  rbi?: number;
  runnerOnFirst?: boolean;
  runnerOnSecond?: boolean;
  runnerOnThird?: boolean;
  pitchType?: string;
  pitchSpeedMph?: number;
  exitVelocity?: number;
  launchAngle?: number;
  hitDistance?: number;
  hitZone?: string;
  detail?: string;
  createdAt: string;
}

export interface BaseballBatterStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  leftOnBase: number;
  battingAvg: number;
  onBasePct: number;
  sluggingPct: number;
}

export interface BaseballPitcherStats {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  inningsPitched: number;
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeRunsAllowed: number;
  pitchesCount: number;
  strikesCount: number;
  battersFaced: number;
  win: boolean;
  loss: boolean;
  save: boolean;
  era: number;
  whip: number;
}

// =============================================================================
// CLASSIFICAÇÃO
// =============================================================================

export interface Standing {
  id: string;
  competitionId: string;
  seasonId: string;
  teamId: string;
  groupName?: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  extraStats?: Record<string, unknown>;
}

// =============================================================================
// CARTÕES DISCIPLINARES DO ATLETA
// =============================================================================

export type CardSeverity = 'soft' | 'hard' | 'violent' | 'technical' | 'professional';

export interface PlayerCard {
  id: string;
  playerId: string;
  matchId: string;
  teamId: string;
  cardType: CardType;
  severity?: CardSeverity;
  minute: number;
  period?: MatchPeriod;
  reason?: string;
  opponentId?: string;
  competitionId?: string;
  seasonId?: string;
  suspensionMatches: number;
  fineAmount?: number;
  createdAt: string;
}

// =============================================================================
// ATRIBUTOS DO ATLETA (Gráfico Teia / Spider Chart)
// =============================================================================

export interface PlayerAttributes {
  id: string;
  playerId: string;
  sportId: SportType;
  seasonId?: string;
  measuredAt: string;
  overall: number;
  potential?: number;
  pace?: number;
  acceleration?: number;
  stamina?: number;
  strength?: number;
  agility?: number;
  balance?: number;
  jumping?: number;
  reaction?: number;
  dribbling?: number;
  passing?: number;
  shooting?: number;
  finishing?: number;
  longShots?: number;
  crossing?: number;
  heading?: number;
  marking?: number;
  tackling?: number;
  interceptions?: number;
  vision?: number;
  composure?: number;
  positioning?: number;
  decisionMaking?: number;
  teamwork?: number;
  leadership?: number;
  aggression?: number;
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  extraAttributes?: Record<string, number>;
  isActive: boolean;
  createdAt: string;
}

// =============================================================================
// RADAR / SPIDER CHART
// =============================================================================

export interface PlayerRadarAxis {
  label: string;
  value: number;
  max: number;
}

export interface PlayerRadarData {
  playerId: string;
  fullName: string;
  sportId: SportType;
  overall: number;
  potential?: number;
  axes: PlayerRadarAxis[];
  measuredAt: string;
}

export interface PlayerRadarFootball {
  playerId: string;
  fullName: string;
  shortName?: string;
  nationality?: string;
  age: number;
  heightCm?: number;
  weightKg?: number;
  position?: string;
  overallRating: number;
  potential?: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  stamina?: number;
  vision?: number;
  aggression?: number;
  agility?: number;
  acceleration?: number;
  leadership?: number;
  composure?: number;
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  spider6: Record<string, number>;
  spider12: Record<string, number>;
  measuredAt: string;
}

export interface PlayerRadarBasketball {
  playerId: string;
  fullName: string;
  shortName?: string;
  age: number;
  heightCm?: number;
  weightKg?: number;
  position?: string;
  overallRating: number;
  speed: number;
  shooting: number;
  passing: number;
  ballHandling: number;
  defense: number;
  athleticism: number;
  jumping?: number;
  stamina?: number;
  agility?: number;
  vision?: number;
  leadership?: number;
  spiderData: Record<string, number>;
}

export interface PlayerRadarVolleyball {
  playerId: string;
  fullName: string;
  shortName?: string;
  age: number;
  heightCm?: number;
  weightKg?: number;
  position?: string;
  reachCm?: number;
  overallRating: number;
  attacking: number;
  blocking: number;
  serving: number;
  setting: number;
  digging: number;
  physical: number;
  jumping?: number;
  stamina?: number;
  reflexes?: number;
  courtVision?: number;
  leadership?: number;
  spiderData: Record<string, number>;
}

export interface PlayerRadarBaseball {
  playerId: string;
  fullName: string;
  shortName?: string;
  age: number;
  heightCm?: number;
  weightKg?: number;
  position?: string;
  battingHand?: string;
  throwingHand?: string;
  overallRating: number;
  powerHitting: number;
  contact: number;
  speed: number;
  pitching: number;
  fielding: number;
  armStrength: number;
  agility?: number;
  reflexes?: number;
  vision?: number;
  composure?: number;
  leadership?: number;
  spiderData: Record<string, number>;
}

// =============================================================================
// PERFIL COMPLETO DO ATLETA
// =============================================================================

export interface PlayerProfile {
  id: string;
  fullName: string;
  shortName?: string;
  sportId: SportType;
  nationality?: string;
  heightCm?: number;
  weightKg?: number;
  age: number;
  metadata?: PlayerMetadata;
  overall?: number;
  potential?: number;
  attributesDate?: string;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  stamina?: number;
  vision?: number;
  agility?: number;
  leadership?: number;
  spiderChart: Record<string, number>;
  totalYellowCards: number;
  totalRedCards: number;
  currentTeam?: string;
  retired: boolean;
  imageUrl?: string;
}
