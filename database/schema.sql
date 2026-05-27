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

-- Estatísticas individuais por partida (Baseball — Batedores)
CREATE TABLE baseball_batter_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id              UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id             UUID NOT NULL REFERENCES players(id),
  team_id               UUID NOT NULL REFERENCES teams(id),
  at_bats               SMALLINT DEFAULT 0,
  runs                  SMALLINT DEFAULT 0,
  hits                  SMALLINT DEFAULT 0,
  doubles               SMALLINT DEFAULT 0,
  triples               SMALLINT DEFAULT 0,
  home_runs             SMALLINT DEFAULT 0,
  rbi                   SMALLINT DEFAULT 0,
  walks                 SMALLINT DEFAULT 0,
  strikeouts            SMALLINT DEFAULT 0,
  stolen_bases          SMALLINT DEFAULT 0,
  caught_stealing       SMALLINT DEFAULT 0,
  left_on_base          SMALLINT DEFAULT 0,
  batting_avg           DECIMAL(5,3) CHECK (batting_avg BETWEEN 0 AND 1),
  on_base_pct           DECIMAL(5,3) CHECK (on_base_pct BETWEEN 0 AND 1),
  slugging_pct          DECIMAL(5,3) CHECK (slugging_pct BETWEEN 0 AND 1),
  UNIQUE (match_id, player_id)
);

-- Estatísticas individuais por partida (Baseball — Arremessadores)
CREATE TABLE baseball_pitcher_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id              UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id             UUID NOT NULL REFERENCES players(id),
  team_id               UUID NOT NULL REFERENCES teams(id),
  innings_pitched       DECIMAL(4,1) DEFAULT 0,
  hits_allowed          SMALLINT DEFAULT 0,
  runs_allowed          SMALLINT DEFAULT 0,
  earned_runs           SMALLINT DEFAULT 0,
  walks                 SMALLINT DEFAULT 0,
  strikeouts            SMALLINT DEFAULT 0,
  home_runs_allowed     SMALLINT DEFAULT 0,
  pitches_count         SMALLINT DEFAULT 0,
  strikes_count         SMALLINT DEFAULT 0,
  batters_faced         SMALLINT DEFAULT 0,
  win                   BOOLEAN DEFAULT FALSE,
  loss                  BOOLEAN DEFAULT FALSE,
  save                  BOOLEAN DEFAULT FALSE,
  era                   DECIMAL(4,2) CHECK (era >= 0),   -- Earned Run Average
  whip                  DECIMAL(4,2) CHECK (whip >= 0),  -- Walks + Hits per Inning Pitched
  UNIQUE (match_id, player_id)
);

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
-- - football_player_stats
-- - basketball_player_stats
-- - volleyball_player_stats
-- - baseball_batter_stats
-- - baseball_pitcher_stats
-- =============================================================================

-- =============================================================================
-- SEED DATA (Esportes base)
-- =============================================================================

INSERT INTO sports (id, name) VALUES
  ('football',   'Futebol'),
  ('volleyball', 'Vôlei'),
  ('basketball', 'Basquete'),
  ('baseball',   'Baseball');
