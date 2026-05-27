import type {
  Competition, Season, Team, Player, Match, Standing,
  FootballMatchStats, FootballPlayerStats, PlayerAttributes,
  PlayerCard, Staff, TeamStaff, PlayerInjury, Transfer,
  MatchLineup, LineupPlayer, Ranking, MediaAsset, Odds,
  Organization, Tenant, TenantUser, TenantPermission,
  MatchStateSnapshot, SportEvent, EntityEmbedding,
  EntityTenant, GraphNode, GraphEdge, MlFeature,
} from '../types/database';

export const competitions: Competition[] = [
  { id: 'c1', sportId: 'football', name: 'Campeonato Brasileiro Série A', shortName: 'Brasileirão', country: 'Brasil', type: 'league', createdAt: '2020-01-01T00:00:00Z' },
  { id: 'c2', sportId: 'football', name: 'Copa do Brasil', shortName: 'Copa BR', country: 'Brasil', type: 'cup', createdAt: '2020-01-01T00:00:00Z' },
  { id: 'c3', sportId: 'football', name: 'Copa Libertadores', shortName: 'Libertadores', country: 'América do Sul', type: 'tournament', createdAt: '2020-01-01T00:00:00Z' },
  { id: 'c4', sportId: 'football', name: 'Campeonato Paulista', shortName: 'Paulistão', country: 'Brasil', type: 'league', createdAt: '2020-01-01T00:00:00Z' },
  { id: 'c5', sportId: 'basketball', name: 'NBA', shortName: 'NBA', country: 'EUA', type: 'league', createdAt: '2020-01-01T00:00:00Z' },
];

export const seasons: Season[] = [
  { id: 's2025', competitionId: 'c1', name: '2025', yearStart: 2025, yearEnd: 2025, isCurrent: true, startDate: '2025-04-13', endDate: '2025-12-07' },
  { id: 's2024', competitionId: 'c1', name: '2024', yearStart: 2024, yearEnd: 2024, isCurrent: false, startDate: '2024-04-14', endDate: '2024-12-08' },
  { id: 's2023', competitionId: 'c1', name: '2023', yearStart: 2023, yearEnd: 2023, isCurrent: false, startDate: '2023-04-15', endDate: '2023-12-03' },
  { id: 's2025cl', competitionId: 'c3', name: '2025', yearStart: 2025, yearEnd: 2025, isCurrent: true, startDate: '2025-02-04', endDate: '2025-11-29' },
];

export const teams: Team[] = [
  { id: 't1', sportId: 'football', name: 'Flamengo', shortName: 'FLA', country: 'Brasil', city: 'Rio de Janeiro', foundedYear: 1895 },
  { id: 't2', sportId: 'football', name: 'Palmeiras', shortName: 'PAL', country: 'Brasil', city: 'São Paulo', foundedYear: 1914 },
  { id: 't3', sportId: 'football', name: 'São Paulo', shortName: 'SAO', country: 'Brasil', city: 'São Paulo', foundedYear: 1930 },
  { id: 't4', sportId: 'football', name: 'Corinthians', shortName: 'COR', country: 'Brasil', city: 'São Paulo', foundedYear: 1910 },
  { id: 't5', sportId: 'football', name: 'Grêmio', shortName: 'GRE', country: 'Brasil', city: 'Porto Alegre', foundedYear: 1903 },
  { id: 't6', sportId: 'football', name: 'Internacional', shortName: 'INT', country: 'Brasil', city: 'Porto Alegre', foundedYear: 1909 },
  { id: 't7', sportId: 'football', name: 'Santos', shortName: 'SAN', country: 'Brasil', city: 'Santos', foundedYear: 1912 },
  { id: 't8', sportId: 'football', name: 'Cruzeiro', shortName: 'CRU', country: 'Brasil', city: 'Belo Horizonte', foundedYear: 1921 },
  { id: 't9', sportId: 'football', name: 'Atlético Mineiro', shortName: 'CAM', country: 'Brasil', city: 'Belo Horizonte', foundedYear: 1908 },
  { id: 't10', sportId: 'football', name: 'Botafogo', shortName: 'BOT', country: 'Brasil', city: 'Rio de Janeiro', foundedYear: 1904 },
  { id: 't11', sportId: 'football', name: 'Fluminense', shortName: 'FLU', country: 'Brasil', city: 'Rio de Janeiro', foundedYear: 1902 },
  { id: 't12', sportId: 'football', name: 'Bahia', shortName: 'BAH', country: 'Brasil', city: 'Salvador', foundedYear: 1931 },
];

export const players: Player[] = [
  { id: 'p1', sportId: 'football', fullName: 'Gabriel Barbosa', shortName: 'Gabigol', birthDate: '1996-08-30', nationality: 'Brasil', heightCm: 178, weightKg: 76, retired: false, metadata: { position: 'forward', preferredFoot: 'right', shirtNumber: 10 } },
  { id: 'p2', sportId: 'football', fullName: 'Arrascaeta', shortName: 'Arrascaeta', birthDate: '1994-06-01', nationality: 'Uruguai', heightCm: 172, weightKg: 68, retired: false, metadata: { position: 'midfielder', preferredFoot: 'left', shirtNumber: 14 } },
  { id: 'p3', sportId: 'football', fullName: 'Pedro', shortName: 'Pedro', birthDate: '1997-06-20', nationality: 'Brasil', heightCm: 185, weightKg: 80, retired: false, metadata: { position: 'forward', preferredFoot: 'right', shirtNumber: 9 } },
  { id: 'p4', sportId: 'football', fullName: 'Raphael Veiga', shortName: 'Veiga', birthDate: '1995-06-19', nationality: 'Brasil', heightCm: 176, weightKg: 72, retired: false, metadata: { position: 'midfielder', preferredFoot: 'left', shirtNumber: 23 } },
  { id: 'p5', sportId: 'football', fullName: 'Dudu', shortName: 'Dudu', birthDate: '1992-01-07', nationality: 'Brasil', heightCm: 166, weightKg: 63, retired: false, metadata: { position: 'forward', preferredFoot: 'right', shirtNumber: 7 } },
  { id: 'p6', sportId: 'football', fullName: 'Calleri', shortName: 'Calleri', birthDate: '1993-09-23', nationality: 'Argentina', heightCm: 179, weightKg: 75, retired: false, metadata: { position: 'forward', preferredFoot: 'right', shirtNumber: 9 } },
  { id: 'p7', sportId: 'football', fullName: 'Luciano', shortName: 'Luciano', birthDate: '1993-05-15', nationality: 'Brasil', heightCm: 178, weightKg: 73, retired: false, metadata: { position: 'forward', preferredFoot: 'right', shirtNumber: 10 } },
  { id: 'p8', sportId: 'football', fullName: 'Yuri Alberto', shortName: 'Yuri', birthDate: '2001-03-18', nationality: 'Brasil', heightCm: 182, weightKg: 77, retired: false, metadata: { position: 'forward', preferredFoot: 'right', shirtNumber: 9 } },
  { id: 'p9', sportId: 'football', fullName: 'Suárez', shortName: 'Suárez', birthDate: '1987-01-24', nationality: 'Uruguai', heightCm: 182, weightKg: 83, retired: false, metadata: { position: 'forward', preferredFoot: 'right', shirtNumber: 9 } },
  { id: 'p10', sportId: 'football', fullName: 'De Arrascaeta', shortName: 'Arrasca', birthDate: '1994-06-01', nationality: 'Uruguai', heightCm: 172, weightKg: 68, retired: false, metadata: { position: 'midfielder', preferredFoot: 'left', shirtNumber: 10 } },
];

export const matches: Match[] = [
  { id: 'm1', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't1', awayTeamId: 't2', status: 'finished', scheduledAt: '2025-04-13T16:00:00Z', startedAt: '2025-04-13T16:00:00Z', finishedAt: '2025-04-13T17:50:00Z', homeScore: 2, awayScore: 1, round: '1', attendance: 58972, referee: 'Wilton Sampaio', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-13T17:50:00Z' },
  { id: 'm2', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't3', awayTeamId: 't4', status: 'finished', scheduledAt: '2025-04-13T19:00:00Z', startedAt: '2025-04-13T19:00:00Z', finishedAt: '2025-04-13T20:50:00Z', homeScore: 3, awayScore: 0, round: '1', attendance: 55000, referee: 'Raphael Claus', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-13T20:50:00Z' },
  { id: 'm3', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't5', awayTeamId: 't6', status: 'finished', scheduledAt: '2025-04-14T16:00:00Z', startedAt: '2025-04-14T16:00:00Z', finishedAt: '2025-04-14T17:50:00Z', homeScore: 1, awayScore: 1, round: '1', attendance: 41230, referee: 'Anderson Daronco', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-14T17:50:00Z' },
  { id: 'm4', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't7', awayTeamId: 't8', status: 'finished', scheduledAt: '2025-04-14T19:00:00Z', startedAt: '2025-04-14T19:00:00Z', finishedAt: '2025-04-14T20:50:00Z', homeScore: 0, awayScore: 2, round: '1', attendance: 28900, referee: 'Bruno Arleu', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-14T20:50:00Z' },
  { id: 'm5', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't9', awayTeamId: 't10', status: 'live', scheduledAt: '2025-04-16T21:30:00Z', startedAt: '2025-04-16T21:30:00Z', homeScore: 1, awayScore: 0, round: '2', attendance: 35000, referee: 'Marcelo de Lima', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-16T21:30:00Z' },
  { id: 'm6', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't11', awayTeamId: 't12', status: 'scheduled', scheduledAt: '2025-04-17T20:00:00Z', homeScore: 0, awayScore: 0, round: '2', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  { id: 'm7', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't1', awayTeamId: 't4', status: 'scheduled', scheduledAt: '2025-04-20T16:00:00Z', homeScore: 0, awayScore: 0, round: '3', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  { id: 'm8', sportId: 'football', competitionId: 'c1', seasonId: 's2025', homeTeamId: 't2', awayTeamId: 't5', status: 'scheduled', scheduledAt: '2025-04-20T19:00:00Z', homeScore: 0, awayScore: 0, round: '3', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  { id: 'm9', sportId: 'football', competitionId: 'c1', seasonId: 's2024', homeTeamId: 't2', awayTeamId: 't1', status: 'finished', scheduledAt: '2024-12-08T16:00:00Z', homeScore: 2, awayScore: 0, round: '38', attendance: 41500, referee: 'Anderson Daronco', createdAt: '2024-11-01T00:00:00Z', updatedAt: '2024-12-08T16:50:00Z' },
  { id: 'm10', sportId: 'football', competitionId: 'c1', seasonId: 's2024', homeTeamId: 't3', awayTeamId: 't7', status: 'finished', scheduledAt: '2024-12-08T16:00:00Z', homeScore: 2, awayScore: 1, round: '38', attendance: 52000, referee: 'Wilton Sampaio', createdAt: '2024-11-01T00:00:00Z', updatedAt: '2024-12-08T16:50:00Z' },
];

export const standings2024: Standing[] = [
  { id: 'st1', competitionId: 'c1', seasonId: 's2024', teamId: 't2', position: 1, played: 38, wins: 24, draws: 8, losses: 6, points: 80, goalsFor: 62, goalsAgainst: 26, goalDifference: 36 },
  { id: 'st2', competitionId: 'c1', seasonId: 's2024', teamId: 't1', position: 2, played: 38, wins: 22, draws: 9, losses: 7, points: 75, goalsFor: 59, goalsAgainst: 31, goalDifference: 28 },
  { id: 'st3', competitionId: 'c1', seasonId: 's2024', teamId: 't3', position: 3, played: 38, wins: 20, draws: 10, losses: 8, points: 70, goalsFor: 55, goalsAgainst: 33, goalDifference: 22 },
  { id: 'st4', competitionId: 'c1', seasonId: 's2024', teamId: 't4', position: 4, played: 38, wins: 18, draws: 12, losses: 8, points: 66, goalsFor: 48, goalsAgainst: 35, goalDifference: 13 },
  { id: 'st5', competitionId: 'c1', seasonId: 's2024', teamId: 't5', position: 5, played: 38, wins: 17, draws: 10, losses: 11, points: 61, goalsFor: 44, goalsAgainst: 38, goalDifference: 6 },
  { id: 'st6', competitionId: 'c1', seasonId: 's2024', teamId: 't6', position: 6, played: 38, wins: 16, draws: 11, losses: 11, points: 59, goalsFor: 42, goalsAgainst: 37, goalDifference: 5 },
  { id: 'st7', competitionId: 'c1', seasonId: 's2024', teamId: 't10', position: 7, played: 38, wins: 15, draws: 12, losses: 11, points: 57, goalsFor: 51, goalsAgainst: 43, goalDifference: 8 },
  { id: 'st8', competitionId: 'c1', seasonId: 's2024', teamId: 't11', position: 8, played: 38, wins: 14, draws: 13, losses: 11, points: 55, goalsFor: 43, goalsAgainst: 40, goalDifference: 3 },
  { id: 'st9', competitionId: 'c1', seasonId: 's2024', teamId: 't9', position: 9, played: 38, wins: 13, draws: 12, losses: 13, points: 51, goalsFor: 38, goalsAgainst: 41, goalDifference: -3 },
  { id: 'st10', competitionId: 'c1', seasonId: 's2024', teamId: 't12', position: 10, played: 38, wins: 13, draws: 10, losses: 15, points: 49, goalsFor: 40, goalsAgainst: 45, goalDifference: -5 },
];

export const matchStats: Record<string, FootballMatchStats> = {
  m1: {
    matchId: 'm1', homePossession: 54, awayPossession: 46,
    homeShots: 15, awayShots: 9, homeShotsOnTarget: 7, awayShotsOnTarget: 3,
    homeCorners: 8, awayCorners: 3, homeFouls: 12, awayFouls: 16,
    homeOffsides: 2, awayOffsides: 1, homeYellowCards: 2, awayYellowCards: 4,
    homeRedCards: 0, awayRedCards: 0, homeThrowIns: 22, awayThrowIns: 18,
    homeGoalKicks: 5, awayGoalKicks: 8, homeFreeKicks: 14, awayFreeKicks: 10,
    homeXg: 2.3, awayXg: 1.1, homeSaves: 2, awaySaves: 5,
    homePasses: 482, awayPasses: 398, homePassAccuracy: 87, awayPassAccuracy: 82,
    homeBallRecoveries: 45, awayBallRecoveries: 38, homeDribbles: 12, awayDribbles: 8,
    homeTackles: 18, awayTackles: 24, homeInterceptions: 10, awayInterceptions: 14,
    homeClearances: 15, awayClearances: 22, homeCrosses: 24, awayCrosses: 16,
  },
  m2: {
    matchId: 'm2', homePossession: 61, awayPossession: 39,
    homeShots: 18, awayShots: 6, homeShotsOnTarget: 9, awayShotsOnTarget: 1,
    homeCorners: 10, awayCorners: 2, homeFouls: 10, awayFouls: 14,
    homeOffsides: 3, awayOffsides: 2, homeYellowCards: 1, awayYellowCards: 3,
    homeRedCards: 0, awayRedCards: 0, homeThrowIns: 20, awayThrowIns: 15,
    homeGoalKicks: 3, awayGoalKicks: 10, homeFreeKicks: 12, awayFreeKicks: 8,
    homeXg: 3.1, awayXg: 0.5, homeSaves: 1, awaySaves: 6,
    homePasses: 534, awayPasses: 312, homePassAccuracy: 90, awayPassAccuracy: 76,
    homeBallRecoveries: 42, awayBallRecoveries: 35, homeDribbles: 15, awayDribbles: 5,
    homeTackles: 14, awayTackles: 20, homeInterceptions: 8, awayInterceptions: 16,
    homeClearances: 10, awayClearances: 28, homeCrosses: 20, awayCrosses: 12,
  },
  m3: {
    matchId: 'm3', homePossession: 48, awayPossession: 52,
    homeShots: 10, awayShots: 12, homeShotsOnTarget: 4, awayShotsOnTarget: 5,
    homeCorners: 5, awayCorners: 6, homeFouls: 15, awayFouls: 13,
    homeOffsides: 2, awayOffsides: 1, homeYellowCards: 3, awayYellowCards: 2,
    homeRedCards: 0, awayRedCards: 0, homeThrowIns: 19, awayThrowIns: 21,
    homeGoalKicks: 7, awayGoalKicks: 6, homeFreeKicks: 11, awayFreeKicks: 13,
    homeXg: 1.2, awayXg: 1.4, homeSaves: 4, awaySaves: 3,
    homePasses: 405, awayPasses: 445, homePassAccuracy: 83, awayPassAccuracy: 85,
    homeBallRecoveries: 40, awayBallRecoveries: 42, homeDribbles: 9, awayDribbles: 10,
    homeTackles: 22, awayTackles: 19, homeInterceptions: 12, awayInterceptions: 11,
    homeClearances: 20, awayClearances: 18, homeCrosses: 18, awayCrosses: 20,
  },
  m4: {
    matchId: 'm4', homePossession: 56, awayPossession: 44,
    homeShots: 11, awayShots: 13, homeShotsOnTarget: 3, awayShotsOnTarget: 6,
    homeCorners: 7, awayCorners: 5, homeFouls: 14, awayFouls: 11,
    homeOffsides: 4, awayOffsides: 0, homeYellowCards: 2, awayYellowCards: 1,
    homeRedCards: 0, awayRedCards: 0, homeThrowIns: 17, awayThrowIns: 20,
    homeGoalKicks: 9, awayGoalKicks: 5, homeFreeKicks: 10, awayFreeKicks: 12,
    homeXg: 0.8, awayXg: 2.1, homeSaves: 4, awaySaves: 3,
    homePasses: 456, awayPasses: 378, homePassAccuracy: 84, awayPassAccuracy: 80,
    homeBallRecoveries: 36, awayBallRecoveries: 44, homeDribbles: 7, awayDribbles: 11,
    homeTackles: 16, awayTackles: 21, homeInterceptions: 9, awayInterceptions: 13,
    homeClearances: 24, awayClearances: 16, homeCrosses: 15, awayCrosses: 22,
  },
  m5: {
    matchId: 'm5', homePossession: 58, awayPossession: 42,
    homeShots: 13, awayShots: 8, homeShotsOnTarget: 5, awayShotsOnTarget: 2,
    homeCorners: 7, awayCorners: 4, homeFouls: 11, awayFouls: 14,
    homeOffsides: 1, awayOffsides: 3, homeYellowCards: 1, awayYellowCards: 2,
    homeRedCards: 0, awayRedCards: 0, homeThrowIns: 21, awayThrowIns: 17,
    homeGoalKicks: 4, awayGoalKicks: 7, homeFreeKicks: 13, awayFreeKicks: 11,
    homeXg: 1.8, awayXg: 0.9, homeSaves: 2, awaySaves: 4,
    homePasses: 502, awayPasses: 356, homePassAccuracy: 88, awayPassAccuracy: 79,
    homeBallRecoveries: 43, awayBallRecoveries: 37, homeDribbles: 11, awayDribbles: 7,
    homeTackles: 17, awayTackles: 22, homeInterceptions: 9, awayInterceptions: 15,
    homeClearances: 14, awayClearances: 24, homeCrosses: 22, awayCrosses: 14,
  },
};

export const playerStats: Record<string, FootballPlayerStats[]> = {
  m1: [
    { id: 'ps1', matchId: 'm1', playerId: 'p1', teamId: 't1', minutesPlayed: 90, goals: 1, assists: 0, shots: 4, shotsOnTarget: 3, passes: 32, passAccuracy: 84, tackles: 0, interceptions: 1, clearances: 2, dribbles: 5, foulsCommitted: 2, foulsSuffered: 3, yellowCards: 0, redCards: 0, offsides: 1, cornersTaken: 0, crosses: 2, saves: 0, goalsConceded: 0, rating: 7.8 },
    { id: 'ps2', matchId: 'm1', playerId: 'p2', teamId: 't1', minutesPlayed: 82, goals: 0, assists: 1, shots: 2, shotsOnTarget: 1, passes: 48, passAccuracy: 91, tackles: 2, interceptions: 3, clearances: 0, dribbles: 6, foulsCommitted: 1, foulsSuffered: 4, yellowCards: 0, redCards: 0, offsides: 0, cornersTaken: 3, crosses: 8, saves: 0, goalsConceded: 0, rating: 8.2 },
    { id: 'ps3', matchId: 'm1', playerId: 'p4', teamId: 't2', minutesPlayed: 90, goals: 1, assists: 0, shots: 3, shotsOnTarget: 2, passes: 38, passAccuracy: 86, tackles: 1, interceptions: 2, clearances: 1, dribbles: 3, foulsCommitted: 3, foulsSuffered: 1, yellowCards: 1, redCards: 0, offsides: 0, cornersTaken: 2, crosses: 5, saves: 0, goalsConceded: 0, rating: 7.2 },
  ],
  m2: [
    { id: 'ps4', matchId: 'm2', playerId: 'p6', teamId: 't3', minutesPlayed: 78, goals: 2, assists: 0, shots: 5, shotsOnTarget: 4, passes: 22, passAccuracy: 77, tackles: 0, interceptions: 0, clearances: 0, dribbles: 2, foulsCommitted: 1, foulsSuffered: 0, yellowCards: 0, redCards: 0, offsides: 1, cornersTaken: 0, crosses: 1, saves: 0, goalsConceded: 0, rating: 8.9 },
    { id: 'ps5', matchId: 'm2', playerId: 'p7', teamId: 't3', minutesPlayed: 90, goals: 1, assists: 1, shots: 3, shotsOnTarget: 2, passes: 41, passAccuracy: 88, tackles: 1, interceptions: 2, clearances: 1, dribbles: 4, foulsCommitted: 0, foulsSuffered: 2, yellowCards: 0, redCards: 0, offsides: 0, cornersTaken: 1, crosses: 4, saves: 0, goalsConceded: 0, rating: 8.5 },
    { id: 'ps6', matchId: 'm2', playerId: 'p8', teamId: 't4', minutesPlayed: 90, goals: 0, assists: 0, shots: 1, shotsOnTarget: 0, passes: 18, passAccuracy: 72, tackles: 0, interceptions: 1, clearances: 2, dribbles: 1, foulsCommitted: 2, foulsSuffered: 3, yellowCards: 1, redCards: 0, offsides: 2, cornersTaken: 0, crosses: 0, saves: 0, goalsConceded: 0, rating: 6.2 },
  ],
  m3: [
    { id: 'ps7', matchId: 'm3', playerId: 'p9', teamId: 't5', minutesPlayed: 90, goals: 1, assists: 0, shots: 4, shotsOnTarget: 2, passes: 28, passAccuracy: 82, tackles: 1, interceptions: 0, clearances: 1, dribbles: 3, foulsCommitted: 2, foulsSuffered: 1, yellowCards: 0, redCards: 0, offsides: 0, cornersTaken: 0, crosses: 0, saves: 0, goalsConceded: 0, rating: 7.6 },
  ],
};

export const playerAttributesData: PlayerAttributes[] = [
  { id: 'pa1', playerId: 'p1', sportId: 'football', measuredAt: '2025-01-15', overall: 86, potential: 88, pace: 82, acceleration: 84, stamina: 74, strength: 78, agility: 80, balance: 72, jumping: 76, reaction: 85, dribbling: 84, passing: 75, shooting: 88, finishing: 92, longShots: 82, crossing: 65, heading: 78, marking: 25, tackling: 22, interceptions: 28, vision: 76, composure: 83, positioning: 90, decisionMaking: 80, teamwork: 70, leadership: 65, aggression: 60, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'pa2', playerId: 'p2', sportId: 'football', measuredAt: '2025-01-15', overall: 88, potential: 89, pace: 78, acceleration: 80, stamina: 76, strength: 65, agility: 82, balance: 78, jumping: 68, reaction: 84, dribbling: 86, passing: 88, shooting: 80, finishing: 78, longShots: 85, crossing: 90, heading: 55, marking: 35, tackling: 30, interceptions: 38, vision: 92, composure: 85, positioning: 84, decisionMaking: 82, teamwork: 78, leadership: 70, aggression: 55, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'pa3', playerId: 'p3', sportId: 'football', measuredAt: '2025-01-15', overall: 84, potential: 87, pace: 72, acceleration: 74, stamina: 70, strength: 82, agility: 68, balance: 70, jumping: 80, reaction: 82, dribbling: 76, passing: 70, shooting: 86, finishing: 90, longShots: 78, crossing: 60, heading: 85, marking: 20, tackling: 18, interceptions: 22, vision: 65, composure: 80, positioning: 88, decisionMaking: 76, teamwork: 72, leadership: 55, aggression: 50, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'pa4', playerId: 'p4', sportId: 'football', measuredAt: '2025-01-15', overall: 83, potential: 85, pace: 72, acceleration: 74, stamina: 78, strength: 68, agility: 76, balance: 80, jumping: 65, reaction: 82, dribbling: 80, passing: 84, shooting: 85, finishing: 82, longShots: 88, crossing: 78, heading: 62, marking: 38, tackling: 40, interceptions: 42, vision: 86, composure: 84, positioning: 82, decisionMaking: 80, teamwork: 76, leadership: 68, aggression: 62, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'pa5', playerId: 'p5', sportId: 'football', measuredAt: '2025-01-15', overall: 84, potential: 84, pace: 91, acceleration: 93, stamina: 80, strength: 58, agility: 90, balance: 85, jumping: 62, reaction: 80, dribbling: 90, passing: 82, shooting: 76, finishing: 74, longShots: 72, crossing: 84, heading: 48, marking: 28, tackling: 25, interceptions: 30, vision: 80, composure: 78, positioning: 82, decisionMaking: 76, teamwork: 74, leadership: 60, aggression: 45, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'pa6', playerId: 'p6', sportId: 'football', measuredAt: '2025-01-15', overall: 82, potential: 83, pace: 76, acceleration: 78, stamina: 72, strength: 80, agility: 72, balance: 74, jumping: 82, reaction: 80, dribbling: 74, passing: 68, shooting: 84, finishing: 86, longShots: 80, crossing: 55, heading: 84, marking: 22, tackling: 20, interceptions: 24, vision: 68, composure: 78, positioning: 86, decisionMaking: 74, teamwork: 70, leadership: 72, aggression: 75, isActive: true, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'pa7', playerId: 'p9', sportId: 'football', measuredAt: '2024-07-01', overall: 85, potential: 85, pace: 70, acceleration: 72, stamina: 68, strength: 84, agility: 68, balance: 76, jumping: 78, reaction: 86, dribbling: 80, passing: 78, shooting: 88, finishing: 92, longShots: 85, crossing: 65, heading: 82, marking: 20, tackling: 18, interceptions: 22, vision: 82, composure: 88, positioning: 92, decisionMaking: 85, teamwork: 72, leadership: 90, aggression: 78, isActive: true, createdAt: '2024-07-01T00:00:00Z' },
];

export const playerCardsData: PlayerCard[] = [
  { id: 'pc1', playerId: 'p4', matchId: 'm1', teamId: 't2', cardType: 'yellow', severity: 'hard', minute: 67, period: 'second_half', reason: 'Entrada dura no meio-campo', suspensionMatches: 0, createdAt: '2025-04-13T17:15:00Z' },
  { id: 'pc2', playerId: 'p8', matchId: 'm2', teamId: 't4', cardType: 'yellow', severity: 'soft', minute: 34, period: 'first_half', reason: 'Reclamação', suspensionMatches: 0, createdAt: '2025-04-13T19:34:00Z' },
  { id: 'pc3', playerId: 'p5', matchId: 'm3', teamId: 't5', cardType: 'yellow', severity: 'technical', minute: 72, period: 'second_half', reason: 'Simulação', suspensionMatches: 0, createdAt: '2025-04-14T17:12:00Z' },
];

// =============================================================================
// VOLLEYBALL
// =============================================================================
export const volleyballTeams: Team[] = [
  { id: 'vt1', sportId: 'volleyball', name: 'Sada Cruzeiro', shortName: 'CRU', country: 'Brasil', city: 'Contagem' },
  { id: 'vt2', sportId: 'volleyball', name: 'Itambé Minas', shortName: 'MIN', country: 'Brasil', city: 'Belo Horizonte' },
  { id: 'vt3', sportId: 'volleyball', name: 'Vôlei Renata', shortName: 'REN', country: 'Brasil', city: 'Campinas' },
  { id: 'vt4', sportId: 'volleyball', name: 'SESI-SP', shortName: 'SES', country: 'Brasil', city: 'São Paulo' },
];

export const volleyballPlayers: Player[] = [
  { id: 'vp1', sportId: 'volleyball', fullName: 'Wallace', shortName: 'Wallace', nationality: 'Brasil', heightCm: 198, weightKg: 97, retired: false, metadata: { position: 'opposite', reachCm: 345, shirtNumber: 8 } },
  { id: 'vp2', sportId: 'volleyball', fullName: 'Bruninho', shortName: 'Bruninho', nationality: 'Brasil', heightCm: 190, weightKg: 78, retired: false, metadata: { position: 'setter', reachCm: 330, shirtNumber: 1 } },
  { id: 'vp3', sportId: 'volleyball', fullName: 'Lucarelli', shortName: 'Lucarelli', nationality: 'Brasil', heightCm: 195, weightKg: 87, retired: false, metadata: { position: 'outside_hitter', reachCm: 340, shirtNumber: 10 } },
];

export const volleyballMatches: Match[] = [
  { id: 'vm1', sportId: 'volleyball', competitionId: 'c1', seasonId: 's2025', homeTeamId: 'vt1', awayTeamId: 'vt2', status: 'finished', scheduledAt: '2025-04-15T19:00:00Z', startedAt: '2025-04-15T19:00:00Z', finishedAt: '2025-04-15T21:00:00Z', homeScore: 3, awayScore: 1, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-15T21:00:00Z' },
  { id: 'vm2', sportId: 'volleyball', competitionId: 'c1', seasonId: 's2025', homeTeamId: 'vt3', awayTeamId: 'vt4', status: 'finished', scheduledAt: '2025-04-16T18:30:00Z', startedAt: '2025-04-16T18:30:00Z', finishedAt: '2025-04-16T20:30:00Z', homeScore: 3, awayScore: 2, round: '2', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-16T20:30:00Z' },
];

// =============================================================================
// BASKETBALL
// =============================================================================
export const basketballTeams: Team[] = [
  { id: 'bt1', sportId: 'basketball', name: 'Flamengo', shortName: 'FLA', country: 'Brasil', city: 'Rio de Janeiro' },
  { id: 'bt2', sportId: 'basketball', name: 'Franca', shortName: 'FRA', country: 'Brasil', city: 'Franca' },
  { id: 'bt3', sportId: 'basketball', name: 'São Paulo', shortName: 'SAO', country: 'Brasil', city: 'São Paulo' },
  { id: 'bt4', sportId: 'basketball', name: 'Pinheiros', shortName: 'PIN', country: 'Brasil', city: 'São Paulo' },
];

export const basketballPlayers: Player[] = [
  { id: 'bp1', sportId: 'basketball', fullName: 'Marquinhos', shortName: 'Marquinhos', nationality: 'Brasil', heightCm: 207, weightKg: 105, retired: false, metadata: { position: 'power_forward', jerseyNumber: 11 } },
  { id: 'bp2', sportId: 'basketball', fullName: 'Alexey', shortName: 'Alexey', nationality: 'Brasil', heightCm: 192, weightKg: 88, retired: false, metadata: { position: 'shooting_guard', jerseyNumber: 5 } },
  { id: 'bp3', sportId: 'basketball', fullName: 'Lucas Dias', shortName: 'Lucas D.', nationality: 'Brasil', heightCm: 205, weightKg: 102, retired: false, metadata: { position: 'center', jerseyNumber: 15 } },
];

export const basketballMatches: Match[] = [
  { id: 'bm1', sportId: 'basketball', competitionId: 'c5', seasonId: 's2025', homeTeamId: 'bt1', awayTeamId: 'bt2', status: 'finished', scheduledAt: '2025-04-14T20:00:00Z', startedAt: '2025-04-14T20:00:00Z', finishedAt: '2025-04-14T21:45:00Z', homeScore: 88, awayScore: 76, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-14T21:45:00Z' },
];

// =============================================================================
// BASEBALL
// =============================================================================
export const baseballTeams: Team[] = [
  { id: 'bbt1', sportId: 'baseball', name: 'Yankees', shortName: 'NYY', country: 'EUA', city: 'New York' },
  { id: 'bbt2', sportId: 'baseball', name: 'Red Sox', shortName: 'BOS', country: 'EUA', city: 'Boston' },
  { id: 'bbt3', sportId: 'baseball', name: 'Dodgers', shortName: 'LAD', country: 'EUA', city: 'Los Angeles' },
];

export const baseballPlayers: Player[] = [
  { id: 'bbp1', sportId: 'baseball', fullName: 'Aaron Judge', shortName: 'Judge', nationality: 'EUA', heightCm: 201, weightKg: 128, retired: false, metadata: { primaryPosition: 'right_field', battingHand: 'right', throwingHand: 'right' } },
  { id: 'bbp2', sportId: 'baseball', fullName: 'Shohei Ohtani', shortName: 'Ohtani', nationality: 'Japão', heightCm: 193, weightKg: 95, retired: false, metadata: { primaryPosition: 'designated_hitter', battingHand: 'left', throwingHand: 'right' } },
];

export const baseballMatches: Match[] = [
  { id: 'bbm1', sportId: 'baseball', competitionId: 'c1', seasonId: 's2025', homeTeamId: 'bbt1', awayTeamId: 'bbt2', status: 'finished', scheduledAt: '2025-04-12T14:00:00Z', startedAt: '2025-04-12T14:00:00Z', finishedAt: '2025-04-12T16:45:00Z', homeScore: 6, awayScore: 3, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-12T16:45:00Z' },
];

// =============================================================================
// STAFF
// =============================================================================
export const staffData: Staff[] = [
  { id: 'sf1', fullName: 'Filipe Luís', nationality: 'Brasil', birthDate: '1985-08-09', role: 'head_coach', specialty: 'Técnico principal', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'sf2', fullName: 'Abel Ferreira', nationality: 'Portugal', birthDate: '1978-12-22', role: 'head_coach', specialty: 'Técnico principal', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sf3', fullName: 'Thiago Silva', nationality: 'Brasil', role: 'assistant_coach', specialty: 'Auxiliar técnico', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'sf4', fullName: 'Dr. José Carlos', nationality: 'Brasil', role: 'physiotherapist', specialty: 'Fisioterapia esportiva', createdAt: '2024-06-01T00:00:00Z' },
  { id: 'sf5', fullName: 'Carlos Alberto', nationality: 'Brasil', role: 'fitness_coach', specialty: 'Preparação física', createdAt: '2024-01-01T00:00:00Z' },
];

export const teamStaffData: TeamStaff[] = [
  { id: 'tsf1', teamId: 't1', seasonId: 's2025', staffId: 'sf1', startDate: '2025-01-01', isActive: true },
  { id: 'tsf2', teamId: 't2', seasonId: 's2025', staffId: 'sf2', startDate: '2024-01-01', isActive: true },
  { id: 'tsf3', teamId: 't1', seasonId: 's2025', staffId: 'sf3', startDate: '2025-01-01', isActive: true },
  { id: 'tsf4', teamId: 't1', seasonId: 's2025', staffId: 'sf4', startDate: '2024-06-01', isActive: true },
  { id: 'tsf5', teamId: 't3', seasonId: 's2025', staffId: 'sf5', startDate: '2024-01-01', isActive: true },
];

// =============================================================================
// LESÕES
// =============================================================================
export const injuriesData: PlayerInjury[] = [
  { id: 'inj1', playerId: 'p3', injuryType: 'Estiramento muscular na coxa', severity: 'moderate', bodyPart: 'coxa direita', startDate: '2025-03-15', expectedReturn: '2025-04-20', gamesMissed: 6, recurrence: false, notes: 'Lesão durante treino', createdAt: '2025-03-15T00:00:00Z' },
  { id: 'inj2', playerId: 'p5', injuryType: 'Entorse de tornozelo', severity: 'minor', bodyPart: 'tornozelo esquerdo', startDate: '2025-04-01', expectedReturn: '2025-04-15', actualReturn: '2025-04-12', gamesMissed: 2, recurrence: true, notes: 'Lesão recorrente', createdAt: '2025-04-01T00:00:00Z' },
];

// =============================================================================
// TRANSFERÊNCIAS
// =============================================================================
export const transfersData: Transfer[] = [
  { id: 'tr1', playerId: 'p1', fromTeamId: 't7', toTeamId: 't1', transferDate: '2020-01-28', transferFee: 54000000, contractYears: 5, transferType: 'permanent', agentName: 'Wagner Ribeiro', createdAt: '2020-01-28T00:00:00Z' },
  { id: 'tr2', playerId: 'p4', fromTeamId: 't4', toTeamId: 't2', transferDate: '2021-07-01', transferFee: 32000000, contractYears: 4, transferType: 'permanent', createdAt: '2021-07-01T00:00:00Z' },
  { id: 'tr3', playerId: 'p9', toTeamId: 't5', transferDate: '2023-01-01', transferFee: 0, contractYears: 2, transferType: 'free_transfer', notes: 'Chegou como agente livre do Nacional/UY', createdAt: '2023-01-01T00:00:00Z' },
];

// =============================================================================
// LINEUPS (Tático)
// =============================================================================
export const lineupsData: MatchLineup[] = [
  { id: 'ml1', matchId: 'm1', teamId: 't1', formation: '4-3-3', coachId: 'sf1', isConfirmed: true, createdAt: '2025-04-13T15:00:00Z' },
  { id: 'ml2', matchId: 'm1', teamId: 't2', formation: '4-2-3-1', coachId: 'sf2', isConfirmed: true, createdAt: '2025-04-13T15:00:00Z' },
];

export const lineupPlayersData: LineupPlayer[] = [
  { id: 'lp1', lineupId: 'ml1', playerId: 'p1', positionX: 80, positionY: 50, shirtNumber: 10, role: 'vice_captain', isStarter: true, substitutedOut: false, substitutedIn: false },
  { id: 'lp2', lineupId: 'ml1', playerId: 'p2', positionX: 50, positionY: 45, shirtNumber: 14, role: 'set_piece_taker', isStarter: true, substitutedOut: false, substitutedIn: false },
  { id: 'lp3', lineupId: 'ml2', playerId: 'p4', positionX: 60, positionY: 40, shirtNumber: 23, isStarter: true, substitutedOut: false, substitutedIn: false },
  { id: 'lp4', lineupId: 'ml2', playerId: 'p5', positionX: 85, positionY: 50, shirtNumber: 7, role: 'captain', isStarter: true, substitutedOut: false, substitutedIn: false },
];

// =============================================================================
// RANKINGS
// =============================================================================
export const rankingsData: Ranking[] = [
  { id: 'rk1', sportId: 'football', rankingType: 'top_scorer', entityId: 'p1', entityType: 'player', score: 92.0, position: 1, calculatedAt: '2025-04-15T00:00:00Z' },
  { id: 'rk2', sportId: 'football', rankingType: 'top_scorer', entityId: 'p6', entityType: 'player', score: 88.5, position: 2, calculatedAt: '2025-04-15T00:00:00Z' },
  { id: 'rk3', sportId: 'football', rankingType: 'club_world', entityId: 't2', entityType: 'team', score: 95.0, position: 1, metadata: { points: 80, season: '2024' }, calculatedAt: '2025-01-01T00:00:00Z' },
  { id: 'rk4', sportId: 'football', rankingType: 'club_world', entityId: 't1', entityType: 'team', score: 92.0, position: 2, metadata: { points: 75, season: '2024' }, calculatedAt: '2025-01-01T00:00:00Z' },
  { id: 'rk5', sportId: 'football', rankingType: 'player_potential', entityId: 'p3', entityType: 'player', score: 87.0, position: 1, calculatedAt: '2025-04-15T00:00:00Z' },
];

// =============================================================================
// MEDIA ASSETS
// =============================================================================
export const mediaAssetsData: MediaAsset[] = [
  { id: 'ma1', entityType: 'team', entityId: 't1', mediaType: 'logo', url: '/logos/flamengo.png', title: 'Flamengo', isPrimary: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ma2', entityType: 'team', entityId: 't2', mediaType: 'logo', url: '/logos/palmeiras.png', title: 'Palmeiras', isPrimary: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'ma3', entityType: 'player', entityId: 'p1', mediaType: 'image', url: '/players/gabigol.png', title: 'Gabigol 2025', altText: 'Gabriel Barbosa comemorando', isPrimary: true, sortOrder: 1, createdAt: '2025-01-15T00:00:00Z' },
  { id: 'ma4', entityType: 'player', entityId: 'p2', mediaType: 'image', url: '/players/arrascaeta.png', title: 'Arrascaeta 2025', isPrimary: true, createdAt: '2025-01-15T00:00:00Z' },
];

// =============================================================================
// ODDS
// =============================================================================
export const oddsData: Odds[] = [
  { id: 'od1', matchId: 'm1', bookmaker: 'Bet365', homeWin: 1.85, draw: 3.40, awayWin: 4.50, overUnder: { '2.5': { over: 1.90, under: 1.95 } }, bothTeamsScore: { yes: 1.80, no: 2.05 }, isBoosted: false, probabilityHome: 54.1, probabilityDraw: 29.4, probabilityAway: 22.2, margin: 5.7, source: 'api', createdAt: '2025-04-10T12:00:00Z', updatedAt: '2025-04-10T12:00:00Z' },
  { id: 'od2', matchId: 'm1', bookmaker: 'Sportingbet', homeWin: 1.80, draw: 3.50, awayWin: 4.60, isBoosted: true, probabilityHome: 55.6, probabilityDraw: 28.6, probabilityAway: 21.7, margin: 5.9, source: 'api', createdAt: '2025-04-10T12:00:00Z', updatedAt: '2025-04-11T10:00:00Z' },
  { id: 'od3', matchId: 'm5', bookmaker: 'Bet365', homeWin: 2.10, draw: 3.20, awayWin: 3.60, isBoosted: false, createdAt: '2025-04-15T12:00:00Z', updatedAt: '2025-04-15T12:00:00Z' },
];

// =============================================================================
// MULTI-TENANT (MOI-014)
// =============================================================================
export const organizationsData: Organization[] = [
  { id: 'org1', name: 'MADev Sports', slug: 'madev-sports', country: 'Brasil', plan: 'enterprise', isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'org2', name: 'FIFA Forward', slug: 'fifa-forward', country: 'Suíça', plan: 'enterprise', isActive: true, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-03-01T00:00:00Z' },
];

export const tenantsData: Tenant[] = [
  { id: 'ten1', organizationId: 'org1', name: 'Brasileirão Analytics', slug: 'brasileirao', sportId: 'football', isActive: true, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ten2', organizationId: 'org1', name: 'NBA Latam', slug: 'nba-latam', sportId: 'basketball', isActive: true, createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-02-01T00:00:00Z' },
];

export const tenantUsersData: TenantUser[] = [
  { id: 'tu1', tenantId: 'ten1', userId: 'auth0|user1', email: 'admin@madev.com', fullName: 'Admin MADev', role: 'admin', isActive: true, createdAt: '2025-01-01T00:00:00Z' },
  { id: 'tu2', tenantId: 'ten1', userId: 'auth0|user2', email: 'scout@madev.com', fullName: 'Scout Analista', role: 'scout', isActive: true, createdAt: '2025-01-10T00:00:00Z' },
];

export const tenantPermissionsData: TenantPermission[] = [
  { id: 'tp1', tenantId: 'ten1', role: 'admin', resource: 'matches', permission: 'admin' },
  { id: 'tp2', tenantId: 'ten1', role: 'scout', resource: 'matches', permission: 'write' },
  { id: 'tp3', tenantId: 'ten1', role: 'scout', resource: 'players', permission: 'write' },
  { id: 'tp4', tenantId: 'ten1', role: 'viewer', resource: 'standings', permission: 'read' },
];

// =============================================================================
// LIVE STATE SNAPSHOTS (MOI-012)
// =============================================================================
export const snapshotsData: MatchStateSnapshot[] = [
  { id: 'ss1', matchId: 'm5', teamId: 't9', capturedAt: '2025-04-16T21:45:00Z', minute: 15, period: 'first_half', score: 1, opponentScore: 0, possession: 58, momentum: 72, pressureIndex: 6.5, estimatedFatigue: 12, liveXg: 0.8, liveXga: 0.3, shotsLast5min: 2, chancesCreated: 3, dangerousAttacks: 4, dominantZone: 'final_third', isPressing: true, isCountering: false, isInControl: true, createdAt: '2025-04-16T21:45:00Z' },
  { id: 'ss2', matchId: 'm5', teamId: 't10', capturedAt: '2025-04-16T21:45:00Z', minute: 15, period: 'first_half', score: 0, opponentScore: 1, possession: 42, momentum: 28, pressureIndex: 3.2, estimatedFatigue: 15, liveXg: 0.3, liveXga: 0.8, shotsLast5min: 1, chancesCreated: 0, dangerousAttacks: 1, dominantZone: 'defensive_third', isPressing: false, isCountering: true, isInControl: false, createdAt: '2025-04-16T21:45:00Z' },
  { id: 'ss3', matchId: 'm5', teamId: 't9', capturedAt: '2025-04-16T22:15:00Z', minute: 45, period: 'first_half', score: 1, opponentScore: 0, possession: 56, momentum: 68, pressureIndex: 5.8, estimatedFatigue: 35, liveXg: 1.2, liveXga: 0.5, shotsLast5min: 1, chancesCreated: 2, dangerousAttacks: 3, dominantZone: 'middle_third', isPressing: false, isCountering: false, isInControl: true, createdAt: '2025-04-16T22:15:00Z' },
];

// =============================================================================
// SPORT EVENTS (MOI-011)
// =============================================================================
export const sportEventsData: SportEvent[] = [
  { id: 'se1', matchId: 'm1', sportId: 'football', teamId: 't1', playerId: 'p1', eventType: 'goal', minute: 23, period: 'first_half', currentHomeScore: 1, currentAwayScore: 0, payload: { goalType: 'open_play', assistId: 'p2', shotDistance: 12, bodyPart: 'right_foot' }, description: 'Finalização cruzada após passe de Arrascaeta', source: 'manual', createdAt: '2025-04-13T16:23:00Z' },
  { id: 'se2', matchId: 'm1', sportId: 'football', teamId: 't2', playerId: 'p4', eventType: 'goal', minute: 67, period: 'second_half', currentHomeScore: 1, currentAwayScore: 1, payload: { goalType: 'free_kick', shotDistance: 22, bodyPart: 'left_foot' }, description: 'Falta direta no ângulo', tags: ['highlight'], source: 'manual', createdAt: '2025-04-13T17:07:00Z' },
  { id: 'se3', matchId: 'm1', sportId: 'football', teamId: 't1', playerId: 'p2', eventType: 'card', minute: 72, period: 'second_half', currentHomeScore: 2, currentAwayScore: 1, payload: { cardType: 'yellow', severity: 'hard', reason: 'Entrada dura' }, secondaryPlayerId: 'p5', source: 'manual', createdAt: '2025-04-13T17:12:00Z' },
];

// =============================================================================
// AI EMBEDDINGS (MOI-013)
// =============================================================================
export const embeddingsData: EntityEmbedding[] = [
  { id: 'emb1', entityType: 'player', entityId: 'p1', embedding: Array(384).fill(0), sourceText: 'Gabriel Barbosa, conhecido como Gabigol, é um atacante brasileiro...', sourceField: 'biography', modelName: 'all-MiniLM-L6-v2', chunkIndex: 0, totalChunks: 1, createdAt: '2025-04-01T00:00:00Z' },
  { id: 'emb2', entityType: 'player', entityId: 'p2', embedding: Array(384).fill(0), sourceText: 'Arrascaeta, meia uruguaio, conhecido por sua visão de jogo e passes precisos...', sourceField: 'biography', modelName: 'all-MiniLM-L6-v2', chunkIndex: 0, totalChunks: 1, createdAt: '2025-04-01T00:00:00Z' },
  { id: 'emb3', entityType: 'match', entityId: 'm1', embedding: Array(384).fill(0), sourceText: 'Flamengo vence Palmeiras por 2 a 1 com gol de Gabigol e atuação destacada de Arrascaeta.', sourceField: 'match_report', modelName: 'all-MiniLM-L6-v2', chunkIndex: 0, totalChunks: 1, createdAt: '2025-04-14T00:00:00Z' },
];

// =============================================================================
// ENTITY-TENANT MAPPING (MOI-014)
// =============================================================================
export const entityTenantsData: EntityTenant[] = [
  { entityType: 'player', entityId: 'p1', tenantId: 'ten1', createdAt: '2025-01-01T00:00:00Z' },
  { entityType: 'player', entityId: 'p2', tenantId: 'ten1', createdAt: '2025-01-01T00:00:00Z' },
  { entityType: 'team', entityId: 't1', tenantId: 'ten1', createdAt: '2025-01-01T00:00:00Z' },
  { entityType: 'team', entityId: 't2', tenantId: 'ten1', createdAt: '2025-01-01T00:00:00Z' },
  { entityType: 'match', entityId: 'm1', tenantId: 'ten1', createdAt: '2025-01-01T00:00:00Z' },
];

// =============================================================================
// KNOWLEDGE GRAPH (MOI-016)
// =============================================================================
export const graphNodesData: GraphNode[] = [
  { id: 'gn1', tenantId: 'ten1', entityType: 'player', entityId: 'p1', nodeLabel: 'Gabriel Barbosa (Gabigol)', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'gn2', tenantId: 'ten1', entityType: 'player', entityId: 'p2', nodeLabel: 'Arrascaeta', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'gn3', tenantId: 'ten1', entityType: 'team', entityId: 't1', nodeLabel: 'Flamengo', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'gn4', tenantId: 'ten1', entityType: 'team', entityId: 't2', nodeLabel: 'Palmeiras', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'gn5', tenantId: 'ten1', entityType: 'match', entityId: 'm1', nodeLabel: 'Flamengo 2-1 Palmeiras (2025)', createdAt: '2025-04-13T00:00:00Z' },
  { id: 'gn6', tenantId: 'ten1', entityType: 'player', entityId: 'p4', nodeLabel: 'Raphael Veiga', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'gn7', tenantId: 'ten1', entityType: 'player', entityId: 'p9', nodeLabel: 'Luis Suárez', createdAt: '2025-01-01T00:00:00Z' },
];

export const graphEdgesData: GraphEdge[] = [
  { id: 'ge1', tenantId: 'ten1', sourceNodeId: 'gn1', targetNodeId: 'gn3', predicate: 'transferred_to', weight: 1.0, properties: { season: '2020', transfer_fee_eur: 54000000 }, createdAt: '2020-01-28T00:00:00Z', updatedAt: '2020-01-28T00:00:00Z' },
  { id: 'ge2', tenantId: 'ten1', sourceNodeId: 'gn1', targetNodeId: 'gn2', predicate: 'played_with', weight: 0.95, properties: { season: '2025', matches_together: 87 }, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2025-04-01T00:00:00Z' },
  { id: 'ge3', tenantId: 'ten1', sourceNodeId: 'gn3', targetNodeId: 'gn4', predicate: 'rival_of', weight: 1.0, properties: { rivalry_type: 'clássico', region: 'Brasil' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ge4', tenantId: 'ten1', sourceNodeId: 'gn6', targetNodeId: 'gn4', predicate: 'transferred_to', weight: 1.0, properties: { season: '2021', transfer_fee_eur: 32000000 }, createdAt: '2021-07-01T00:00:00Z', updatedAt: '2021-07-01T00:00:00Z' },
  { id: 'ge5', tenantId: 'ten1', sourceNodeId: 'gn1', targetNodeId: 'gn5', predicate: 'injured_in', weight: 0.3, properties: { year: 2025, injury_type: 'minor' }, createdAt: '2025-04-13T00:00:00Z', updatedAt: '2025-04-13T00:00:00Z' },
  { id: 'ge6', tenantId: 'ten1', sourceNodeId: 'gn7', targetNodeId: 'gn2', predicate: 'played_with', weight: 0.85, properties: { season: '2022', national_team: 'Uruguai' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

// =============================================================================
// ML FEATURE STORE (v0.3.5)
// =============================================================================
export const mlFeaturesData: MlFeature[] = [
  {
    id: 'mf1', entityType: 'player', entityId: 'p1', featureGroup: 'tactical',
    modelName: 'moirai-scout-v2', modelVersion: '2.1.0',
    features: { expected_goals: 0.45, pressure_index: 7.2, offensive_contribution: 0.82 },
    windowStart: '2025-04-01T00:00:00Z', windowEnd: '2025-04-30T00:00:00Z',
    featureEngine: 'sql-aggregation', sourceTable: 'football_player_stats',
    calculatedAt: '2025-05-01T00:00:00Z', createdAt: '2025-05-01T00:00:00Z',
  },
  {
    id: 'mf2', entityType: 'player', entityId: 'p2', featureGroup: 'physical',
    modelName: 'moirai-scout-v2', modelVersion: '2.1.0',
    features: { avg_speed_kmh: 8.5, distance_covered_km: 11.2, stamina_index: 0.76 },
    windowStart: '2025-04-01T00:00:00Z', windowEnd: '2025-04-30T00:00:00Z',
    featureEngine: 'sql-aggregation', sourceTable: 'player_coordinates',
    calculatedAt: '2025-05-01T00:00:00Z', createdAt: '2025-05-01T00:00:00Z',
  },
];

export const allTeams = [...teams, ...volleyballTeams, ...basketballTeams, ...baseballTeams];

function getTeamName(teamId: string): string {
  return allTeams.find(t => t.id === teamId)?.name ?? teamId;
}

function getTeamShort(teamId: string): string {
  return allTeams.find(t => t.id === teamId)?.shortName ?? teamId;
}

export const allMatches = [...matches, ...volleyballMatches, ...basketballMatches, ...baseballMatches];
export const allPlayers = [...players, ...volleyballPlayers, ...basketballPlayers, ...baseballPlayers];

export function getMatchWithDetails(matchId: string) {
  const match = allMatches.find(m => m.id === matchId);
  if (!match) return null;
  return {
    ...match,
    homeTeamName: getTeamName(match.homeTeamId),
    awayTeamName: getTeamName(match.awayTeamId),
    homeTeamShort: getTeamShort(match.homeTeamId),
    awayTeamShort: getTeamShort(match.awayTeamId),
    stats: matchStats[matchId] ?? null,
    playerStats: playerStats[matchId] ?? [],
    competition: competitions.find(c => c.id === match.competitionId),
  };
}

export function getAllMatches() {
  return allMatches.map(m => ({
    ...m,
    homeTeamName: getTeamName(m.homeTeamId),
    awayTeamName: getTeamName(m.awayTeamId),
    homeTeamShort: getTeamShort(m.homeTeamId),
    awayTeamShort: getTeamShort(m.awayTeamId),
    competition: competitions.find(c => c.id === m.competitionId),
  }));
}
