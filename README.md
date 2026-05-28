# MoirAI Sports Engine

> "O destino dos esportes, calculado pela matemática e guiado por dados."

O **MoirAI Sports Engine** é uma plataforma de inteligência de dados e análise estatística de alta precisão desenvolvida em TypeScript. Inspirada nas **Moiras** da mitologia grega — as tecelãs do destino —, a plataforma substitui o "achismo" e a intuição por modelagem matemática rigorosa, processando o histórico de equipes e eventos em tempo real para decodificar e prever o desfecho de partidas esportivas.

Projetada com uma arquitetura estritamente tipada e orientada a dados (Data-Driven), a MoirAI funciona como um ecossistema SaaS robusto, capaz de rodar **simulações complexas ao vivo**, identificar **distorções no mercado financeiro esportivo** e alertar usuários instantaneamente sobre oportunidades de alto valor.

---

## 🛠️ Pilares Tecnológicos e Funcionalidades

### 1. O Fio do Passado: Historical Math Engine

Análise retroativa profunda baseada em funções puras. O motor calcula com precisão decimal (livre de erros de ponto flutuante do JavaScript) as taxas de vitória/empate/derrota, métricas de gols (Over/Under) e a dominância histórica em confrontos diretos (H2H). Utiliza um sistema de **Form Score Ponderado**, dando mais relevância estatística aos jogos mais recentes para mapear o momento real de cada equipe.

### 2. O Fio do Presente: Live Predictive Engine & Simulator

Um algoritmo de processamento em tempo real que consome dados via WebSockets. Ele combina a **Distribuição de Poisson** com o estado dinâmico do jogo (tempo decorrido, cartões vermelhos, finalizações e volume de ataques perigosos por minuto) para recalcular instantaneamente as probabilidades do evento. O sistema também ajusta seus cálculos automaticamente assim que as escalações oficiais são liberadas, penalizando ou bonificando equipes pela ausência de jogadores-chave.

### 3. O Fio do Destino: Value & Bankroll Intelligence

Inteligência financeira aplicada aos dados. O módulo calcula o **Valor Esperado ($EV$)** cruzando as probabilidades reais da MoirAI com as odds oferecidas pelo mercado. Ao encontrar uma distorção vantajosa, o sistema aplica o **Critério de Kelly** para sugerir matematicamente a porcentagem exata de gestão de banca a ser utilizada, mitigando riscos de quebra.

### 4. O Olhar das Moiras: Live Scanner & Webhook Alerts

Um scanner automatizado de alto desempenho que varre centenas de partidas simultâneas. Filtros avançados isolam jogos que atingem gatilhos matemáticos específicos (ex: alta pressão ofensiva e xG acumulado no final do segundo tempo). Assim que um padrão é validado, um payload limpo e formatado é disparado via **Webhooks** para canais do Telegram ou Discord.

---

## 💻 Stack Técnica Core

| Camada | Tecnologia |
|--------|-----------|
| **Linguagem** | TypeScript (strict: true, sem `any`) |
| **Framework** | Next.js 14 (App Router) |
| **UI** | React 18 + Tailwind CSS v3 |
| **Real-Time** | WebSockets + Zustand (Slice Pattern) |
| **Operacional** | PostgreSQL + pgvector (58 tabelas, 20 ENUMs) |
| **Streaming** | Kafka / Redpanda |
| **Cache** | Redis Cluster |
| **Time-Series** | TimescaleDB |
| **Analytics** | ClickHouse |
| **Auth** | JWT + X-Tenant-ID + RBAC (7 system_roles) |
| **AI** | pgvector embeddings + Knowledge Graph + ML Feature Store |

**Blueprint**: v0.4.0-Alpha · Reactive-Microservices-EDA

---

## 📦 Quick Start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Build de produção (20 rotas, 0 erros)
```

---

## 📁 Estrutura

```
moirai-sports-engine/
├── app/              # 20 rotas (Dashboard, Partidas, Atletas, Scanner,
│                     #   Competições, Comparar, Lendas, Dream Team)
├── components/       # LiveMatchTracker + SpatialPitchRender (Canvas)
├── data/             # Seed mockado: 5 comps, 23 times, 28 jogadores
├── database/         # Schema PostgreSQL + ClickHouse DDL
├── hooks/            # WebSocket resiliente com backoff exponencial
├── middleware/        # tenant_boundary + rbac_enforcer (Python/FastAPI)
├── services/         # Prediction Engine + Scanner Service
├── store/            # Zustand: live match state (25 FPS)
└── types/            # 97 interfaces, 0 any
```

---

## 🎯 Público-Alvo

- **Analistas e Cientistas de Dados Esportivos** que buscam ferramentas avançadas de modelagem.
- **Apostadores Profissionais (Syndicates & Inbound Traders)** que necessitam de cálculo de $EV$ e gestão de banca automatizada.
- **Plataformas de Mídia e Portais de Esporte** que desejam enriquecer suas transmissões com estatísticas preditivas de última geração.

---

## 📜 Licença

© 2025-2026 MADev. Todos os direitos reservados.
