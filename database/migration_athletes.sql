-- =============================================================================
-- MoirAI Sports Engine — Migration: Perfil Individual de Atletas
-- Cartões disciplinares, atributos por esporte, estatísticas em teia
-- Desenvolvido por MADev
-- =============================================================================

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE card_severity AS ENUM ('soft', 'hard', 'violent', 'technical', 'professional');
CREATE TYPE attribute_category AS ENUM ('physical', 'technical', 'mental', 'positional');

-- =============================================================================
-- CARTÕES DISCIPLINARES DO ATLETA (carreira toda)
-- =============================================================================

CREATE TABLE player_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id         UUID NOT NULL REFERENCES teams(id),
  card_type       card_type NOT NULL,              -- yellow, red, second_yellow
  severity        card_severity,                   -- Classificação da gravidade
  minute          SMALLINT NOT NULL CHECK (minute >= 0),
  period          match_period,
  reason          TEXT,                             -- Motivo do cartão
  -- Contexto adicional
  opponent_id     UUID REFERENCES teams(id),
  competition_id  UUID REFERENCES competitions(id),
  season_id       UUID REFERENCES seasons(id),
  -- Se resultou em suspensão
  suspension_matches SMALLINT DEFAULT 0,
  fine_amount     DECIMAL(10,2),                   -- Multa em moeda local
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_player_cards_player ON player_cards(player_id);
CREATE INDEX idx_player_cards_season ON player_cards(player_id, season_id);
CREATE INDEX idx_player_cards_type ON player_cards(player_id, card_type);

-- Comentários
COMMENT ON TABLE player_cards IS 'Registro disciplinar completo do atleta em toda a carreira';
COMMENT ON COLUMN player_cards.severity IS 'Gravidade: soft (amarelo leve), hard (amarelo duro), violent (vermelho), technical (técnico), professional (profissional)';
COMMENT ON COLUMN player_cards.suspension_matches IS 'Número de jogos de suspensão resultantes';
COMMENT ON COLUMN player_cards.fine_amount IS 'Multa aplicada pelo cartão';

-- =============================================================================
-- ATRIBUTOS DO ATLETA (Gráfico Teia / Spider Chart)
-- =============================================================================

-- Cada esporte tem seus próprios eixos de atributos.
-- Usamos JSONB para flexibilidade total com validação por esporte.

CREATE TABLE player_attributes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  sport_id        sport_type NOT NULL,
  season_id       UUID REFERENCES seasons(id),     -- NULL = atributos atuais/carreira
  -- Data de aferição dos atributos
  measured_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Overall / Nota geral (0-100)
  overall         SMALLINT NOT NULL CHECK (overall BETWEEN 0 AND 100),
  -- Potencial (0-100)
  potential       SMALLINT CHECK (potential BETWEEN 0 AND 100),
  -- Atributos físicos (0-100)
  pace            SMALLINT CHECK (pace BETWEEN 0 AND 100),
  acceleration    SMALLINT CHECK (acceleration BETWEEN 0 AND 100),
  stamina         SMALLINT CHECK (stamina BETWEEN 0 AND 100),
  strength        SMALLINT CHECK (strength BETWEEN 0 AND 100),
  agility         SMALLINT CHECK (agility BETWEEN 0 AND 100),
  balance         SMALLINT CHECK (balance BETWEEN 0 AND 100),
  jumping         SMALLINT CHECK (jumping BETWEEN 0 AND 100),
  reaction        SMALLINT CHECK (reaction BETWEEN 0 AND 100),
  -- Atributos técnicos (0-100)
  dribbling       SMALLINT CHECK (dribbling BETWEEN 0 AND 100),
  passing         SMALLINT CHECK (passing BETWEEN 0 AND 100),
  shooting        SMALLINT CHECK (shooting BETWEEN 0 AND 100),
  finishing       SMALLINT CHECK (finishing BETWEEN 0 AND 100),
  long_shots      SMALLINT CHECK (long_shots BETWEEN 0 AND 100),
  crossing        SMALLINT CHECK (crossing BETWEEN 0 AND 100),
  heading         SMALLINT CHECK (heading BETWEEN 0 AND 100),
  marking         SMALLINT CHECK (marking BETWEEN 0 AND 100),
  tackling        SMALLINT CHECK (tackling BETWEEN 0 AND 100),
  interceptions   SMALLINT CHECK (interceptions BETWEEN 0 AND 100),
  -- Atributos mentais (0-100)
  vision          SMALLINT CHECK (vision BETWEEN 0 AND 100),
  composure       SMALLINT CHECK (composure BETWEEN 0 AND 100),
  positioning     SMALLINT CHECK (positioning BETWEEN 0 AND 100),
  decision_making SMALLINT CHECK (decision_making BETWEEN 0 AND 100),
  teamwork        SMALLINT CHECK (teamwork BETWEEN 0 AND 100),
  leadership      SMALLINT CHECK (leadership BETWEEN 0 AND 100),
  aggression      SMALLINT CHECK (aggression BETWEEN 0 AND 100),
  -- Atributos específicos de goleiro (0-100)
  diving          SMALLINT CHECK (diving BETWEEN 0 AND 100),
  handling        SMALLINT CHECK (handling BETWEEN 0 AND 100),
  kicking         SMALLINT CHECK (kicking BETWEEN 0 AND 100),
  reflexes        SMALLINT CHECK (reflexes BETWEEN 0 AND 100),
  -- Atributos extras específicos do esporte (JSONB)
  extra_attributes JSONB,
  -- Metadados
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, season_id, measured_at)
);

CREATE INDEX idx_player_attributes_player ON player_attributes(player_id);
CREATE INDEX idx_player_attributes_sport ON player_attributes(sport_id);
CREATE INDEX idx_player_attributes_overall ON player_attributes(overall DESC);

COMMENT ON TABLE player_attributes IS 'Atributos do atleta para gráfico radar/teia (0-100)';
COMMENT ON COLUMN player_attributes.overall IS 'Nota geral do atleta (0-100)';
COMMENT ON COLUMN player_attributes.potential IS 'Potencial máximo (0-100)';
COMMENT ON COLUMN player_attributes.extra_attributes IS 'Atributos extras por esporte em JSONB';

-- =============================================================================
-- VIEW: Atributos formatados para gráfico teia
-- =============================================================================

-- View genérica que retorna os 6 principais eixos de cada esporte
CREATE VIEW v_player_radar AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.sport_id,
  pa.overall,
  pa.potential,
  -- Eixos primários da teia (mapeamento universal)
  pa.pace,
  pa.shooting,
  pa.passing,
  pa.dribbling,
  pa.defending,
  pa.stamina,
  -- Eixos secundários
  pa.physical,
  pa.acceleration,
  pa.agility,
  pa.vision,
  pa.leadership,
  -- JSON com atributos completo para o gráfico
  jsonb_build_object(
    'overall', pa.overall,
    'potential', pa.potential,
    'pace', pa.pace,
    'shooting', COALESCE(pa.shooting, pa.finishing),
    'passing', pa.passing,
    'dribbling', pa.dribbling,
    'defending', COALESCE(pa.defending, pa.tackling),
    'physical', COALESCE(pa.physical, pa.strength),
    'acceleration', pa.acceleration,
    'stamina', pa.stamina,
    'agility', pa.agility,
    'vision', pa.vision,
    'leadership', pa.leadership,
    'extra', pa.extra_attributes
  ) AS radar_data,
  pa.measured_at,
  pa.is_active
FROM players p
JOIN player_attributes pa ON pa.player_id = p.id
WHERE pa.is_active = TRUE
ORDER BY pa.overall DESC;

-- View específica para futebol: 6 eixos clássicos da teia
CREATE VIEW v_player_radar_football AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.short_name,
  p.nationality,
  (EXTRACT(YEAR FROM AGE(p.birth_date)))::SMALLINT AS age,
  p.height_cm,
  p.weight_kg,
  p.metadata->>'position' AS position,
  pa.overall AS overall_rating,
  pa.potential,
  -- 6 eixos principais do futebol (gráfico teia)
  pa.pace,
  COALESCE(pa.shooting, pa.finishing) AS shooting,
  pa.passing,
  pa.dribbling,
  COALESCE(pa.defending, pa.tackling) AS defending,
  COALESCE(pa.physical, pa.strength) AS physical,
  -- Eixos secundários
  pa.stamina,
  pa.vision,
  pa.aggression,
  pa.agility,
  pa.acceleration,
  pa.leadership,
  pa.composure,
  -- Goleiros
  pa.diving,
  pa.handling,
  pa.kicking,
  pa.reflexes,
  -- Dados completos para renderização
  jsonb_build_object(
    'pace', pa.pace,
    'shooting', COALESCE(pa.shooting, pa.finishing),
    'passing', pa.passing,
    'dribbling', pa.dribbling,
    'defending', COALESCE(pa.defending, pa.tackling),
    'physical', COALESCE(pa.physical, pa.strength)
  ) AS spider_6,
  jsonb_build_object(
    'pace', pa.pace,
    'shooting', COALESCE(pa.shooting, pa.finishing),
    'passing', pa.passing,
    'dribbling', pa.dribbling,
    'defending', COALESCE(pa.defending, pa.tackling),
    'physical', COALESCE(pa.physical, pa.strength),
    'stamina', pa.stamina,
    'vision', pa.vision,
    'agility', pa.agility,
    'acceleration', pa.acceleration,
    'composure', pa.composure,
    'leadership', pa.leadership
  ) AS spider_12,
  pa.measured_at
FROM players p
JOIN player_attributes pa ON pa.player_id = p.id
WHERE p.sport_id = 'football' AND pa.is_active = TRUE
ORDER BY pa.overall DESC;

-- View específica para basquete
CREATE VIEW v_player_radar_basketball AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.short_name,
  (EXTRACT(YEAR FROM AGE(p.birth_date)))::SMALLINT AS age,
  p.height_cm,
  p.weight_kg,
  p.metadata->>'position' AS position,
  pa.overall AS overall_rating,
  -- 6 eixos do basquete
  pa.pace AS speed,
  COALESCE(pa.shooting, pa.finishing) AS shooting,
  pa.passing,
  pa.dribbling AS ball_handling,
  pa.defending AS defense,
  COALESCE(pa.physical, pa.strength) AS athleticism,
  -- Extras
  pa.jumping,
  pa.stamina,
  pa.agility,
  pa.vision,
  pa.leadership,
  -- Dados para gráfico
  jsonb_build_object(
    'speed', pa.pace,
    'shooting', COALESCE(pa.shooting, pa.finishing),
    'passing', pa.passing,
    'ball_handling', pa.dribbling,
    'defense', pa.defending,
    'athleticism', COALESCE(pa.physical, pa.strength)
  ) AS spider_data
FROM players p
JOIN player_attributes pa ON pa.player_id = p.id
WHERE p.sport_id = 'basketball' AND pa.is_active = TRUE
ORDER BY pa.overall DESC;

-- View específica para vôlei
CREATE VIEW v_player_radar_volleyball AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.short_name,
  (EXTRACT(YEAR FROM AGE(p.birth_date)))::SMALLINT AS age,
  p.height_cm,
  p.weight_kg,
  p.metadata->>'position' AS position,
  (p.metadata->>'reach_cm')::SMALLINT AS reach_cm,
  pa.overall AS overall_rating,
  -- 6 eixos do vôlei
  COALESCE(pa.shooting, pa.finishing) AS attacking,  -- Ataque/Potência
  pa.defending AS blocking,
  pa.passing AS serving,
  pa.dribbling AS setting,
  pa.agility AS digging,
  COALESCE(pa.physical, pa.strength) AS physical,
  -- Extras
  pa.jumping,
  pa.stamina,
  pa.reaction AS reflexes,
  pa.vision AS court_vision,
  pa.leadership,
  -- Dados para gráfico
  jsonb_build_object(
    'attacking', COALESCE(pa.shooting, pa.finishing),
    'blocking', pa.defending,
    'serving', pa.passing,
    'setting', pa.dribbling,
    'digging', pa.agility,
    'physical', COALESCE(pa.physical, pa.strength)
  ) AS spider_data
FROM players p
JOIN player_attributes pa ON pa.player_id = p.id
WHERE p.sport_id = 'volleyball' AND pa.is_active = TRUE
ORDER BY pa.overall DESC;

-- View específica para baseball
CREATE VIEW v_player_radar_baseball AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.short_name,
  (EXTRACT(YEAR FROM AGE(p.birth_date)))::SMALLINT AS age,
  p.height_cm,
  p.weight_kg,
  p.metadata->>'primary_position' AS position,
  p.metadata->>'batting_hand' AS batting_hand,
  p.metadata->>'throwing_hand' AS throwing_hand,
  pa.overall AS overall_rating,
  -- 6 eixos do baseball
  COALESCE(pa.shooting, pa.finishing) AS power_hitting,
  pa.passing AS contact,
  pa.pace AS speed,
  pa.dribbling AS pitching,
  pa.defending AS fielding,
  COALESCE(pa.physical, pa.strength) AS arm_strength,
  -- Extras
  pa.agility,
  pa.reaction AS reflexes,
  pa.vision,
  pa.composure,
  pa.leadership,
  -- Dados para gráfico
  jsonb_build_object(
    'power_hitting', COALESCE(pa.shooting, pa.finishing),
    'contact', pa.passing,
    'speed', pa.pace,
    'pitching', pa.dribbling,
    'fielding', pa.defending,
    'arm_strength', COALESCE(pa.physical, pa.strength)
  ) AS spider_data
FROM players p
JOIN player_attributes pa ON pa.player_id = p.id
WHERE p.sport_id = 'baseball' AND pa.is_active = TRUE
ORDER BY pa.overall DESC;

-- =============================================================================
-- VIEW: Estatísticas Acumuladas da Carreira
-- =============================================================================

CREATE VIEW v_player_career_stats AS
SELECT
  p.id AS player_id,
  p.full_name,
  p.sport_id,
  -- Jogos
  COUNT(DISTINCT fps.match_id) AS football_matches,
  COUNT(DISTINCT vps.match_id) AS volleyball_matches,
  COUNT(DISTINCT bps.match_id) AS basketball_matches,
  COUNT(DISTINCT bbs.match_id) AS baseball_matches,
  -- Cartões (todas as fontes)
  COALESCE(SUM(fps.yellow_cards), 0) + COALESCE(SUM(fps2.yellow_cards), 0) AS yellow_cards,
  COALESCE(SUM(fps.red_cards), 0) + COALESCE(SUM(fps2.red_cards), 0) AS red_cards,
  -- Estatísticas ofensivas
  COALESCE(SUM(fps.goals), 0) AS football_goals,
  COALESCE(SUM(fps.assists), 0) AS football_assists,
  COALESCE(SUM(bps.points), 0) AS basketball_points,
  COALESCE(SUM(vps.points), 0) AS volleyball_points,
  COALESCE(SUM(bbs.home_runs), 0) AS baseball_home_runs,
  COALESCE(SUM(bbs.rbi), 0) AS baseball_rbi
FROM players p
LEFT JOIN football_player_stats fps ON fps.player_id = p.id AND p.sport_id = 'football'
LEFT JOIN volleyball_player_stats vps ON vps.player_id = p.id AND p.sport_id = 'volleyball'
LEFT JOIN basketball_player_stats bps ON bps.player_id = p.id AND p.sport_id = 'basketball'
LEFT JOIN baseball_batter_stats bbs ON bbs.player_id = p.id AND p.sport_id = 'baseball'
LEFT JOIN baseball_pitcher_stats pcs ON pcs.player_id = p.id AND p.sport_id = 'baseball'
GROUP BY p.id, p.full_name, p.sport_id;

-- =============================================================================
-- VIEW: Resumo do Atleta (Perfil Completo)
-- =============================================================================

CREATE VIEW v_player_profile AS
SELECT
  p.id,
  p.full_name,
  p.short_name,
  p.sport_id,
  p.nationality,
  p.height_cm,
  p.weight_kg,
  (EXTRACT(YEAR FROM AGE(p.birth_date)))::SMALLINT AS age,
  p.metadata,
  -- Últimos atributos
  pa.overall,
  pa.potential,
  pa.measured_at AS attributes_date,
  -- Dados do gráfico teia
  pa.pace,
  pa.shooting,
  pa.passing,
  pa.dribbling,
  pa.defending,
  pa.physical,
  pa.stamina,
  pa.vision,
  pa.agility,
  pa.leadership,
  -- JSON completo do radar
  jsonb_build_object(
    'pace', pa.pace,
    'shooting', pa.shooting,
    'passing', pa.passing,
    'dribbling', pa.dribbling,
    'defending', pa.defending,
    'physical', pa.physical,
    'stamina', pa.stamina,
    'vision', pa.vision,
    'agility', pa.agility,
    'acceleration', pa.acceleration,
    'composure', pa.composure,
    'leadership', pa.leadership
  ) AS spider_chart,
  -- Cartões totais
  (SELECT COUNT(*) FROM player_cards pc WHERE pc.player_id = p.id AND pc.card_type = 'yellow') AS total_yellow_cards,
  (SELECT COUNT(*) FROM player_cards pc WHERE pc.player_id = p.id AND pc.card_type IN ('red', 'second_yellow')) AS total_red_cards,
  -- Time atual
  (SELECT t.name FROM team_players tp JOIN teams t ON t.id = tp.team_id WHERE tp.player_id = p.id AND tp.is_active = TRUE LIMIT 1) AS current_team,
  p.retired,
  p.image_url
FROM players p
LEFT JOIN LATERAL (
  SELECT * FROM player_attributes
  WHERE player_id = p.id AND is_active = TRUE
  ORDER BY measured_at DESC
  LIMIT 1
) pa ON TRUE;
