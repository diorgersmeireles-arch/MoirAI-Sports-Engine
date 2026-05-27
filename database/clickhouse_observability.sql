-- ============================================================================
-- MoirAI Observability Analytics Engine — ClickHouse Schema
-- Version: 0.3.5-ClickHouse-Enterprise
-- Description: Tabelas colunares de alta performance e Materialized Views
--              para agregação contínua de métricas de rede e infraestrutura
-- ============================================================================

-- ============================================================================
-- 1. PILAR DE THROUGHPUT & PERFORMANCE DE NETWORK (API GATEWAY LOGS)
-- ============================================================================

CREATE TABLE default.api_network_metrics (
    timestamp DateTime64(3, 'UTC'),
    tenant_id UUID,
    request_id UUID,
    endpoint String,
    method LowCardinality(String),
    status_code UInt16,
    response_time_ms Float32,
    bytes_sent UInt64,
    bytes_received UInt64,
    client_ip String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, endpoint, timestamp)
TTL timestamp + INTERVAL 30 DAY;

CREATE TABLE default.mv_api_network_performance_minutely (
    minute_bucket DateTime,
    tenant_id UUID,
    endpoint String,
    total_requests UInt64,
    avg_response_time Float32,
    p95_response_time Float32,
    total_egress_bytes UInt64
) ENGINE = SummingMergeTree()
PRIMARY KEY (tenant_id, endpoint, minute_bucket)
ORDER BY (tenant_id, endpoint, minute_bucket);

CREATE MATERIALIZED VIEW default.v_api_network_performance_minutely_mv
TO default.mv_api_network_performance_minutely AS
SELECT
    toStartOfMinute(timestamp) AS minute_bucket,
    tenant_id,
    endpoint,
    count() AS total_requests,
    avg(response_time_ms) AS avg_response_time,
    quantile(0.95)(response_time_ms) AS p95_response_time,
    sum(bytes_sent) AS total_egress_bytes
FROM default.api_network_metrics
GROUP BY minute_bucket, tenant_id, endpoint;

-- ============================================================================
-- 2. PILAR DE TELEMETRIA E CONCORRÊNCIA DE WEBSOCKETS (LIVE STATE PUSH)
-- ============================================================================

CREATE TABLE default.websocket_telemetry_metrics (
    timestamp DateTime64(3, 'UTC'),
    tenant_id UUID,
    match_id UUID,
    connection_id UUID,
    action LowCardinality(String),
    active_connections_snapshot UInt32,
    buffer_lag_ms UInt32,
    messages_sent_count UInt32
) ENGINE = ReplacingMergeTree(timestamp)
PARTITION BY toYYYYMM(timestamp)
ORDER BY (tenant_id, match_id, timestamp)
TTL timestamp + INTERVAL 14 DAY;

-- ============================================================================
-- 3. INGESTÃO DE ALTA VELOCIDADE VIA KAFKA STREAMING ENGINE
-- ============================================================================

CREATE TABLE default.kafka_network_ingress_queue (
    timestamp DateTime64(3, 'UTC'),
    tenant_id UUID,
    request_id UUID,
    endpoint String,
    method String,
    status_code UInt16,
    response_time_ms Float32,
    bytes_sent UInt64,
    bytes_received UInt64,
    client_ip String
) ENGINE = Kafka
SETTINGS
    kafka_broker_list = 'localhost:9092',
    kafka_topic_list = 'moirai.infra.network.logs',
    kafka_group_name = 'clickhouse-network-ingestors',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 2;

CREATE MATERIALIZED VIEW default.kafka_network_ingress_mv TO default.api_network_metrics AS
SELECT * FROM default.kafka_network_ingress_queue;

-- ============================================================================
-- 4. NOC DASHBOARD QUERY — Volumetria e Anomalias de Latência (P95)
-- ============================================================================
-- SELECT
--     tenant_id,
--     count() AS total_requests_5m,
--     round(sum(bytes_sent) / 1024 / 1024, 2) AS egress_traffic_mb,
--     round(avg(response_time_ms), 2) AS average_latency_ms,
--     round(quantile(0.95)(response_time_ms), 2) AS p95_latency_ms,
--     countIf(status_code >= 400) AS total_http_errors
-- FROM default.api_network_metrics
-- WHERE timestamp >= now() - INTERVAL 5 MINUTE
-- GROUP BY tenant_id
-- ORDER BY total_requests_5m DESC
-- LIMIT 100;
