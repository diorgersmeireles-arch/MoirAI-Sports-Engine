import { NextResponse } from 'next/server';
import { auditLogsData, tenantsData } from '@/data/seed';

// Mock Redis/ClickHouse telemetry
const mockSysHealth = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  clusters: {
    redis: { status: 'online', latency_ms: 2.3, connected_clients: 14, memory_used_mb: 128 },
    kafka: { status: 'online', brokers: 3, topics: 12, total_lag: 342 },
    postgres: { status: 'online', connections_active: 8, replication_lag_bytes: 0 },
    clickhouse: { status: 'online', queries_per_sec: 45, merge_tree_parts: 1283 },
  },
  throughput: {
    api_requests_1m: 1420,
    websocket_messages_1m: 5890,
    events_ingested_1m: 12450,
    avg_response_ms: 34,
  },
  alerts: [
    { severity: 'warning', source: 'kafka', message: 'Consumer group moirai-clickhouse-loader has 342 lag', timestamp: new Date().toISOString() },
  ],
};

// Role check: only super_admin and global_manager
function checkRole(request: Request): boolean {
  const role = request.headers.get('x-system-role') ?? 'viewer';
  return role === 'super_admin' || role === 'global_manager';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get('resource');

  if (!checkRole(request)) {
    return NextResponse.json({ error: 'Acesso restrito a super_admin e global_manager' }, { status: 403 });
  }

  if (resource === 'sys-health') {
    return NextResponse.json(mockSysHealth);
  }

  if (resource === 'quotas') {
    return NextResponse.json(
      tenantsData.map(t => ({
        tenantId: t.id,
        tenantName: t.name,
        maxApiRequestsPerMinute: 60,
        maxWebsocketConnections: 10,
        maxVectorEmbeddingsStorage: 5000,
        allocatedStorageBytes: 5368709120,
        isActive: t.isActive,
      }))
    );
  }

  if (resource === 'audit') {
    return NextResponse.json(auditLogsData.slice(-50).reverse());
  }

  return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
}

export async function POST(request: Request) {
  if (!checkRole(request)) {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  const body = await request.json();
  const { action } = body;

  if (action === 'purge-match-cache') {
    const { matchId, invalidateTimeline, invalidateOdds } = body;
    const purged: string[] = [];
    if (invalidateTimeline) purged.push(`live:timeline:${matchId}`);
    if (invalidateOdds) purged.push(`live:odds:${matchId}`);
    return NextResponse.json({ status: 'success', purgedKeys: purged.length });
  }

  if (action === 'kill-switch') {
    const { pipelineName } = body;
    return NextResponse.json({
      status: 'terminated',
      pipeline: pipelineName,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === 'update-quota') {
    const { tenantId, maxApiRequestsPerMinute } = body;
    return NextResponse.json({
      status: 'updated',
      tenantId,
      maxApiRequestsPerMinute,
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
