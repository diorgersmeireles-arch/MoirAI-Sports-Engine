'use client';

import Link from 'next/link';

const modules = [
  {
    icon: '🧠', number: '01',
    title: 'Neural Scouting & Matchmaking',
    subtitle: 'Casamento preditivo de atletas e simulação automática de janelas de transferência por IA',
    tech: 'FastAPI + pgvector + ClickHouse Historical Matrix',
    features: [
      'Vector-Based Player Similarity: Encontrar o substituto ideal para um atleta lesionado ou vendido cruzando distâncias de cosseno no pgvector.',
      'Market Value Predictive Model: Regressão em tempo real no ClickHouse para predizer a valorização financeira do atleta com base em scouts recentes.',
      'Automated Transfer Sandbox: Algoritmo que simula propostas, contrapropostas e negociações de IA baseadas na personalidade e finanças do clube.',
    ],
    phase: 'Fase 2 — Inteligência',
  },
  {
    icon: '📈', number: '02',
    title: 'Live Betting & Odds Compiler',
    subtitle: 'Motor matemático para precificação instantânea de odds esportivas baseadas em momentum',
    tech: 'Kafka + Redis + Go/Python Workers',
    features: [
      'Live Expected Goals (xG) Pricing: Recalcular a probabilidade de vitória, gols e cantos a cada simulation.tick ou frame de tracking.',
      'Dynamic Line Suspension: Interruptor automático (kill-switch) que suspende mercados de apostas via WebSocket quando a IA detecta um ataque perigoso iminente.',
      'Risk & Exposure Monitor: Painel administrativo para monitorar o volume de passivos financeiros por tenant em mercados de simulação.',
    ],
    phase: 'Fase 3 — Metaverso',
  },
  {
    icon: '🫀', number: '03',
    title: 'Injury Forecasting & Biometrics Hub',
    subtitle: 'Subsistema de medicina esportiva preditiva focado em desgaste físico e prevenção de lesões',
    tech: 'TimescaleDB + Scikit-Learn Model Serving',
    features: [
      'Stamina Decay Tracking: Gráficos de degradação metabólica acelerada quando o estilo tático exige alta intensidade (Gegenpress/Pressão Alta).',
      'Mechanical Load Anomaly Detection: Alertas em tempo real baseados no histórico de lesões (SCD Type 2) e na minutagem acumulada do atleta.',
      'Post-Match Recovery Pipeline: Geração automática de relatórios de reabilitação e modificadores negativos de atributos para as próximas partidas.',
    ],
    phase: 'Fase 1 — Visual',
  },
  {
    icon: '🎬', number: '04',
    title: 'Generative Multimedia & Social Studio',
    subtitle: 'Fábrica automática de conteúdo de mídia e engajamento orgânico utilizando IA Generativa',
    tech: 'S3 Buckets + LLM Engine + Dynamic Canvas Overlay Engines',
    features: [
      'Automated Match Highlights: Geração automática de pacotes de melhores momentos em formato de texto, JSON e gráficos vetoriais ao fim de cada partida.',
      'AI Press Conference Simulator: Entrevistas coletivas geradas por LLM com técnicos e jogadores após clássicos, influenciadas diretamente pela moral e resultado.',
      'Social Media Auto-Exporter: API que renderiza o card de atributos e o Radar SVG do Team of the Week em PNG/WebP de alta definição pronto para compartilhamento.',
    ],
    phase: 'Fase 1 — Visual',
  },
  {
    icon: '🌍', number: '05',
    title: 'Geospatial Scouting & Academy Tracker',
    subtitle: 'Módulo de captação de talentos focado em categorias de base e radar geográfico mundial',
    tech: 'PostgreSQL PostGIS + Mapbox GL / deck.gl',
    features: [
      'Global Grassroots Network: Mapeamento espacial de escolinhas, olheiros e torneios regionais de base associados a cada tenant.',
      'Density Heatmaps for Talent Scouting: Mapas de calor que cruzam a densidade demográfica com a taxa de surgimento de atletas Elite ou Legend.',
      'Youth Generation Algorithm (Regens): Algoritmo determinístico que injeta novos atletas fictícios na base do ecossistema anualmente, balanceando o ecossistema.',
    ],
    phase: 'Fase 2 — Inteligência',
  },
  {
    icon: '🛡️', number: '06',
    title: 'Advanced Anti-Cheat & Match Audit Room',
    subtitle: 'Blindagem forense e validação criptográfica de integridade para competições oficiais',
    tech: 'ClickHouse Logs + SHA256 Deterministic Seed Verification Middleware',
    features: [
      'Deterministic Seed Replay Verifier: Sistema que reexecuta a partida em background com os mesmos inputs para bater com os hashes originais e caçar anomalias.',
      'Tenant Leakage Scanner: Algoritmo de segurança ativa que testa constantemente as fronteiras de isolamento RLS do Postgres e Redis.',
      'API Abuse Anomaly Detection: Machine Learning isolado que bloqueia requisições e emite logs em audit_logs ao detectar padrões de scraping industrial de odds.',
    ],
    phase: 'Fase 2 — Inteligência',
  },
];

const phaseColors: Record<string, string> = {
  'Fase 1 — Visual': 'border-l-[#22c55e]',
  'Fase 2 — Inteligência': 'border-l-[#d4af37]',
  'Fase 3 — Metaverso': 'border-l-[#a855f7]',
};

export default function RoadmapPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#f5f0e8] tracking-tight">
          🚀 Roadmap
          <span className="block text-xs text-[#d4af37]/60 font-normal tracking-[0.2em] uppercase mt-0.5">
            MoirAI Next-Gen Feature Expansion
          </span>
        </h1>
        <p className="text-sm text-[#888] mt-2 max-w-2xl">
          Arquitetura orientada a eventos e hiper-escalável para a próxima geração do ecossistema esportivo MoirAI.
          Seis módulos de expansão divididos em três fases de integração.
        </p>
      </div>

      <div className="grid gap-6">
        {modules.map(m => (
          <div
            key={m.number}
            className={`bg-[#111] rounded-lg border border-[#1f1f1f] hover:border-[#d4af37]/20 transition-all p-5 ${phaseColors[m.phase]} border-l-2`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888] font-mono">{m.number}</span>
                    <h2 className="text-base font-bold text-[#f5f0e8]">{m.title}</h2>
                  </div>
                  <p className="text-xs text-[#888] mt-0.5 max-w-xl">{m.subtitle}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] whitespace-nowrap">{m.phase}</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-[#888]">Stack:</span>
              <code className="text-[10px] bg-black px-2 py-0.5 rounded text-[#d4af37]/80 border border-[#1f1f1f]">{m.tech}</code>
            </div>

            <ul className="space-y-2">
              {m.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#aaa] leading-relaxed">
                  <span className="text-[#d4af37] mt-0.5 shrink-0">◆</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-[#111] rounded-lg border border-[#1f1f1f] p-5">
        <h3 className="text-sm font-semibold text-[#d4af37] mb-3">🎯 Marcos de Integração</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#1f1f1f] rounded-lg p-3">
            <div className="text-[10px] text-[#22c55e] font-bold mb-1">Fase 1 — Visual</div>
            <div className="text-xs text-[#888]">
              Implementação do Biometrics Hub e acoplamento direto dos dados de fadiga no Radar SVG dinâmico.
            </div>
          </div>
          <div className="border border-[#1f1f1f] rounded-lg p-3">
            <div className="text-[10px] text-[#d4af37] font-bold mb-1">Fase 2 — Inteligência</div>
            <div className="text-xs text-[#888]">
              Deploy do pgvector Scouting Engine para comparação instantânea de perfis e arquétipos de atletas.
            </div>
          </div>
          <div className="border border-[#1f1f1f] rounded-lg p-3">
            <div className="text-[10px] text-[#a855f7] font-bold mb-1">Fase 3 — Metaverso</div>
            <div className="text-xs text-[#888]">
              Ativação do ecossistema de apostas simuladas com re-calculo dinâmico de odds no Redis Cluster.
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-4">
        <Link href="/" className="text-xs text-[#d4af37]/60 hover:text-[#d4af37] transition-colors underline underline-offset-4">
          ← Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
