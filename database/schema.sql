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
  UNIQUE (team_id, player_id, season_id)
);

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
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_sport ON matches(sport_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_competition ON matches(competition_id, season_id);
CREATE INDEX idx_matches_team ON matches(home_team_id, away_team_id);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_at);

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
  UNIQUE (match_id, player_id)
);

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
-- SEED DATA (Esportes base)
-- =============================================================================

INSERT INTO sports (id, name) VALUES
  ('football',   'Futebol'),
  ('volleyball', 'Vôlei'),
  ('basketball', 'Basquete'),
  ('baseball',   'Baseball');
