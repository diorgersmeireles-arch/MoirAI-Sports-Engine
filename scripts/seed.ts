import 'dotenv/config';
import { Pool } from 'pg';
import {
  competitions,
  seasons,
  teams,
  players,
  matches,
  playerStats,
  playerAttributesData,
  playerCardsData,
  standings2024,
  volleyballTeams,
  volleyballPlayers,
  volleyballMatches,
  basketballTeams,
  basketballPlayers,
  basketballMatches,
  baseballTeams,
  baseballPlayers,
  baseballMatches,
  legendsData,
  dreamTeamsData,
  dreamTeamPlayersData,
  fantasyTeamsData,
  fantasyTeamPlayersData,
  legendPlayersData,
  tacticalProfilesData,
  fantasyCoachesData,
  dreamteamRankingsData,
  staffData,
  teamStaffData,
  injuriesData,
  transfersData,
  lineupsData,
  lineupPlayersData,
  rankingsData,
  mediaAssetsData,
  oddsData,
  organizationsData,
  tenantsData,
  tenantUsersData,
  tenantPermissionsData,
  snapshotsData,
  sportEventsData,
  embeddingsData,
  entityTenantsData,
  graphNodesData,
  graphEdgesData,
  mlFeaturesData,
  mlFeaturesData,
  auditLogsData,
  tenantQuotasData,
  systemParametersData,
  stadiumsData,
  importBatchesData,
  subscriptionPlansData,
  billingInvoicesData,
} from '../data/seed';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('⏳ Seeding database...');

    // Sports
    const sports = [
      { id: 'football', name: 'Futebol' },
      { id: 'volleyball', name: 'Vôlei' },
      { id: 'basketball', name: 'Basquete' },
      { id: 'baseball', name: 'Baseball' },
      { id: 'american_football', name: 'Futebol Americano' },
    ];
    for (const s of sports) {
      await pool.query('INSERT INTO sports (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING', [s.id, s.name]);
    }

    // Helper: insert rows from an array
    async function insertRows(table: string, rows: Record<string, unknown>[]) {
      if (rows.length === 0) return;
      const keys = Object.keys(rows[0]!);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const values = rows.map((_, i) => `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(', ')})`).join(', ');
      const flatParams = rows.flatMap(r => keys.map(k => r[k]));
      await pool.query(`INSERT INTO "${table}" (${cols}) VALUES ${values} ON CONFLICT DO NOTHING`, flatParams);
    }

    await insertRows('competitions', competitions);
    await insertRows('seasons', seasons);
    await insertRows('teams', teams);
    await insertRows('teams', volleyballTeams);
    await insertRows('teams', basketballTeams);
    await insertRows('teams', baseballTeams);

    await insertRows('players', players);
    await insertRows('players', volleyballPlayers);
    await insertRows('players', basketballPlayers);
    await insertRows('players', baseballPlayers);
    await insertRows('players', legendsData);

    await insertRows('matches', matches);
    await insertRows('matches', volleyballMatches);
    await insertRows('matches', basketballMatches);
    await insertRows('matches', baseballMatches);

    await insertRows('player_attributes', playerAttributesData);
    await insertRows('player_cards', playerCardsData);
    await insertRows('standings', standings2024);
    await insertRows('staff', staffData);
    await insertRows('team_staff', teamStaffData);
    await insertRows('player_injuries', injuriesData);
    await insertRows('transfers', transfersData);
    await insertRows('match_lineups', lineupsData);
    await insertRows('lineup_players', lineupPlayersData);
    await insertRows('rankings', rankingsData);
    await insertRows('media_assets', mediaAssetsData);
    await insertRows('odds', oddsData);
    await insertRows('organizations', organizationsData);
    await insertRows('tenants', tenantsData);
    await insertRows('tenant_users', tenantUsersData);
    await insertRows('tenant_permissions', tenantPermissionsData);
    await insertRows('match_state_snapshots', snapshotsData);
    await insertRows('sport_events', sportEventsData);
    await insertRows('entity_embeddings', embeddingsData);
    await insertRows('entity_tenants', entityTenantsData);
    await insertRows('graph_nodes', graphNodesData);
    await insertRows('graph_edges', graphEdgesData);
    await insertRows('ml_features', mlFeaturesData);
    await insertRows('audit_logs', auditLogsData);
    await insertRows('dream_teams', dreamTeamsData);
    await insertRows('dream_team_players', dreamTeamPlayersData);
    await insertRows('fantasy_teams', fantasyTeamsData);
    await insertRows('fantasy_team_players', fantasyTeamPlayersData);
    await insertRows('legend_players', legendPlayersData);
    await insertRows('tactical_profiles', tacticalProfilesData);
    await insertRows('fantasy_coaches', fantasyCoachesData);
    await insertRows('dreamteam_rankings', dreamteamRankingsData);
    await insertRows('tenant_quotas_enforcement', tenantQuotasData);
    await insertRows('system_global_parameters', systemParametersData);
    await insertRows('stadiums', stadiumsData);
    await insertRows('import_batches', importBatchesData);
    await insertRows('tenant_subscription_plans', subscriptionPlansData);
    await insertRows('tenant_billing_invoices', billingInvoicesData);

    console.log('✅ Seed data inserted successfully');
  } catch (err) {
    console.error('❌ Seed failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
