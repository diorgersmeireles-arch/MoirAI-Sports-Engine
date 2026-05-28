'use client';

import { useEffect, useState, useCallback } from 'react';
import type { TenantSubscriptionPlan, TenantBillingInvoice } from '@/types/database';

interface SysHealth {
  status: string; timestamp: string;
  clusters: Record<string, { status: string; latency_ms?: number; connected_clients?: number; memory_used_mb?: number; brokers?: number; topics?: number; total_lag?: number; connections_active?: number; replication_lag_bytes?: number; queries_per_sec?: number; merge_tree_parts?: number }>;
  throughput: { api_requests_1m: number; websocket_messages_1m: number; events_ingested_1m: number; avg_response_ms: number };
  alerts: { severity: string; source: string; message: string; timestamp: string }[];
}

interface TenantQuota {
  tenantId: string; tenantName: string; maxApiRequestsPerMinute: number;
  maxWebsocketConnections: number; maxVectorEmbeddingsStorage: number;
  allocatedStorageBytes: number; isActive: boolean;
}

interface AuditEntry {
  id: string; actorUserId: string; tenantId: string;
  action: string; entityType?: string; entityId?: string;
  ipAddress?: string; metadata?: Record<string, unknown>; createdAt: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<'noc' | 'quotas' | 'emergency' | 'compliance' | 'billing'>('noc');
  const [health, setHealth] = useState<SysHealth | null>(null);
  const [quotas, setQuotas] = useState<TenantQuota[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<TenantBillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matchId, setMatchId] = useState('');
  const [pipelineName, setPipelineName] = useState('');
  const [resultMsg, setResultMsg] = useState('');

  const adminFetch = useCallback(async (url: string, opts?: RequestInit) => {
    const res = await fetch(url, {
      ...opts,
      headers: { ...opts?.headers, 'x-system-role': 'super_admin' },
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erro');
    return res.json();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      adminFetch('/api/admin?resource=sys-health'),
      adminFetch('/api/admin?resource=quotas'),
      adminFetch('/api/admin?resource=audit'),
      adminFetch('/api/admin?resource=billing'),
    ])
      .then(([h, q, a, b]) => { setHealth(h); setQuotas(q); setAudit(a); setSubscriptions(b.subscriptions); setInvoices(b.invoices); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [adminFetch]);

  const handlePurge = useCallback(async () => {
    if (!matchId.trim()) return;
    setResultMsg('');
    try {
      const res = await adminFetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'purge-match-cache', matchId, invalidateTimeline: true, invalidateOdds: true }),
      });
      setResultMsg(`✅ Cache purgado: ${res.purgedKeys} chave(s)`);
    } catch (e: unknown) { setResultMsg(`❌ ${e instanceof Error ? e.message : 'Erro'}`); }
  }, [matchId, adminFetch]);

  const handleKillSwitch = useCallback(async () => {
    if (!pipelineName.trim()) return;
    setResultMsg('');
    try {
      const res = await adminFetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kill-switch', pipelineName }),
      });
      setResultMsg(`🔴 Pipeline "${res.pipeline}" terminado em ${res.timestamp}`);
    } catch (e: unknown) { setResultMsg(`❌ ${e instanceof Error ? e.message : 'Erro'}`); }
  }, [pipelineName, adminFetch]);

  const formatBytes = (b: number) => `${(b / 1073741824).toFixed(1)} GB`;

  const tabs = [
    { key: 'noc' as const, label: '🖥️ NOC', desc: 'Saúde dos clusters' },
    { key: 'quotas' as const, label: '📊 Quotas SaaS', desc: 'Limites por tenant' },
    { key: 'emergency' as const, label: '🚨 Emergência', desc: 'Kill-switch & cache' },
    { key: 'compliance' as const, label: '🔍 Compliance', desc: 'Auditoria forense' },
    { key: 'billing' as const, label: '💰 Faturamento', desc: 'Assinaturas & faturas' },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-sport-surface rounded w-64" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-sport-surface rounded-lg" />)}
      </div>
      <div className="h-64 bg-sport-surface rounded-lg" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚙️ Painel Administrativo Global</h1>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      <div className="flex gap-1 bg-sport-surface rounded-lg border border-sport-border p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors text-center ${
              tab === t.key ? 'bg-sport-accent/20 text-sport-accent' : 'text-sport-dim hover:text-sport-text'
            }`}
          >
            <div className="font-medium">{t.label}</div>
            <div className="text-[11px] opacity-70">{t.desc}</div>
          </button>
        ))}
      </div>

      {/* NOC Dashboard */}
      {tab === 'noc' && health && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-sport-dim">Sistema {health.status}</span>
            <span className="text-xs text-sport-dim">· {new Date(health.timestamp).toLocaleString('pt-BR')}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(health.clusters).map(([name, info]) => (
              <div key={name} className="bg-sport-surface rounded-lg border border-sport-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold uppercase">{name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${info.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {info.status}
                  </span>
                </div>
                {info.latency_ms !== undefined && <div className="text-xs text-sport-dim">Latência: {info.latency_ms}ms</div>}
                {info.connected_clients !== undefined && <div className="text-xs text-sport-dim">Conexões: {info.connected_clients}</div>}
                {info.memory_used_mb !== undefined && <div className="text-xs text-sport-dim">RAM: {info.memory_used_mb}MB</div>}
                {info.brokers !== undefined && <div className="text-xs text-sport-dim">Brokers: {info.brokers}</div>}
                {info.total_lag !== undefined && <div className="text-xs text-sport-dim">Lag: {info.total_lag}</div>}
                {info.connections_active !== undefined && <div className="text-xs text-sport-dim">Conexões: {info.connections_active}</div>}
                {info.queries_per_sec !== undefined && <div className="text-xs text-sport-dim">QPS: {info.queries_per_sec}</div>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
              <div className="text-xs text-sport-dim">API Requests (1m)</div>
              <div className="text-2xl font-bold text-sport-accent">{health.throughput.api_requests_1m}</div>
            </div>
            <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
              <div className="text-xs text-sport-dim">WS Messages (1m)</div>
              <div className="text-2xl font-bold text-sport-home">{health.throughput.websocket_messages_1m}</div>
            </div>
            <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
              <div className="text-xs text-sport-dim">Eventos Ingeridos (1m)</div>
              <div className="text-2xl font-bold text-sport-gold">{health.throughput.events_ingested_1m}</div>
            </div>
            <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
              <div className="text-xs text-sport-dim">Latência Média</div>
              <div className="text-2xl font-bold">{health.throughput.avg_response_ms}ms</div>
            </div>
          </div>
          {health.alerts.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <div className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Alertas Ativos</div>
              {health.alerts.map((a, i) => (
                <div key={i} className="text-xs text-sport-dim flex items-start gap-2">
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <span>[{a.source}] {a.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quotas SaaS */}
      {tab === 'quotas' && (
        <div className="bg-sport-surface rounded-lg border border-sport-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sport-border text-sport-dim">
                <th className="p-3 text-left">Tenant</th>
                <th className="p-3 text-center">API req/min</th>
                <th className="p-3 text-center">WS conexões</th>
                <th className="p-3 text-center">Embeddings</th>
                <th className="p-3 text-center">Armazenamento</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotas.map(q => (
                <tr key={q.tenantId} className="border-b border-sport-border/40">
                  <td className="p-3 font-medium">{q.tenantName}</td>
                  <td className="p-3 text-center">{q.maxApiRequestsPerMinute}</td>
                  <td className="p-3 text-center">{q.maxWebsocketConnections}</td>
                  <td className="p-3 text-center">{q.maxVectorEmbeddingsStorage}</td>
                  <td className="p-3 text-center">{formatBytes(q.allocatedStorageBytes)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {q.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Emergency Command Center */}
      {tab === 'emergency' && (
        <div className="space-y-4">
          {resultMsg && (
            <div className={`${resultMsg.startsWith('✅') || resultMsg.startsWith('🔴') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'} border rounded-lg p-3 text-sm`}>
              {resultMsg}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
              <h3 className="font-semibold mb-3">🧹 Purgar Cache de Partida</h3>
              <p className="text-xs text-sport-dim mb-3">Invalida timeline e odds de uma partida específica no Redis</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ID da partida (ex: m1)"
                  value={matchId}
                  onChange={e => setMatchId(e.target.value)}
                  className="flex-1 bg-sport-bg border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text outline-none focus:border-sport-accent"
                />
                <button
                  onClick={handlePurge}
                  disabled={!matchId.trim()}
                  className="px-4 py-1.5 bg-yellow-600 text-white font-medium rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50"
                >
                  Purgar
                </button>
              </div>
            </div>
            <div className="bg-sport-surface rounded-lg border border-sport-border p-4">
              <h3 className="font-semibold mb-3">🔴 Kill-Switch de Pipeline</h3>
              <p className="text-xs text-sport-dim mb-3">Interrompe emergencialmente um pipeline de ingestão</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do pipeline"
                  value={pipelineName}
                  onChange={e => setPipelineName(e.target.value)}
                  className="flex-1 bg-sport-bg border border-sport-border rounded-md px-3 py-1.5 text-sm text-sport-text outline-none focus:border-sport-accent"
                />
                <button
                  onClick={handleKillSwitch}
                  disabled={!pipelineName.trim()}
                  className="px-4 py-1.5 bg-red-600 text-white font-medium rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  Terminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance / Audit Trail */}
      {tab === 'compliance' && (
        <div className="bg-sport-surface rounded-lg border border-sport-border overflow-hidden">
          <div className="p-3 border-b border-sport-border text-xs text-sport-dim">
            Últimas {audit.length} entradas de auditoria
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-sport-surface">
                <tr className="border-b border-sport-border text-sport-dim">
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Ação</th>
                  <th className="p-2 text-left">Ator</th>
                  <th className="p-2 text-left">Tenant</th>
                  <th className="p-2 text-left">Entidade</th>
                  <th className="p-2 text-left">IP</th>
                  <th className="p-2 text-left">Metadados</th>
                </tr>
              </thead>
              <tbody>
                {audit.map(entry => (
                  <tr key={entry.id} className="border-b border-sport-border/30 hover:bg-sport-bg/30">
                    <td className="p-2 whitespace-nowrap text-sport-dim">
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2 font-medium">{entry.action}</td>
                    <td className="p-2 text-sport-dim">{entry.actorUserId}</td>
                    <td className="p-2 text-sport-dim">{entry.tenantId}</td>
                    <td className="p-2 text-sport-dim">{entry.entityType}{entry.entityId ? `/${entry.entityId}` : ''}</td>
                    <td className="p-2 text-sport-dim font-mono">{entry.ipAddress ?? '-'}</td>
                    <td className="p-2 max-w-[200px] truncate text-sport-dim" title={JSON.stringify(entry.metadata)}>
                      {entry.metadata ? JSON.stringify(entry.metadata).substring(0, 60) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing / Subscription Management */}
      {tab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-sport-surface rounded-lg border border-sport-border overflow-hidden">
            <div className="p-3 border-b border-sport-border font-semibold text-sm">Planos de Assinatura</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sport-border text-sport-dim text-xs">
                  <th className="p-3 text-left">Tenant</th>
                  <th className="p-3 text-left">Tier</th>
                  <th className="p-3 text-center">Início</th>
                  <th className="p-3 text-center">Fim</th>
                  <th className="p-3 text-center">Stripe</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(s => (
                  <tr key={s.id} className="border-b border-sport-border/40">
                    <td className="p-3 font-medium">{s.tenant_id}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.tier === 'enterprise_pro' ? 'bg-purple-500/20 text-purple-400'
                        : s.tier === 'standard_club' ? 'bg-blue-500/20 text-blue-400'
                        : s.tier === 'betting_provider_api' ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-green-500/20 text-green-400'
                      }`}>{s.tier}</span>
                    </td>
                    <td className="p-3 text-center text-sport-dim text-xs">{new Date(s.current_period_start).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-center text-sport-dim text-xs">{new Date(s.current_period_end).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-center text-xs font-mono">{s.stripe_customer_id ? '✓' : '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_cancelled ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {s.is_cancelled ? 'Cancelado' : 'Ativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-sport-surface rounded-lg border border-sport-border overflow-hidden">
            <div className="p-3 border-b border-sport-border font-semibold text-sm">Faturas</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sport-border text-sport-dim text-xs">
                  <th className="p-3 text-left">Tenant</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-center">Moeda</th>
                  <th className="p-3 text-center">Vencimento</th>
                  <th className="p-3 text-center">Pagamento</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-sport-border/40">
                    <td className="p-3 font-medium">{inv.tenant_id}</td>
                    <td className="p-3 text-right">{(inv.amount_in_cents / 100).toFixed(2)}</td>
                    <td className="p-3 text-center text-xs">{inv.currency}</td>
                    <td className="p-3 text-center text-sport-dim text-xs">{new Date(inv.due_date).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 text-center text-sport-dim text-xs">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inv.status === 'paid' ? 'bg-green-500/20 text-green-400'
                        : inv.status === 'open' ? 'bg-yellow-500/20 text-yellow-400'
                        : inv.status === 'draft' ? 'bg-gray-500/20 text-gray-400'
                        : 'bg-red-500/20 text-red-400'
                      }`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
