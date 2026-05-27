-- =============================================================================
-- MoirAI Sports Engine — Schema de Banco de Dados
-- Suporte: Futebol, Vôlei, Basquete, Baseball
-- Cobertura: Competições desde 2020
-- Desenvolvido por MADev
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE sport_type AS ENUM ('football', 'volleyball', 'basketball', 'baseball');
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished', 'postponed', 'cancelled');
CREATE TYPE match_period AS ENUM ('first_half', 'second_half', 'extra_time', 'penalties');
CREATE TYPE card_type AS ENUM ('yellow', 'red', 'second_yellow');
CREATE TYPE football_event_type AS ENUM ('goal', 'card', 'substitution', 'penalty', 'own_goal');
CREATE TYPE volleyball_event_type AS ENUM ('point', 'block', 'serve_ace', 'attack_error', 'substitution', 'timeout');
CREATE TYPE basketball_event_type AS ENUM ('two_pointer', 'three_pointer', 'free_throw', 'rebound', 'assist', 'steal', 'block', 'foul', 'turnover', 'substitution', 'timeout');
CREATE TYPE baseball_event_type AS ENUM ('hit', 'home_run', 'strikeout', 'walk', 'error', 'double_play', 'stolen_base', 'caught_stealing');
CREATE TYPE foul_type AS ENUM ('personal', 'technical', 'flagrant', 'offensive');
CREATE TYPE batting_hand AS ENUM ('left', 'right', 'switch');
CREATE TYPE throwing_hand AS ENUM ('left', 'right');
CREATE TYPE transfer_type AS ENUM ('permanent', 'loan', 'free_transfer', 'swap', 'youth_promotion');
CREATE TYPE injury_severity AS ENUM ('minor', 'moderate', 'severe', 'career_threatening');
CREATE TYPE ranking_type AS ENUM ('player_overall', 'team_form', 'top_scorer', 'top_assists', 'club_world', 'player_potential', 'club_ranking');
CREATE TYPE staff_role AS ENUM ('head_coach', 'assistant_coach', 'fitness_coach', 'scout', 'analyst', 'physiotherapist', 'doctor', 'director_of_football', 'sporting_director');
CREATE TYPE entity_type_enum AS ENUM ('player', 'team', 'match', 'competition', 'venue', 'scout_report', 'article');
CREATE TYPE edge_predicate_enum AS ENUM ('played_with', 'coached_by', 'rival_of', 'injured_in', 'transferred_to', 'agent_of', 'tactical_cluster');

-- =============================================================================
-- MULTI-TENANT SAAS (MOI-014)
-- =============================================================================

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  logo_url        TEXT,
  country         VARCHAR(100),
  plan            VARCHAR(30) CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  settings        JSONB,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(100) NOT NULL,
  sport_id        sport_type,
  settings        JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (organization_id, slug)
);

CREATE TABLE tenant_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,                      -- external auth provider ID
  email           VARCHAR(255),
  full_name       VARCHAR(200),
  role            VARCHAR(50) CHECK (role IN ('admin', 'manager', 'scout', 'analyst', 'viewer')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE tenant_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role            VARCHAR(50) NOT NULL,
  resource        VARCHAR(100) NOT NULL,              -- Ex: 'matches', 'players', 'standings', 'analytics'
  permission      VARCHAR(20) NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  UNIQUE (tenant_id, role, resource)
);

CREATE INDEX idx_tenants_org ON tenants(organization_id);
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_permissions_role ON tenant_permissions(tenant_id, role);

-- =============================================================================
-- ENTITY-TENANT MAPPING (MOI-014) — Mapeamento Polimórfico de Isolamento
-- Permite compartilhamento seletivo entre ligas/clubes sem RLS pesado
-- =============================================================================

CREATE TABLE entity_tenants (
    entity_type     VARCHAR(50) NOT NULL,       -- 'player', 'team', 'match', 'scout_report'
    entity_id       UUID NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (entity_type, entity_id, tenant_id)
);

CREATE INDEX idx_entity_tenants_lookup ON entity_tenants (entity_type, entity_id);
CREATE INDEX idx_entity_tenants_tenant ON entity_tenants (tenant_id);

-- =============================================================================
-- INJEÇÃO GLOBAL DE TENANT_ID NAS TABELAS CORE
-- Aplica o padrão de isolamento lógico em todas as tabelas transacionais
-- =============================================================================

ALTER TABLE matches ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE teams ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE players ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE sport_events ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE match_state_snapshots ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE entity_embeddings ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;
ALTER TABLE tracking_frames ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;

CREATE INDEX idx_matches_tenant ON matches(tenant_id);
CREATE INDEX idx_teams_tenant ON teams(tenant_id);
CREATE INDEX idx_players_tenant ON players(tenant_id);
CREATE INDEX idx_sport_events_tenant ON sport_events(tenant_id);
CREATE INDEX idx_match_snapshots_tenant ON match_state_snapshots(tenant_id);
CREATE INDEX idx_entity_embeddings_tenant ON entity_embeddings(tenant_id);
CREATE INDEX idx_tracking_frames_tenant ON tracking_frames(tenant_id);

-- =============================================================================
-- TABELAS DE DOMÍNIO (COMPARTILHADAS)
-- =============================================================================

-- Esportes suportados pela plataforma
CREATE TABLE sports (
  id          sport_type PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  description TEXT,
  icon        VARCHAR(10)
);

-- Competições / Ligas / Torneios
CREATE TABLE competitions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id        sport_type NOT NULL REFERENCES sports(id),
  name            VARCHAR(200) NOT NULL,
  short_name      VARCHAR(20),
  country         VARCHAR(100),
  organization    VARCHAR(200),
  logo_url        TEXT,
  type            VARCHAR(50) CHECK (type IN ('league', 'cup', 'tournament', 'friendly')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Temporadas
CREATE TABLE seasons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  year_start      SMALLINT NOT NULL,
  year_end        SMALLINT NOT NULL,
  is_current      BOOLEAN NOT NULL DEFAULT FALSE,
  start_date      DATE,
  end_date        DATE,
  CONSTRAINT valid_years CHECK (year_end >= year_start)
);

-- Estádios / Ginásios / Arenas
CREATE TABLE venues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  city        VARCHAR(100),
  state       VARCHAR(100),
  country     VARCHAR(100),
  capacity    INT CHECK (capacity > 0),
  sport_type  sport_type,
  latitude    DECIMAL(10, 7),
  longitude   DECIMAL(10, 7)
);

-- Times / Clubes / Seleções
CREATE TABLE teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id      sport_type NOT NULL REFERENCES sports(id),
  name          VARCHAR(200) NOT NULL,
  short_name    VARCHAR(20),
  country       VARCHAR(100),
  city          VARCHAR(100),
  founded_year  SMALLINT,
  logo_url      TEXT,
  venue_id      UUID REFERENCES venues(id)
);

-- Participação de times em competições por temporada
CREATE TABLE competition_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  group_name      VARCHAR(50),           -- Para fase de grupos
  UNIQUE (season_id, team_id)
);

-- Jogadores / Atletas
CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id        sport_type NOT NULL REFERENCES sports(id),
  full_name       VARCHAR(200) NOT NULL,
  short_name      VARCHAR(100),
  birth_date      DATE,
  nationality     VARCHAR(100),
  height_cm       SMALLINT CHECK (height_cm > 0),
  weight_kg       DECIMAL(5,2) CHECK (weight_kg > 0),
  image_url       TEXT,
  retired         BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB                -- Dados específicos por esporte
);

-- Exemplo de metadata para cada esporte:
-- Football: { "position": "forward", "preferred_foot": "right", "shirt_number": 9 }
-- Volleyball: { "position": "outside_hitter", "reach_cm": 345, "shirt_number": 7 }
-- Basketball: { "position": "point_guard", "wingspan_cm": 201, "jersey_number": 23 }
-- Baseball:  { "primary_position": "pitcher", "batting_hand": "right", "throwing_hand": "right" }

-- Contratos / Elenco por temporada
CREATE TABLE team_players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id     UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  shirt_number  SMALLINT,
  position      VARCHAR(50),
  start_date    DATE NOT NULL,
  end_date      DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID,
  updated_by    UUID,
  UNIQUE (team_id, player_id, season_id)
);

CREATE INDEX idx_team_players_team_season ON team_players(team_id, season_id);

-- =============================================================================
-- ATRIBUTOS DO ATLETA (Core Analytics)
-- =============================================================================

CREATE TABLE player_attributes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sport_id          sport_type NOT NULL,
  season_id         UUID REFERENCES seasons(id),
  measured_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  overall           SMALLINT NOT NULL CHECK (overall BETWEEN 0 AND 100),
  potential         SMALLINT CHECK (potential BETWEEN 0 AND 100),
  pace              SMALLINT CHECK (pace BETWEEN 0 AND 100),
  acceleration      SMALLINT CHECK (acceleration BETWEEN 0 AND 100),
  stamina           SMALLINT CHECK (stamina BETWEEN 0 AND 100),
  strength          SMALLINT CHECK (strength BETWEEN 0 AND 100),
  agility           SMALLINT CHECK (agility BETWEEN 0 AND 100),
  balance           SMALLINT CHECK (balance BETWEEN 0 AND 100),
  jumping           SMALLINT CHECK (jumping BETWEEN 0 AND 100),
  reaction          SMALLINT CHECK (reaction BETWEEN 0 AND 100),
  dribbling         SMALLINT CHECK (dribbling BETWEEN 0 AND 100),
  passing           SMALLINT CHECK (passing BETWEEN 0 AND 100),
  shooting          SMALLINT CHECK (shooting BETWEEN 0 AND 100),
  finishing         SMALLINT CHECK (finishing BETWEEN 0 AND 100),
  long_shots        SMALLINT CHECK (long_shots BETWEEN 0 AND 100),
  crossing          SMALLINT CHECK (crossing BETWEEN 0 AND 100),
  heading           SMALLINT CHECK (heading BETWEEN 0 AND 100),
  marking           SMALLINT CHECK (marking BETWEEN 0 AND 100),
  tackling          SMALLINT CHECK (tackling BETWEEN 0 AND 100),
  interceptions     SMALLINT CHECK (interceptions BETWEEN 0 AND 100),
  vision            SMALLINT CHECK (vision BETWEEN 0 AND 100),
  composure         SMALLINT CHECK (composure BETWEEN 0 AND 100),
  positioning       SMALLINT CHECK (positioning BETWEEN 0 AND 100),
  decision_making   SMALLINT CHECK (decision_making BETWEEN 0 AND 100),
  teamwork          SMALLINT CHECK (teamwork BETWEEN 0 AND 100),
  leadership        SMALLINT CHECK (leadership BETWEEN 0 AND 100),
  aggression        SMALLINT CHECK (aggression BETWEEN 0 AND 100),
  diving            SMALLINT CHECK (diving BETWEEN 0 AND 100),
  handling          SMALLINT CHECK (handling BETWEEN 0 AND 100),
  kicking           SMALLINT CHECK (kicking BETWEEN 0 AND 100),
  reflexes          SMALLINT CHECK (reflexes BETWEEN 0 AND 100),
  extra_attributes  JSONB,
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- SCD Type 2
  valid_to          TIMESTAMPTZ,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_by        UUID,
  updated_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  UNIQUE (player_id, season_id, measured_at)
);

CREATE INDEX idx_player_attributes_player ON player_attributes(player_id);
CREATE INDEX idx_player_attributes_sport ON player_attributes(sport_id);
CREATE INDEX idx_player_attributes_overall ON player_attributes(overall DESC);

-- =============================================================================
-- STAFF / COMISSÃO TÉCNICA
-- =============================================================================

CREATE TABLE staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(200) NOT NULL,
  nationality     VARCHAR(100),
  birth_date      DATE,
  role            staff_role NOT NULL,
  specialty       VARCHAR(100),                    -- Ex: "preparação física", "análise de mercado"
  image_url       TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_staff_role ON staff(role);

-- Contratos de staff com times por temporada
CREATE TABLE team_staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  staff_id        UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (team_id, staff_id, season_id)
);

CREATE INDEX idx_team_staff_team ON team_staff(team_id, season_id);

-- =============================================================================
-- LESÕES DE ATLETAS
-- =============================================================================

CREATE TABLE player_injuries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  injury_type       VARCHAR(100) NOT NULL,         -- Ex: "ruptura LCA", "fratura tíbia", "estiramento muscular"
  severity          injury_severity NOT NULL,
  body_part         VARCHAR(50),                   -- Ex: "joelho", "coxa", "tornozelo"
  start_date        DATE NOT NULL,
  expected_return   DATE,
  actual_return     DATE,
  games_missed      SMALLINT DEFAULT 0,
  recurrence        BOOLEAN DEFAULT FALSE,         -- Lesão recorrente?
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_injuries_player ON player_injuries(player_id);
CREATE INDEX idx_player_injuries_dates ON player_injuries(start_date, expected_return);
CREATE INDEX idx_player_injuries_severity ON player_injuries(severity);

-- =============================================================================
-- TRANSFERÊNCIAS / MERCADO
-- =============================================================================

CREATE TABLE transfers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  from_team_id      UUID REFERENCES teams(id),     -- NULL = agente livre / base
  to_team_id        UUID NOT NULL REFERENCES teams(id),
  transfer_date     DATE NOT NULL,
  transfer_fee      DECIMAL(15,2),                 -- Valor em EUR/USD
  contract_years    SMALLINT,
  transfer_type     transfer_type NOT NULL DEFAULT 'permanent',
  season_id         UUID REFERENCES seasons(id),
  -- Metadados
  agent_name        VARCHAR(200),
  agent_fee         DECIMAL(15,2),
  sell_on_clause    DECIMAL(5,2),                  -- % de mais-valia futura
  add_ons           JSONB,                         -- Bônus por performance
  notes             TEXT,
  created_by        UUID,
  updated_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_transfers_player ON transfers(player_id);
CREATE INDEX idx_transfers_from ON transfers(from_team_id);
CREATE INDEX idx_transfers_to ON transfers(to_team_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);
CREATE INDEX idx_transfers_fee ON transfers(transfer_fee DESC);

-- =============================================================================
-- PARTIDAS
-- =============================================================================

CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id        sport_type NOT NULL REFERENCES sports(id),
  competition_id  UUID NOT NULL REFERENCES competitions(id),
  season_id       UUID NOT NULL REFERENCES seasons(id),
  home_team_id    UUID NOT NULL REFERENCES teams(id),
  away_team_id    UUID NOT NULL REFERENCES teams(id),
  venue_id        UUID REFERENCES venues(id),
  round           VARCHAR(50),                -- "Quarter-Final", "Round 1", etc.
  group_name      VARCHAR(50),
  status          match_status NOT NULL DEFAULT 'scheduled',
  scheduled_at    TIMESTAMPTZ NOT NULL,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  home_score      SMALLINT DEFAULT 0,
  away_score      SMALLINT DEFAULT 0,
  home_score_extra    SMALLINT DEFAULT 0,     -- Prorrogação
  away_score_extra    SMALLINT DEFAULT 0,
  home_score_penalties SMALLINT DEFAULT 0,    -- Penáltis
  away_score_penalties SMALLINT DEFAULT 0,
  winner_team_id  UUID REFERENCES teams(id),
  attendance      INT CHECK (attendance >= 0),
  referee         VARCHAR(200),
  metadata        JSONB,
  created_by      UUID,
  updated_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_matches_sport ON matches(sport_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_competition ON matches(competition_id, season_id);
CREATE INDEX idx_matches_team ON matches(home_team_id, away_team_id);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);
CREATE INDEX idx_matches_live ON matches(status, scheduled_at) WHERE status = 'live';

-- =============================================================================
-- LIVE STATE ENGINE (MOI-012) — Snapshots de Estado em Tempo Real
-- =============================================================================

CREATE TABLE match_state_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id           UUID NOT NULL REFERENCES teams(id),
  captured_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Placar e tempo
  minute            SMALLINT NOT NULL CHECK (minute >= 0),
  extra_minute      SMALLINT DEFAULT 0,
  period            match_period NOT NULL DEFAULT 'first_half',
  score             SMALLINT NOT NULL,
  opponent_score    SMALLINT NOT NULL,
  -- Métricas vivas
  possession        DECIMAL(5,2) CHECK (possession BETWEEN 0 AND 100),
  momentum          SMALLINT CHECK (momentum BETWEEN 0 AND 100),         -- Momento do jogo
  pressure_index    DECIMAL(5,2) CHECK (pressure_index BETWEEN 0 AND 10),-- Pressão ofensiva
  estimated_fatigue DECIMAL(5,2) CHECK (estimated_fatigue BETWEEN 0 AND 100),
  live_xg           DECIMAL(5,2) DEFAULT 0,
  live_xga          DECIMAL(5,2) DEFAULT 0,                              -- xG sofrido (expected goals against)
  -- Eventos recentes (últimos 5 min)
  shots_last_5min   SMALLINT DEFAULT 0,
  chances_created   SMALLINT DEFAULT 0,
  dangerous_attacks SMALLINT DEFAULT 0,
  -- Estado contextual
  dominant_zone     VARCHAR(20),                                          -- "left_flank", "center", "right_flank", "defensive_third", "middle_third", "final_third"
  is_pressing       BOOLEAN DEFAULT FALSE,
  is_countering     BOOLEAN DEFAULT FALSE,
  is_in_control     BOOLEAN DEFAULT FALSE,                                -- Time controlando o jogo
  -- Payload flexível
  extra_metrics     JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (captured_at);

CREATE INDEX idx_snapshots_match ON match_state_snapshots(match_id);
CREATE INDEX idx_snapshots_time ON match_state_snapshots(match_id, captured_at DESC);
CREATE INDEX idx_snapshots_minute ON match_state_snapshots(match_id, minute);

-- Tabelas de partição para snapshots (mensal)
-- CREATE TABLE match_state_snapshots_2025_04 PARTITION OF match_state_snapshots
--   FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

-- =============================================================================
-- TRACKING & SPATIAL DATA (MOI-015) — Visão Computacional / Wearables
-- =============================================================================

CREATE TABLE tracking_frames (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  frame_index       BIGINT NOT NULL,                  -- Nº do frame na partida
  captured_at       TIMESTAMPTZ NOT NULL,
  period            match_period NOT NULL,
  minute            SMALLINT NOT NULL,
  -- Metadados do frame
  source            VARCHAR(50) DEFAULT 'camera',     -- 'camera', 'wearable', 'hybrid'
  fps               SMALLINT DEFAULT 25,
  processing_time_ms INT,                              -- Latência de processamento
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, frame_index)
) PARTITION BY RANGE (captured_at);

CREATE INDEX idx_tracking_frames_match ON tracking_frames(match_id, frame_index);

CREATE TABLE player_coordinates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id          UUID NOT NULL REFERENCES tracking_frames(id) ON DELETE CASCADE,
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id),
  team_id           UUID NOT NULL REFERENCES teams(id),
  -- Posição normalizada (0.0 a 1.0 ou -1 a 1)
  pos_x             DECIMAL(6,4) NOT NULL,
  pos_y             DECIMAL(6,4) NOT NULL,
  -- Velocidade e direção
  speed_mps         DECIMAL(5,2),                     -- Metros por segundo
  acceleration_mps2 DECIMAL(5,2),                     -- m/s²
  direction_deg     SMALLINT,                         -- Graus (0-360)
  -- Metadados
  is_active_play    BOOLEAN DEFAULT TRUE,              -- Em campo ou não?
  distance_covered  DECIMAL(6,2),                     -- Distância total no frame
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_coords_frame ON player_coordinates(frame_id);
CREATE INDEX idx_player_coords_match ON player_coordinates(match_id, player_id);

CREATE TABLE ball_coordinates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id          UUID NOT NULL REFERENCES tracking_frames(id) ON DELETE CASCADE,
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  pos_x             DECIMAL(6,4) NOT NULL,
  pos_y             DECIMAL(6,4) NOT NULL,
  pos_z             DECIMAL(6,4),                     -- Altura (para chutes, cruzamentos)
  speed_mps         DECIMAL(5,2),
  direction_deg     SMALLINT,
  is_in_play        BOOLEAN DEFAULT TRUE,
  -- Evento associado (se houver)
  event_id          UUID,                              -- FK polimórfica para sport_events
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ball_coords_frame ON ball_coordinates(frame_id);
CREATE INDEX idx_ball_coords_match ON ball_coordinates(match_id);

-- =============================================================================
-- SISTEMA TÁTICO (ESCALAÇÕES / LINEUPS)
-- =============================================================================

CREATE TABLE match_lineups (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id           UUID NOT NULL REFERENCES teams(id),
  formation         VARCHAR(20) NOT NULL,
  coach_id          UUID REFERENCES staff(id),
  tactics           JSONB,
  created_by        UUID,                              -- Auditoria
  updated_by        UUID,
  is_confirmed      BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  UNIQUE (match_id, team_id)
);

CREATE INDEX idx_match_lineups_match ON match_lineups(match_id);

CREATE TABLE lineup_players (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id         UUID NOT NULL REFERENCES match_lineups(id) ON DELETE CASCADE,
  player_id         UUID NOT NULL REFERENCES players(id),
  position_x        DECIMAL(5,2),
  position_y        DECIMAL(5,2),
  shirt_number      SMALLINT,
  role              VARCHAR(50),
  is_starter        BOOLEAN NOT NULL DEFAULT TRUE,
  substituted_out   BOOLEAN DEFAULT FALSE,
  substituted_in    BOOLEAN DEFAULT FALSE,
  UNIQUE (lineup_id, player_id)
);

CREATE INDEX idx_lineup_players_lineup ON lineup_players(lineup_id);
CREATE INDEX idx_lineup_players_player ON lineup_players(player_id);

-- =============================================================================
-- RANKING GLOBAL (Jogadores, Clubes, Ligas)
-- =============================================================================

CREATE TABLE rankings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id          sport_type NOT NULL,
  ranking_type      ranking_type NOT NULL,
  entity_id         UUID NOT NULL,
  entity_type       VARCHAR(30) NOT NULL CHECK (entity_type IN ('player', 'team', 'competition')),
  score             DECIMAL(10,2) NOT NULL,
  position          SMALLINT,
  metadata          JSONB,
  valid_from        TIMESTAMPTZ NOT NULL DEFAULT NOW(),   -- SCD Type 2
  valid_to          TIMESTAMPTZ,                          -- NULL = versão atual
  created_by        UUID,
  updated_by        UUID,
  calculated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_rankings_sport_type ON rankings(sport_id, ranking_type);
CREATE INDEX idx_rankings_score ON rankings(score DESC);
CREATE INDEX idx_rankings_entity ON rankings(entity_id);
CREATE INDEX idx_rankings_calculated ON rankings(calculated_at);

-- =============================================================================
-- MÍDIA E ASSETS (Fotos, Vídeos, Escudos, Streams)
-- =============================================================================

CREATE TABLE media_assets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type       VARCHAR(30) NOT NULL,         -- 'player', 'team', 'competition', 'match', 'venue'
  entity_id         UUID NOT NULL,
  media_type        VARCHAR(30) NOT NULL,         -- 'image', 'video', 'logo', 'icon', 'stream'
  url               TEXT NOT NULL,
  title             VARCHAR(200),
  alt_text          VARCHAR(500),
  width             INT,
  height            INT,
  file_size_bytes   BIGINT,
  mime_type         VARCHAR(50),
  is_primary        BOOLEAN DEFAULT FALSE,        -- Imagem principal do perfil
  sort_order        SMALLINT DEFAULT 0,
  metadata          JSONB,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_media_entity ON media_assets(entity_type, entity_id);
CREATE INDEX idx_media_type ON media_assets(media_type);
CREATE INDEX idx_media_primary ON media_assets(entity_type, entity_id, is_primary) WHERE is_primary = TRUE;

-- =============================================================================
-- PROBABILIDADES E APOSTAS (Odds / Betting)
-- =============================================================================

CREATE TABLE odds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  bookmaker         VARCHAR(100) NOT NULL,
  home_win          DECIMAL(10,4) NOT NULL CHECK (home_win > 0),
  draw              DECIMAL(10,4) CHECK (draw > 0),      -- NULL para esportes sem empate
  away_win          DECIMAL(10,4) NOT NULL CHECK (away_win > 0),
  -- Mercados adicionais (JSONB para flexibilidade)
  over_under        JSONB,                               -- Ex: {"2.5": {"over": 1.80, "under": 2.00}}
  both_teams_score  JSONB,                               -- Ex: {"yes": 1.90, "no": 1.95}
  asian_handicap    JSONB,                               -- Ex: {"-1.5": {"home": 2.10, "away": 1.75}}
  -- Metadados
  is_boosted        BOOLEAN DEFAULT FALSE,                -- Odd promocional?
  probability_home  DECIMAL(5,2),                         -- Probabilidade implícita (%)
  probability_draw  DECIMAL(5,2),
  probability_away  DECIMAL(5,2),
  margin            DECIMAL(5,2),                         -- Vigorish / margem da casa
  source            VARCHAR(100),
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, bookmaker, created_at)
);

CREATE INDEX idx_odds_match ON odds(match_id);
CREATE INDEX idx_odds_bookmaker ON odds(bookmaker);
CREATE INDEX idx_odds_updated ON odds(updated_at DESC);

-- =============================================================================
-- TABELAS ESPECÍFICAS DE FUTEBOL
-- =============================================================================

-- Estatísticas agregadas por partida (Football)
CREATE TABLE football_match_stats (
  match_id              UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_possession       DECIMAL(5,2) CHECK (home_possession BETWEEN 0 AND 100),
  away_possession       DECIMAL(5,2) CHECK (away_possession BETWEEN 0 AND 100),
  home_shots            SMALLINT DEFAULT 0,
  away_shots            SMALLINT DEFAULT 0,
  home_shots_on_target  SMALLINT DEFAULT 0,
  away_shots_on_target  SMALLINT DEFAULT 0,
  home_corners          SMALLINT DEFAULT 0,
  away_corners          SMALLINT DEFAULT 0,
  home_fouls            SMALLINT DEFAULT 0,
  away_fouls            SMALLINT DEFAULT 0,
  home_offsides         SMALLINT DEFAULT 0,
  away_offsides         SMALLINT DEFAULT 0,
  home_yellow_cards     SMALLINT DEFAULT 0,
  away_yellow_cards     SMALLINT DEFAULT 0,
  home_red_cards        SMALLINT DEFAULT 0,
  away_red_cards        SMALLINT DEFAULT 0,
  home_throw_ins        SMALLINT DEFAULT 0,   -- Laterais
  away_throw_ins        SMALLINT DEFAULT 0,
  home_goal_kicks       SMALLINT DEFAULT 0,
  away_goal_kicks       SMALLINT DEFAULT 0,
  home_free_kicks       SMALLINT DEFAULT 0,
  away_free_kicks       SMALLINT DEFAULT 0,
  home_xg               DECIMAL(5,2) DEFAULT 0,  -- Expected Goals
  away_xg               DECIMAL(5,2) DEFAULT 0,
  home_saves            SMALLINT DEFAULT 0,
  away_saves            SMALLINT DEFAULT 0,
  home_passes           INT DEFAULT 0,
  away_passes           INT DEFAULT 0,
  home_pass_accuracy    DECIMAL(5,2) CHECK (home_pass_accuracy BETWEEN 0 AND 100),
  away_pass_accuracy    DECIMAL(5,2) CHECK (away_pass_accuracy BETWEEN 0 AND 100),
  home_ball_recoveries  SMALLINT DEFAULT 0,
  away_ball_recoveries  SMALLINT DEFAULT 0,
  home_dribbles         SMALLINT DEFAULT 0,
  away_dribbles         SMALLINT DEFAULT 0,
  home_tackles          SMALLINT DEFAULT 0,
  away_tackles          SMALLINT DEFAULT 0,
  home_interceptions    SMALLINT DEFAULT 0,
  away_interceptions    SMALLINT DEFAULT 0,
  home_clearances       SMALLINT DEFAULT 0,
  away_clearances       SMALLINT DEFAULT 0,
  home_crosses          SMALLINT DEFAULT 0,
  away_crosses          SMALLINT DEFAULT 0
);

-- Eventos de futebol (linha do tempo)
CREATE TABLE football_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  player_id       UUID REFERENCES players(id),
  event_type      football_event_type NOT NULL,
  minute          SMALLINT NOT NULL CHECK (minute >= 0 AND minute <= 120),
  extra_minute    SMALLINT DEFAULT 0,         -- Acréscimos
  period          match_period NOT NULL DEFAULT 'first_half',
  -- Específico para gols
  scorer_id       UUID REFERENCES players(id),
  assist_id       UUID REFERENCES players(id),
  goal_type       VARCHAR(20) CHECK (goal_type IN ('open_play', 'penalty', 'free_kick', 'corner', 'header', 'own_goal')),
  -- Específico para cartões
  card_type       card_type,
  card_reason     TEXT,
  -- Específico para substituições
  player_off_id   UUID REFERENCES players(id),
  player_on_id    UUID REFERENCES players(id),
  substitution_reason VARCHAR(50) CHECK (substitution_reason IN ('tactical', 'injury', 'time_wasting')),
  -- Coordenadas do evento
  pos_x           DECIMAL(5,2),               -- 0-100 (% do campo)
  pos_y           DECIMAL(5,2),
  detail          TEXT,                        -- Informação adicional
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_football_events_match ON football_events(match_id);
CREATE INDEX idx_football_events_player ON football_events(player_id);
CREATE INDEX idx_football_events_minute ON football_events(match_id, minute);

-- Estatísticas individuais por partida (Football)
CREATE TABLE football_player_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  team_id         UUID NOT NULL REFERENCES teams(id),
  minutes_played  SMALLINT DEFAULT 0,
  goals           SMALLINT DEFAULT 0,
  assists         SMALLINT DEFAULT 0,
  shots           SMALLINT DEFAULT 0,
  shots_on_target SMALLINT DEFAULT 0,
  passes          INT DEFAULT 0,
  pass_accuracy   DECIMAL(5,2) CHECK (pass_accuracy BETWEEN 0 AND 100),
  tackles         SMALLINT DEFAULT 0,
  interceptions   SMALLINT DEFAULT 0,
  clearances      SMALLINT DEFAULT 0,
  dribbles        SMALLINT DEFAULT 0,
  fouls_committed SMALLINT DEFAULT 0,
  fouls_suffered  SMALLINT DEFAULT 0,
  yellow_cards    SMALLINT DEFAULT 0,
  red_cards       SMALLINT DEFAULT 0,
  offsides        SMALLINT DEFAULT 0,
  corners_taken   SMALLINT DEFAULT 0,
  crosses         SMALLINT DEFAULT 0,
  saves           SMALLINT DEFAULT 0,          -- Goleiros
  goals_conceded  SMALLINT DEFAULT 0,
  rating          DECIMAL(4,2) CHECK (rating BETWEEN 0 AND 10),
  created_by      UUID,
  updated_by      UUID,
  UNIQUE (match_id, player_id)
);

CREATE INDEX idx_football_stats_player ON football_player_stats(player_id);

-- =============================================================================
-- TABELAS ESPECÍFICAS DE VÔLEI
-- =============================================================================

-- Sets de uma partida de vôlei
CREATE TABLE volleyball_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_number  SMALLINT NOT NULL CHECK (set_number BETWEEN 1 AND 5),
  home_score  SMALLINT NOT NULL DEFAULT 0,
  away_score  SMALLINT NOT NULL DEFAULT 0,
  duration_seconds INT,
  UNIQUE (match_id, set_number)
);

-- Estatísticas agregadas por partida (Vôlei)
CREATE TABLE volleyball_match_stats (
  match_id            UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_aces           SMALLINT DEFAULT 0,
  away_aces           SMALLINT DEFAULT 0,
  home_blocks         SMALLINT DEFAULT 0,
  away_blocks         SMALLINT DEFAULT 0,
  home_attacks        SMALLINT DEFAULT 0,
  away_attacks        SMALLINT DEFAULT 0,
  home_attack_errors  SMALLINT DEFAULT 0,
  away_attack_errors  SMALLINT DEFAULT 0,
  home_kill_percentage DECIMAL(5,2) CHECK (home_kill_percentage BETWEEN 0 AND 100),
  away_kill_percentage DECIMAL(5,2) CHECK (away_kill_percentage BETWEEN 0 AND 100),
  home_digs           SMALLINT DEFAULT 0,
  away_digs           SMALLINT DEFAULT 0,
  home_assists        SMALLINT DEFAULT 0,
  away_assists        SMALLINT DEFAULT 0,
  home_service_errors SMALLINT DEFAULT 0,
  away_service_errors SMALLINT DEFAULT 0,
  home_reception_errors SMALLINT DEFAULT 0,
  away_reception_errors SMALLINT DEFAULT 0
);

-- Eventos de vôlei (linha do tempo)
CREATE TABLE volleyball_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  set_id          UUID NOT NULL REFERENCES volleyball_sets(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  player_id       UUID REFERENCES players(id),
  event_type      volleyball_event_type NOT NULL,
  point_home      SMALLINT NOT NULL,      -- Pontuação no momento
  point_away      SMALLINT NOT NULL,
  rotation        SMALLINT CHECK (rotation BETWEEN 1 AND 6),  -- Posição na rotação
  zone            VARCHAR(10),            -- Zona da quadra (1-9)
  detail          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_volleyball_events_match ON volleyball_events(match_id);

-- Estatísticas individuais por partida (Vôlei)
CREATE TABLE volleyball_player_stats (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id),
  team_id         UUID NOT NULL REFERENCES teams(id),
  sets_played     SMALLINT DEFAULT 0,
  points          SMALLINT DEFAULT 0,
  attacks         SMALLINT DEFAULT 0,
  kills           SMALLINT DEFAULT 0,
  attack_errors   SMALLINT DEFAULT 0,
  attack_percentage DECIMAL(5,2) CHECK (attack_percentage BETWEEN 0 AND 100),
  blocks          SMALLINT DEFAULT 0,
  block_errors    SMALLINT DEFAULT 0,
  aces            SMALLINT DEFAULT 0,
  service_errors  SMALLINT DEFAULT 0,
  digs            SMALLINT DEFAULT 0,
  reception_errors SMALLINT DEFAULT 0,
  assists         SMALLINT DEFAULT 0,
  UNIQUE (match_id, player_id)
);

-- =============================================================================
-- TABELAS ESPECÍFICAS DE BASQUETE
-- =============================================================================

-- Períodos/Quartos de uma partida de basquete
CREATE TABLE basketball_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  period_number   SMALLINT NOT NULL CHECK (period_number BETWEEN 1 AND 8),
  period_type     VARCHAR(20) CHECK (period_type IN ('quarter', 'half', 'overtime')),
  home_score      SMALLINT NOT NULL DEFAULT 0,
  away_score      SMALLINT NOT NULL DEFAULT 0,
  duration_seconds INT,
  UNIQUE (match_id, period_number)
);

-- Estatísticas agregadas por partida (Basquete)
CREATE TABLE basketball_match_stats (
  match_id              UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_field_goals_made     SMALLINT DEFAULT 0,
  away_field_goals_made     SMALLINT DEFAULT 0,
  home_field_goals_attempted SMALLINT DEFAULT 0,
  away_field_goals_attempted SMALLINT DEFAULT 0,
  home_three_made           SMALLINT DEFAULT 0,
  away_three_made           SMALLINT DEFAULT 0,
  home_three_attempted      SMALLINT DEFAULT 0,
  away_three_attempted      SMALLINT DEFAULT 0,
  home_free_throws_made     SMALLINT DEFAULT 0,
  away_free_throws_made     SMALLINT DEFAULT 0,
  home_free_throws_attempted SMALLINT DEFAULT 0,
  away_free_throws_attempted SMALLINT DEFAULT 0,
  home_rebounds_offensive   SMALLINT DEFAULT 0,
  away_rebounds_offensive   SMALLINT DEFAULT 0,
  home_rebounds_defensive   SMALLINT DEFAULT 0,
  away_rebounds_defensive   SMALLINT DEFAULT 0,
  home_assists              SMALLINT DEFAULT 0,
  away_assists              SMALLINT DEFAULT 0,
  home_steals               SMALLINT DEFAULT 0,
  away_steals               SMALLINT DEFAULT 0,
  home_blocks               SMALLINT DEFAULT 0,
  away_blocks               SMALLINT DEFAULT 0,
  home_turnovers            SMALLINT DEFAULT 0,
  away_turnovers            SMALLINT DEFAULT 0,
  home_personal_fouls       SMALLINT DEFAULT 0,
  away_personal_fouls       SMALLINT DEFAULT 0,
  home_technical_fouls      SMALLINT DEFAULT 0,
  away_technical_fouls      SMALLINT DEFAULT 0,
  home_flagrant_fouls       SMALLINT DEFAULT 0,
  away_flagrant_fouls       SMALLINT DEFAULT 0,
  home_fast_break_points    SMALLINT DEFAULT 0,
  away_fast_break_points    SMALLINT DEFAULT 0,
  home_points_in_paint      SMALLINT DEFAULT 0,
  away_points_in_paint      SMALLINT DEFAULT 0,
  home_second_chance_points SMALLINT DEFAULT 0,
  away_second_chance_points SMALLINT DEFAULT 0,
  home_biggest_lead         SMALLINT DEFAULT 0,
  away_biggest_lead         SMALLINT DEFAULT 0,
  home_timeouts             SMALLINT DEFAULT 0,
  away_timeouts             SMALLINT DEFAULT 0,
  home_fouls_total          SMALLINT DEFAULT 0,
  away_fouls_total          SMALLINT DEFAULT 0,
  home_field_goal_pct       DECIMAL(5,2) CHECK (home_field_goal_pct BETWEEN 0 AND 100),
  away_field_goal_pct       DECIMAL(5,2) CHECK (away_field_goal_pct BETWEEN 0 AND 100),
  home_three_pct            DECIMAL(5,2) CHECK (home_three_pct BETWEEN 0 AND 100),
  away_three_pct            DECIMAL(5,2) CHECK (away_three_pct BETWEEN 0 AND 100),
  home_free_throw_pct       DECIMAL(5,2) CHECK (home_free_throw_pct BETWEEN 0 AND 100),
  away_free_throw_pct       DECIMAL(5,2) CHECK (away_free_throw_pct BETWEEN 0 AND 100)
);

-- Eventos de basquete (linha do tempo)
CREATE TABLE basketball_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  period_id         UUID NOT NULL REFERENCES basketball_periods(id) ON DELETE CASCADE,
  team_id           UUID NOT NULL REFERENCES teams(id),
  player_id         UUID REFERENCES players(id),
  event_type        basketball_event_type NOT NULL,
  minute            SMALLINT NOT NULL CHECK (minute >= 0),
  seconds_remaining SMALLINT CHECK (seconds_remaining >= 0),
  home_score        SMALLINT NOT NULL,
  away_score        SMALLINT NOT NULL,
  -- Específico para arremessos
  shot_distance     DECIMAL(4,1),           -- Em pés
  shot_zone         VARCHAR(20),            -- "restricted_area", "paint", "mid_range", "above_break_3", "corner_3"
  shot_made         BOOLEAN,
  assisted_by       UUID REFERENCES players(id),
  -- Específico para rebotes
  rebound_type      VARCHAR(20) CHECK (rebound_type IN ('offensive', 'defensive')),
  -- Específico para faltas
  foul_type         foul_type,
  -- Coordenadas da quadra
  pos_x             DECIMAL(5,2),
  pos_y             DECIMAL(5,2),
  detail            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_basketball_events_match ON basketball_events(match_id);
CREATE INDEX idx_basketball_events_player ON basketball_events(player_id);

-- Estatísticas individuais por partida (Basquete)
CREATE TABLE basketball_player_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id              UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id             UUID NOT NULL REFERENCES players(id),
  team_id               UUID NOT NULL REFERENCES teams(id),
  minutes_played        SMALLINT DEFAULT 0,
  points                SMALLINT DEFAULT 0,
  field_goals_made      SMALLINT DEFAULT 0,
  field_goals_attempted SMALLINT DEFAULT 0,
  three_made            SMALLINT DEFAULT 0,
  three_attempted       SMALLINT DEFAULT 0,
  free_throws_made      SMALLINT DEFAULT 0,
  free_throws_attempted SMALLINT DEFAULT 0,
  rebounds_offensive    SMALLINT DEFAULT 0,
  rebounds_defensive    SMALLINT DEFAULT 0,
  assists               SMALLINT DEFAULT 0,
  steals                SMALLINT DEFAULT 0,
  blocks                SMALLINT DEFAULT 0,
  turnovers             SMALLINT DEFAULT 0,
  personal_fouls        SMALLINT DEFAULT 0,
  plus_minus            SMALLINT DEFAULT 0,       -- +/- quando estava em quadra
  efficiency            SMALLINT DEFAULT 0,       -- Rating de eficiência
  UNIQUE (match_id, player_id)
);

-- =============================================================================
-- TABELAS ESPECÍFICAS DE BASEBALL
-- =============================================================================

-- Innings de uma partida de baseball
CREATE TABLE baseball_innings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  inning_number SMALLINT NOT NULL CHECK (inning_number BETWEEN 1 AND 20),
  is_top      BOOLEAN NOT NULL,             -- true = topo (visitante ataca), false = base (casa ataca)
  home_score  SMALLINT NOT NULL DEFAULT 0,
  away_score  SMALLINT NOT NULL DEFAULT 0,
  runs_scored SMALLINT DEFAULT 0,
  hits        SMALLINT DEFAULT 0,
  errors      SMALLINT DEFAULT 0,
  left_on_base SMALLINT DEFAULT 0,
  duration_seconds INT,
  UNIQUE (match_id, inning_number, is_top)
);

-- Estatísticas agregadas por partida (Baseball)
CREATE TABLE baseball_match_stats (
  match_id              UUID PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_runs             SMALLINT DEFAULT 0,
  away_runs             SMALLINT DEFAULT 0,
  home_hits             SMALLINT DEFAULT 0,
  away_hits             SMALLINT DEFAULT 0,
  home_errors           SMALLINT DEFAULT 0,
  away_errors           SMALLINT DEFAULT 0,
  home_walks            SMALLINT DEFAULT 0,
  away_walks            SMALLINT DEFAULT 0,
  home_strikeouts       SMALLINT DEFAULT 0,
  away_strikeouts       SMALLINT DEFAULT 0,
  home_home_runs        SMALLINT DEFAULT 0,
  away_home_runs        SMALLINT DEFAULT 0,
  home_doubles          SMALLINT DEFAULT 0,
  away_doubles          SMALLINT DEFAULT 0,
  home_triples          SMALLINT DEFAULT 0,
  away_triples          SMALLINT DEFAULT 0,
  home_stolen_bases     SMALLINT DEFAULT 0,
  away_stolen_bases     SMALLINT DEFAULT 0,
  home_caught_stealing  SMALLINT DEFAULT 0,
  away_caught_stealing  SMALLINT DEFAULT 0,
  home_double_plays     SMALLINT DEFAULT 0,
  away_double_plays     SMALLINT DEFAULT 0,
  home_left_on_base     SMALLINT DEFAULT 0,
  away_left_on_base     SMALLINT DEFAULT 0,
  home_at_bats          SMALLINT DEFAULT 0,
  away_at_bats          SMALLINT DEFAULT 0,
  home_batting_avg      DECIMAL(5,3) CHECK (home_batting_avg BETWEEN 0 AND 1),
  away_batting_avg      DECIMAL(5,3) CHECK (away_batting_avg BETWEEN 0 AND 1),
  home_on_base_pct      DECIMAL(5,3) CHECK (home_on_base_pct BETWEEN 0 AND 1),
  away_on_base_pct      DECIMAL(5,3) CHECK (away_on_base_pct BETWEEN 0 AND 1),
  home_slugging_pct     DECIMAL(5,3) CHECK (home_slugging_pct BETWEEN 0 AND 1),
  away_slugging_pct     DECIMAL(5,3) CHECK (away_slugging_pct BETWEEN 0 AND 1),
  home_pitches_count    SMALLINT DEFAULT 0,
  away_pitches_count    SMALLINT DEFAULT 0,
  home_strikes          SMALLINT DEFAULT 0,
  away_strikes          SMALLINT DEFAULT 0,
  home_balls            SMALLINT DEFAULT 0,
  away_balls            SMALLINT DEFAULT 0
);

-- Eventos de baseball (linha do tempo)
CREATE TABLE baseball_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  inning_id       UUID NOT NULL REFERENCES baseball_innings(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  batter_id       UUID REFERENCES players(id),
  pitcher_id      UUID REFERENCES players(id),
  event_type      baseball_event_type NOT NULL,
  outs           SMALLINT NOT NULL CHECK (outs BETWEEN 0 AND 2),
  balls          SMALLINT NOT NULL CHECK (balls BETWEEN 0 AND 3),
  strikes        SMALLINT NOT NULL CHECK (strikes BETWEEN 0 AND 2),
  home_score      SMALLINT NOT NULL,
  away_score      SMALLINT NOT NULL,
  -- Específico para rebatidas
  hit_type        VARCHAR(20) CHECK (hit_type IN ('single', 'double', 'triple', 'home_run')),
  rbi             SMALLINT DEFAULT 0,
  -- Bases ocupadas
  runner_on_first   BOOLEAN DEFAULT FALSE,
  runner_on_second  BOOLEAN DEFAULT FALSE,
  runner_on_third   BOOLEAN DEFAULT FALSE,
  -- Específico para arremessos
  pitch_type      VARCHAR(20),             -- "fastball", "curveball", "slider", "changeup", "sinker"
  pitch_speed_mph SMALLINT,
  -- Coordenadas da rebatida
  exit_velocity   DECIMAL(5,1),            -- Velocidade de saída (mph)
  launch_angle    DECIMAL(4,1),            -- Ângulo de lançamento (graus)
  hit_distance    SMALLINT,                -- Distância (pés)
  hit_zone        VARCHAR(10),             -- Zona do campo
  detail          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_baseball_events_match ON baseball_events(match_id);
CREATE INDEX idx_baseball_events_player ON baseball_events(batter_id, pitcher_id);

-- =============================================================================
-- UNIVERSAL EVENT ENGINE (MOI-011) — Evento Polimórfico Multi-Esporte
-- Arquitetura Híbrida: Escrita normalizada aqui, leitura via MVs por esporte
-- =============================================================================

CREATE TABLE sport_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sport_id          sport_type NOT NULL,
  team_id           UUID NOT NULL REFERENCES teams(id),
  player_id         UUID REFERENCES players(id),
  event_type        VARCHAR(50) NOT NULL,             -- 'goal', 'card', 'point', 'two_pointer', 'hit', etc.
  -- Temporais
  minute            SMALLINT NOT NULL CHECK (minute >= 0),
  extra_minute      SMALLINT DEFAULT 0,
  period            match_period NOT NULL DEFAULT 'first_half',
  -- Score no momento do evento
  current_home_score SMALLINT NOT NULL DEFAULT 0,
  current_away_score SMALLINT NOT NULL DEFAULT 0,
  -- Payload específico do esporte (JSONB)
  payload           JSONB NOT NULL,                   -- Dados específicos: gols, cartões, arremessos, rebatidas
  -- Participantes secundários
  secondary_player_id UUID REFERENCES players(id),    -- Assistente, 2º assistente, rebatedor, etc.
  -- Coordenadas
  pos_x             DECIMAL(5,2),
  pos_y             DECIMAL(5,2),
  -- Metadados
  tags              TEXT[],                            -- Tags para categorização: 'important', 'controversial', 'highlight'
  description       TEXT,
  source            VARCHAR(50) DEFAULT 'manual',      -- 'manual', 'api', 'computer_vision', 'scout'
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_sport_events_match ON sport_events(match_id);
CREATE INDEX idx_sport_events_sport ON sport_events(sport_id);
CREATE INDEX idx_sport_events_player ON sport_events(player_id);
CREATE INDEX idx_sport_events_type ON sport_events(event_type);
CREATE INDEX idx_sport_events_time ON sport_events(match_id, minute);

-- Views materializadas por esporte (leitura desnormalizada)
-- CREATE MATERIALIZED VIEW mv_football_events AS
-- SELECT se.*, p.payload->>'goal_type' AS goal_type, ...
-- FROM sport_events se WHERE se.sport_id = 'football';

-- =============================================================================
-- CLASSIFICAÇÃO
-- =============================================================================

-- Tabela flexível de classificação para qualquer esporte/competição
CREATE TABLE standings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id  UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  season_id       UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  group_name      VARCHAR(50),
  position        SMALLINT NOT NULL,
  played          SMALLINT NOT NULL DEFAULT 0,
  wins            SMALLINT NOT NULL DEFAULT 0,
  draws           SMALLINT NOT NULL DEFAULT 0,     -- 0 para esportes sem empate
  losses          SMALLINT NOT NULL DEFAULT 0,
  points          SMALLINT NOT NULL DEFAULT 0,
  goals_for       SMALLINT DEFAULT 0,
  goals_against   SMALLINT DEFAULT 0,
  goal_difference SMALLINT DEFAULT 0,
  -- Estatísticas extras (JSONB para flexibilidade)
  extra_stats     JSONB,
  valid_from      TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- SCD Type 2
  valid_to        TIMESTAMPTZ,
  created_by      UUID,
  updated_by      UUID,
  deleted_at      TIMESTAMPTZ,
  UNIQUE (season_id, team_id, group_name)
);

-- =============================================================================
-- FUNÇÕES E TRIGGERS
-- =============================================================================

-- Atualizar updated_at em matches
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calcular saldo de gols na classificação
CREATE OR REPLACE FUNCTION update_standings_goal_diff()
RETURNS TRIGGER AS $$
BEGIN
  NEW.goal_difference := NEW.goals_for - NEW.goals_against;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_standings_goal_diff
  BEFORE INSERT OR UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_standings_goal_diff();

-- =============================================================================
-- VIEWS ÚTEIS
-- =============================================================================

-- Calendário completo de partidas por competição
CREATE VIEW v_match_schedule AS
SELECT
  m.id AS match_id,
  c.name AS competition,
  s.name AS season,
  ht.name AS home_team,
  at.name AS away_team,
  v.name AS venue,
  m.round,
  m.scheduled_at,
  m.status,
  m.home_score,
  m.away_score
FROM matches m
JOIN competitions c ON c.id = m.competition_id
JOIN seasons s ON s.id = m.season_id
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
LEFT JOIN venues v ON v.id = m.venue_id;

-- Classificação com joined teams
CREATE VIEW v_standings AS
SELECT
  st.position,
  t.name AS team_name,
  t.short_name,
  st.played,
  st.wins,
  st.draws,
  st.losses,
  st.goals_for,
  st.goals_against,
  st.goal_difference,
  st.points,
  c.name AS competition,
  s.name AS season
FROM standings st
JOIN teams t ON t.id = st.team_id
JOIN competitions c ON c.id = st.competition_id
JOIN seasons s ON s.id = st.season_id
ORDER BY st.position;

-- =============================================================================
-- MATERIALIZED VIEWS (Analytics)
-- =============================================================================

-- Artilheiros por competição/temporada
CREATE MATERIALIZED VIEW mv_top_scorers AS
SELECT
  p.id AS player_id,
  p.full_name,
  t.name AS team_name,
  m.competition_id,
  m.season_id,
  COUNT(DISTINCT m.id) AS matches_played,
  SUM(fps.goals) AS total_goals,
  SUM(fps.assists) AS total_assists,
  SUM(fps.minutes_played) AS total_minutes,
  ROUND(SUM(fps.goals)::DECIMAL / NULLIF(COUNT(DISTINCT m.id), 0), 2) AS goals_per_match
FROM players p
JOIN football_player_stats fps ON fps.player_id = p.id
JOIN matches m ON m.id = fps.match_id
JOIN teams t ON t.id = fps.team_id
GROUP BY p.id, p.full_name, t.name, m.competition_id, m.season_id
ORDER BY total_goals DESC;

CREATE UNIQUE INDEX idx_mv_top_scorers ON mv_top_scorers(player_id, competition_id, season_id);
CREATE INDEX idx_mv_top_scorers_goals ON mv_top_scorers(total_goals DESC);

-- Classificação com médias e aproveitamento
CREATE MATERIALIZED VIEW mv_standings_enhanced AS
SELECT
  st.id AS standing_id,
  st.competition_id,
  st.season_id,
  st.team_id,
  t.name AS team_name,
  t.short_name AS team_short,
  st.position,
  st.played,
  st.wins,
  st.draws,
  st.losses,
  st.points,
  st.goals_for,
  st.goals_against,
  st.goal_difference,
  CASE WHEN st.played > 0
    THEN ROUND((st.points::DECIMAL / (st.played * 3)) * 100, 1)
    ELSE 0
  END AS points_pct,
  CASE WHEN st.played > 0
    THEN ROUND(st.goals_for::DECIMAL / st.played, 2)
    ELSE 0
  END AS goals_per_game,
  CASE WHEN st.played > 0
    THEN ROUND(st.goals_against::DECIMAL / st.played, 2)
    ELSE 0
  END AS conceded_per_game,
  c.name AS competition_name,
  s.name AS season_name
FROM standings st
JOIN teams t ON t.id = st.team_id
JOIN competitions c ON c.id = st.competition_id
JOIN seasons s ON s.id = st.season_id
ORDER BY st.position;

CREATE UNIQUE INDEX idx_mv_standings_enhanced ON mv_standings_enhanced(standing_id);
CREATE INDEX idx_mv_standings_comp ON mv_standings_enhanced(competition_id, season_id);

-- Forma recente dos times (últimos 5 jogos)
CREATE MATERIALIZED VIEW mv_team_recent_form AS
SELECT
  team_id,
  competition_id,
  season_id,
  COUNT(*) AS total_matches,
  SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) AS wins,
  SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) AS draws,
  SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) AS losses,
  jsonb_agg(result ORDER BY match_date DESC) AS recent_form
FROM (
  SELECT
    m.home_team_id AS team_id,
    m.competition_id,
    m.season_id,
    m.scheduled_at AS match_date,
    CASE
      WHEN m.home_score > m.away_score THEN 'win'
      WHEN m.home_score = m.away_score THEN 'draw'
      ELSE 'loss'
    END AS result
  FROM matches m
  WHERE m.status = 'finished'
  UNION ALL
  SELECT
    m.away_team_id AS team_id,
    m.competition_id,
    m.season_id,
    m.scheduled_at,
    CASE
      WHEN m.away_score > m.home_score THEN 'win'
      WHEN m.away_score = m.home_score THEN 'draw'
      ELSE 'loss'
    END AS result
  FROM matches m
  WHERE m.status = 'finished'
) form_data
GROUP BY team_id, competition_id, season_id;

CREATE UNIQUE INDEX idx_mv_team_recent_form ON mv_team_recent_form(team_id, competition_id, season_id);

-- =============================================================================
-- AI EMBEDDINGS LAYER (MOI-013) — Busca Semântica e RAG Esportivo
-- Requer extensão pgvector: CREATE EXTENSION IF NOT EXISTS vector;
-- =============================================================================

CREATE TABLE entity_embeddings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type       VARCHAR(30) NOT NULL,             -- 'player', 'team', 'match', 'article', 'scout_report'
  entity_id         UUID NOT NULL,
  -- Vetor de embedding (dimensionalidade varia por modelo, ex: 384 para all-MiniLM, 1536 para OpenAI)
  embedding         VECTOR(384) NOT NULL,
  -- Fonte do embedding
  source_text       TEXT NOT NULL,                    -- Texto original que gerou o embedding
  source_field      VARCHAR(100),                     -- 'biography', 'scout_notes', 'match_report', 'description'
  model_name        VARCHAR(100) DEFAULT 'all-MiniLM-L6-v2',
  model_version     VARCHAR(20),
  -- Metadados
  chunk_index       SMALLINT DEFAULT 0,               -- Para textos longos divididos em chunks
  total_chunks      SMALLINT DEFAULT 1,
  metadata          JSONB,
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_embeddings_entity ON entity_embeddings(entity_type, entity_id);
CREATE INDEX idx_embeddings_model ON entity_embeddings(model_name);

-- Índice de similaridade IVFFlat (para busca por aproximação)
-- CREATE INDEX idx_embeddings_cosine ON entity_embeddings
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Exemplo de query de similaridade:
-- SELECT e2.entity_type, e2.entity_id, e2.source_text,
--        1 - (e1.embedding <=> e2.embedding) AS similarity
-- FROM entity_embeddings e1
-- JOIN entity_embeddings e2 ON e2.id != e1.id
-- WHERE e1.entity_id = 'p1' AND e1.entity_type = 'player'
--   AND e2.entity_type = 'player'
-- ORDER BY similarity DESC
-- LIMIT 10;

-- =============================================================================
-- PARTITIONING (NOTA)
-- Tabelas de alta volumetria devem ser particionadas em produção.
-- Descomente e ajuste ao criar as tabelas em um banco real:
--
-- CREATE TABLE football_events (
--   ...
-- ) PARTITION BY RANGE (created_at);
--
-- CREATE TABLE football_events_2025_q1 PARTITION OF football_events
--   FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
--
-- Tabelas recomendadas para particionamento:
-- - football_events (por mês/trimestre)
-- - basketball_events
-- - volleyball_events
-- - baseball_events
-- - sport_events_v3 (por mês) ← NOVO (event sourcing)
-- - sport_events (por mês)
-- - match_state_snapshots (por mês)
-- - tracking_frames (por dia)
-- - graph_edges (por mês, opcional)
-- - football_player_stats
-- - basketball_player_stats
-- - volleyball_player_stats
-- - baseball_batter_stats
-- - baseball_pitcher_stats
-- =============================================================================

-- =============================================================================
-- ROW-LEVEL SECURITY (MOI-014) — Isolamento Multi-Tenant Ativo
-- As políticas abaixo validam tenant_id via variável de sessão da aplicação
-- O backend (FastAPI/Next.js) deve setar app.current_tenant_id a cada requisição
-- =============================================================================

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_state_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_matches ON matches
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_players ON players
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_teams ON teams
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_sport_events ON sport_events
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_embeddings ON entity_embeddings
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_snapshots ON match_state_snapshots
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_tracking ON tracking_frames
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- =============================================================================
-- KNOWLEDGE GRAPH LAYER — SPORTS COGNITION ENGINE (MOI-016)
-- Modelo de Grafo Semântico para Raciocínio Contextual e Scouting Relacional
-- =============================================================================

CREATE TABLE graph_nodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_type     entity_type_enum NOT NULL,
    entity_id       UUID NOT NULL,                    -- FK polimórfica para tabelas relacionais
    node_label      VARCHAR(255) NOT NULL,             -- Cache de rótulo (evita JOIN pesado)
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, entity_type, entity_id)
);

CREATE INDEX idx_graph_nodes_lookup ON graph_nodes(entity_type, entity_id);
CREATE INDEX idx_graph_nodes_tenant ON graph_nodes(tenant_id);

CREATE TABLE graph_edges (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    source_node_id    UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_node_id    UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    predicate         edge_predicate_enum NOT NULL,
    weight            DECIMAL(4,3) NOT NULL DEFAULT 1.000,  -- Confiabilidade da conexão
    properties        JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {season, transfer_fee_eur, etc.}
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source_node_id, target_node_id, predicate, tenant_id)
);

CREATE INDEX idx_graph_edges_source ON graph_edges(source_node_id);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_node_id);
CREATE INDEX idx_graph_edges_predicate ON graph_edges(predicate);
CREATE INDEX idx_graph_edges_tenant ON graph_edges(tenant_id);

ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_graph_nodes ON graph_nodes
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_graph_edges ON graph_edges
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- =============================================================================
-- EVENT VERSIONING & CDC (sport_events_v3)
-- Suporte a Event Sourcing com Sequenciamento Determinístico e Revisões
-- =============================================================================

CREATE TABLE sport_events_v3 (
    event_sequence    BIGINT GENERATED ALWAYS AS IDENTITY,
    id                UUID NOT NULL,
    tenant_id         UUID REFERENCES tenants(id) ON DELETE RESTRICT,
    sport_id          sport_type NOT NULL,
    event_type        VARCHAR(100) NOT NULL,
    match_id          UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id           UUID REFERENCES teams(id),
    player_id         UUID REFERENCES players(id),
    occurred_at       TIMESTAMPTZ NOT NULL,
    payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Versionamento (correções de scout, revisões VAR)
    version           SMALLINT NOT NULL DEFAULT 1,
    is_current        BOOLEAN NOT NULL DEFAULT TRUE,
    parent_event_id   UUID,                          -- Aponta para o evento original que sofreu mutação
    revision_reason   TEXT,                          -- Justificativa de auditoria
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, version)
);

CREATE UNIQUE INDEX idx_sport_events_v3_sequence ON sport_events_v3(event_sequence);
CREATE INDEX idx_sport_events_v3_match ON sport_events_v3(match_id);
CREATE INDEX idx_sport_events_v3_current ON sport_events_v3(id) WHERE is_current = TRUE;

ALTER TABLE sport_events_v3 ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_events_v3 ON sport_events_v3
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- =============================================================================
-- ML FEATURE STORE (v0.3.5) — Armazenamento de Features para Modelos de ML
-- Linhagem controlada: entity_type, feature_group, calculated_at, model_version
-- Previne vazamento de dados (data leakage) em treinamentos temporais
-- =============================================================================

CREATE TABLE ml_features (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID REFERENCES tenants(id) ON DELETE RESTRICT,
    -- Alvo da feature (jogador, time, partida)
    entity_type       VARCHAR(30) NOT NULL,              -- 'player', 'team', 'match'
    entity_id         UUID NOT NULL,
    -- Agrupamento lógico de features
    feature_group     VARCHAR(50) NOT NULL,              -- 'tactical', 'physical', 'psychological', 'performance', 'scouting'
    model_name        VARCHAR(100) NOT NULL,              -- Modelo que gerou a feature
    model_version     VARCHAR(30) NOT NULL,               -- Pinagem rigorosa de versão
    -- Features em formato JSONB (chave-valor numérico)
    features          JSONB NOT NULL DEFAULT '{}'::jsonb, -- Ex: {"expected_goals": 0.45, "pressure_index": 7.2}
    -- Janela temporal da feature (evita data leakage)
    window_start      TIMESTAMPTZ NOT NULL,
    window_end        TIMESTAMPTZ NOT NULL,
    -- Metadados de linhagem
    feature_engine    VARCHAR(100),                       -- 'python-script', 'sql-aggregation', 'external-api'
    source_table      VARCHAR(100),                       -- Tabela de origem dos dados brutos
    calculated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Precisão anti-leakage
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entity_type, entity_id, feature_group, model_name, model_version, window_start)
);

CREATE INDEX idx_ml_features_entity ON ml_features(entity_type, entity_id);
CREATE INDEX idx_ml_features_group ON ml_features(feature_group);
CREATE INDEX idx_ml_features_model ON ml_features(model_name, model_version);
CREATE INDEX idx_ml_features_window ON ml_features(window_start, window_end);
CREATE INDEX idx_ml_features_calculated ON ml_features(calculated_at);

ALTER TABLE ml_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_ml_features ON ml_features
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- =============================================================================
-- L2 — STREAMING: KAFKA / REDPANDA INTEGRATION (v0.3.5)
-- Schema do evento bruto trafegado no tópico "sports.events.raw"
-- Producer: sensores IoT, APIs de terceiros, wearables, CV pipelines
-- Consumer: MoirAI Event Processor (Golang/Rust) → PostgreSQL + Redis
-- =============================================================================
--
-- Estrutura do AVRO Schema registrada no Schema Registry:
-- {
--   "namespace": "com.moirai.sports",
--   "type": "record",
--   "name": "RawSportEvent",
--   "fields": [
--     { "name": "event_id",         "type": "string", "doc": "UUID v7 do evento" },
--     { "name": "tenant_id",        "type": "string" },
--     { "name": "source",           "type": "string", "doc": "'camera', 'wearable', 'api', 'scout'" },
--     { "name": "match_id",         "type": "string" },
--     { "name": "sport",            "type": "string" },
--     { "name": "event_type",       "type": "string" },
--     { "name": "occurred_at",      "type": "long",   "doc": "Timestamp epoch millis" },
--     { "name": "payload",          "type": "string", "doc": "JSONB serializado" },
--     { "name": "sequence_key",     "type": "long",   "doc": "Chave de ordenação determinística" },
--     { "name": "producer_id",      "type": "string", "doc": "Identificador do produtor" }
--   ],
--   "config": { "order": "sequence_key ASC" }
-- }
--
-- Tópicos Kafka/Redpanda:
--   sports.events.raw         → Ingestão bruta (retenção 7d)
--   sports.events.processed   → Eventos validados e enriquecidos
--   sports.snapshots          → State snapshots (compactado)
--   sports.odds.updates       → Atualizações de odds em tempo real
--   sports.telemetry.tracking → Dados de tracking 25+ FPS
--
-- Consumer Groups:
--   moirai-event-processor    → Lê raw, valida, escreve em sport_events_v3
--   moirai-snapshot-builder   → Constrói match_state_snapshots
--   moirai-redis-cache        → Popula Redis (live:match:*)
--   moirai-clickhouse-loader  → Descarrega batch para ClickHouse

-- =============================================================================
-- L3 — HOT CACHE: REDIS CLUSTER (v0.3.5)
-- Cache distribuído para estado ao vivo de partidas e Pub/Sub WebSocket
-- Estrutura de chaves e tipos de dados usados pelo MoirAI Cache Layer
-- =============================================================================
--
-- # Convenção de Chaves Redis
--
-- ## Match Live State (Hash)
--   live:match:{match_id}
--   Fields: home_score, away_score, minute, status, possession_home,
--           possession_away, momentum, pressure_index, dominant_zone
--   TTL: 300s (renovado a cada snapshot)
--
-- ## Timeline Ordenada (Sorted Set)
--   live:timeline:{match_id}
--   Members: event_id (score: sequence_key)
--   Score: event_sequence (ordenamento monotônico determinístico)
--
-- ## Tenants Pub/Sub Canais
--   tenant:{tenant_id}:match:{match_id}:events
--   Publica: JSON do evento serializado (mesmo schema do Kafka processed)
--
-- ## Leaderboards (Sorted Sets)
--   live:leaderboard:top_scorers:{competition_id}
--   live:leaderboard:assists:{season_id}
--   live:leaderboard:ratings:{tournament_id}
--
-- ## Snapshots Recentes (List — mantém últimos 120 snapshots por partida)
--   live:snapshots:{match_id}
--   LTRIM após push para evitar crescimento infinito
--
-- # Fluxo de Atualização:
--   Kafka Consumer (moirai-redis-cache) →
--     HSET live:match:{match_id} ... &
--     ZADD live:timeline:{match_id} ... &
--     PUBLISH tenant:{tid}:match:{mid}:events "{...}"

-- =============================================================================
-- L4 — TIME-SERIES: TIMESCALEDB (v0.3.5)
-- Hypertables para dados volumétricos de tracking e snapshots
-- Otimizações: chunk 1 dia, compressão colunar 7 dias, retenção 60 dias
-- =============================================================================
--
-- -- Migração das tabelas existentes para TimescaleDB:
-- SELECT create_hypertable('tracking_frames',       'captured_at', chunk_time_interval => INTERVAL '1 day');
-- SELECT create_hypertable('match_state_snapshots',  'captured_at', chunk_time_interval => INTERVAL '1 day');
-- SELECT create_hypertable('player_coordinates',     'captured_at', chunk_time_interval => INTERVAL '1 day');
-- SELECT create_hypertable('ball_coordinates',       'created_at',  chunk_time_interval => INTERVAL '1 day');
--
-- -- Compressão colunar (7 dias após inserção):
-- ALTER TABLE player_coordinates SET (
--   timescaledb.compress,
--   timescaledb.compress_segmentby = 'player_id, team_id',
--   timescaledb.compress_orderby = 'captured_at DESC'
-- );
-- SELECT add_compression_policy('player_coordinates', INTERVAL '7 days');
--
-- -- Agregador contínuo (performance média por hora):
-- CREATE MATERIALIZED VIEW mv_player_performance_hourly
-- WITH (timescaledb.continuous) AS
-- SELECT time_bucket(INTERVAL '1 hour', captured_at) AS bucket_hour,
--        player_id, team_id,
--        AVG(current_speed) AS avg_speed_kmh,
--        MAX(current_speed) AS top_speed_kmh
-- FROM player_coordinates
-- GROUP BY bucket_hour, player_id, team_id;
-- SELECT add_continuous_aggregate_policy('mv_player_performance_hourly',
--   start_offset => INTERVAL '3 hours',
--   end_offset => INTERVAL '15 minutes',
--   schedule_interval => INTERVAL '30 minutes');
--
-- -- Política de retenção (60 dias):
-- SELECT add_retention_policy('player_coordinates', INTERVAL '60 days');
-- SELECT add_retention_policy('tracking_frames',    INTERVAL '60 days');

-- =============================================================================
-- L5 — OLAP: CLICKHOUSE (v0.3.5)
-- Analytics massivo para dados de visão computacional e matrizes táticas
-- Tabelas devem ser criadas no ClickHouse, alimentadas via Kafka Engine
-- =============================================================================
--
-- -- Tabela no ClickHouse para análise de tracking:
-- CREATE TABLE moirai.tracking_analytics (
--     match_id        UUID,
--     tenant_id       String,
--     player_id       UUID,
--     team_id         UUID,
--     frame_index     UInt64,
--     pos_x           Float64,
--     pos_y           Float64,
--     speed_mps       Float32,
--     acceleration    Float32,
--     direction_deg   UInt16,
--     captured_at     DateTime64(3)
-- ) ENGINE = MergeTree()
--   PARTITION BY toYYYYMM(captured_at)
--   ORDER BY (match_id, player_id, frame_index);
--
-- -- Kafka Engine para consumo do tópico sports.telemetry.tracking:
-- CREATE TABLE moirai.tracking_kafka_queue (
--     match_id UUID, tenant_id String, player_id UUID, team_id UUID,
--     frame_index UInt64, pos_x Float64, pos_y Float64, speed_mps Float32,
--     acceleration Float32, direction_deg UInt16, captured_at DateTime64(3)
-- ) ENGINE = Kafka SETTINGS
--   kafka_broker_list = 'redpanda-cluster:9092',
--   kafka_topic_list = 'sports.telemetry.tracking',
--   kafka_group_name = 'moirai-clickhouse-loader',
--   kafka_format = 'JSONEachRow';
--
-- -- Materialized View que move do Kafka → MergeTree:
-- CREATE MATERIALIZED VIEW moirai.tracking_consumer TO moirai.tracking_analytics AS
-- SELECT * FROM moirai.tracking_kafka_queue;

-- =============================================================================
-- SEED DATA (Esportes base)
-- =============================================================================

INSERT INTO sports (id, name) VALUES
  ('football',   'Futebol'),
  ('volleyball', 'Vôlei'),
  ('basketball', 'Basquete'),
  ('baseball',   'Baseball');
