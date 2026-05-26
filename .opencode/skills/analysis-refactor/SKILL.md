---
name: analysis-refactor
description: Use when analyzing, refactoring, or improving the codebase. Automatically updates map.md after every change round. Keywords: refatorar, análise, melhorar, map, architecture, restructure, optimize.
---

# Analysis & Refactor Skill

Analisa o sistema e mantém `map.md` atualizado após cada ciclo de modificações.

## Fluxo de Trabalho

### 1. Leitura Inicial (se map.md não existir)

Se `map.md` não existir, leia TODOS os arquivos principais e gere-o:

```bash
# Localização do map.md
WORKSPACE/map.md
```

### 2. Após Cada Rodada de Modificações

SEMPRE após completar um ciclo de mudanças (independente de tamanho), reanalise e atualize `map.md`:

1. Leia o map.md atual
2. Leia os arquivos modificados/criados
3. Atualize apenas as seções afetadas
4. Adicione entradas de CHANGELOG

### 3. Estrutura do map.md

```markdown
# MAP.md - Arquitetura do Sistema

## Sistema

**Nome**: Devolutivas - Colégio João XXIII
**Stack**: TanStack Start + Supabase + Cloudflare Workers
**Última Atualização**: [DATA_ATUAL]

---

## 📁 Estrutura de Arquivos

\`\`\`
src/
├── routes/ # Páginas e rotas
├── lib/ # Lógica de negócio
├── components/ # Componentes UI
├── hooks/ # Custom hooks
└── integrations/ # Supabase client
\`\`\`

---

## 🏗️ Arquitetura

### Fluxo de Dados

\`\`\`
[Usuário] → [Rotas] → [Server Functions] → [Supabase] → [Email/SMTP]
\`\`\`

### Camadas

| Camada                | Responsabilidade                           |
| --------------------- | ------------------------------------------ |
| **UI Layer**          | Componentes React, formulários, exibição   |
| **Route Layer**       | TanStack Router, autenticação, autorização |
| **Server Functions**  | Lógica de negócio, validação, RLS bypass   |
| **Data Layer**        | Supabase (PostgreSQL + Auth + Storage)     |
| **Integration Layer** | Email SMTP, calendar (.ics)                |

---

## 📋 Componentes Principais

### 1. Página Pública de Agendamento (`src/routes/index.tsx`)

**Responsabilidade**: Fluxo de agendamento para famílias

**Estado Local**:

- `matricula` - número de matrícula do aluno
- `teacherId` - professor selecionado
- `selectedSlot` - horário escolhido
- `studentData` - dados do aluno via RPC

**Funções Principais**:
| Função | Linha | Descrição |
|--------|-------|-----------|
| `loadAvailability()` | ~54 | Carrega slots e agendamentos |
| `lookupMatricula()` | ~71 | Busca aluno via RPC |
| `handleSubmit()` | ~109 | Insere agendamento |
| `reset()` | ~169 | Limpa formulário |

**Validações**:

- Matrícula deve ter 2+ caracteres
- Professor deve ter vínculo com aluno
- Slot não pode estar ocupado
- Aluno não pode ter 2 agendamentos no mesmo horário

---

### 2. Painel Administrativo (`src/routes/admin.index.tsx`)

**Responsabilidade**: Dashboard completo com RBAC

**Tabs/Rotas**:
| Tab | Rota | Papéis |
|-----|------|--------|
| Dashboard | /admin | admin, coordination, secretary |
| Alunos | /admin/alunos | admin, coordination |
| Professores | /admin | admin, coordination |
| Vínculos | /admin | admin, coordination |
| Relatórios | /admin | admin, coordination, secretary |
| Horários | /admin | admin |
| E-mail | /admin | admin, coordination |
| Logs | /admin | admin |
| Usuários | /admin | admin |

**Estado Global**:
\`\`\`typescript
segments, teachers, bookings, disabledSlots // Dados principais
students, staffUsers, logs // Dados de usuários
links, reports, slots, coords // Dados relacionais
\`\`\`

---

### 3. Server Functions (`src/lib/admin.functions.ts`)

**Autenticação**: Middleware JWT via `requireSupabaseAuth`

**Autorização**: `ensureRole()` com bypass para super-admin

**Funções Importantes**:

| Função                         | Papéis              | Descrição                |
| ------------------------------ | ------------------- | ------------------------ |
| `importStudents`               | admin, coordination | Upsert via matrícula     |
| `importTeachers`               | admin, coordination | Bulk import CSV          |
| `importStaff`                  | admin               | Criar usuários staff     |
| `upsertTeacherWithCredentials` | admin, coordination | Professor + auth user    |
| `deleteBooking`                | admin, coordination | Cancelar c/ auditoria    |
| `sendBookingNotifications`     | interno             | Email + .ics             |
| `searchStudents`               | todos               | Busca por nome/matrícula |

---

### 4. Cliente Supabase (`src/integrations/supabase/`)

**Arquivos**:

- `client.ts` - Cliente público (anon key)
- `client.server.ts` - Cliente admin (service role)
- `auth-middleware.ts` - Validação JWT
- `types.ts` - Tipos gerados do banco

**Padrão**: Singleton via Proxy para evitar múltiplas instâncias

---

### 5. Email (`src/lib/email.server.ts`)

**SMTP**: Exchange 365 (Office 365)

**Templates**:
| Template | Uso |
|----------|-----|
| `renderBookingConfirmationEmail()` | Confirmação agendamento |
| `renderTeacherFullScheduleEmail()` | Grade completa (14 slots) |
| `buildIcs()` | Convite de calendário (.ics) |

---

## 🔗 Fluxos Principais

### Fluxo 1: Agendamento Público

\`\`\`

1. Família acessa /
2. Digita matrícula → RPC lookup_student
3. Sistema retorna: aluno + professores vinculados
4. Se sem vínculo → BLOQUEADO
5. Família seleciona professor → horário
6. Formsubmit → INSERT bookings
7. POST /api/public/booking-notify
8. sendBookingNotifications() → Email + .ics
9. Se 14 agendamentos → Full schedule email
   \`\`\`

### Fluxo 2: Admin - Criar Professor

\`\`\`

1. Admin acessa /admin
2. Tab Professores → Adicionar
3. upsertTeacherWithCredentials() →
   - INSERT teachers
   - INSERT/UPDATE auth.users
   - Hash senha com bcrypt
   - INSERT user_roles (teacher)
4. Audit log registrado
5. Admin pode reenviar credenciais por email
   \`\`\`

### Fluxo 3: Admin - Vincular Aluno a Professor

\`\`\`

1. Admin acessa Tab Vínculos
2. Busca aluno (searchStudents)
3. Clica em "Vincular" (createTeacherStudentLink)
4. INSERT teacher_students
5. Aluno pode agora ser agendado com esse professor
   \`\`\`

---

## 📊 Entidades do Banco

### Tabelas Principais

| Tabela                 | PK                       | Relations                                  |
| ---------------------- | ------------------------ | ------------------------------------------ |
| `students`             | matricula                | 1:N bookings, N:M teachers                 |
| `teachers`             | id                       | 1:N bookings, N:M students, 1:1 auth.users |
| `segments`             | id                       | 1:N teachers, N:M coordinators             |
| `bookings`             | id                       | N:1 teachers, N:1 students                 |
| `teacher_students`     | (teacher_id, student_id) | N:1 teachers, N:1 students                 |
| `meeting_reports`      | id                       | N:1 teachers, N:1 students                 |
| `time_slots`           | id                       | N:1 segments (opcional)                    |
| `disabled_slots`       | (teacher_id, slot_time)  | N:1 teachers                               |
| `user_roles`           | (user_id, role)          | N:1 auth.users                             |
| `segment_coordinators` | (user_id, segment_id)    | N:1 users, N:1 segments                    |
| `audit_logs`           | id                       | -                                          |
| `profiles`             | user_id                  | 1:1 auth.users                             |

### Funções RPC

| Função            | Acesso  | Descrição                              |
| ----------------- | ------- | -------------------------------------- |
| `lookup_student`  | anon    | Busca por matrícula (SECURITY DEFINER) |
| `get_taken_slots` | público | Slots ocupados por professor           |
| `has_role`        | interno | Verifica papel do usuário              |

### Triggers

| Trigger            | Tabela                    | Descrição                            |
| ------------------ | ------------------------- | ------------------------------------ |
| `validate_booking` | bookings (BEFORE INSERT)  | Valida horário, vínculo, duplicidade |
| `handle_new_user`  | auth.users (AFTER INSERT) | Cria perfil + papel automático       |

---

## 🔒 Segurança

| Medida           | Implementação                     |
| ---------------- | --------------------------------- |
| RLS              | Ativo em todas as tabelas         |
| Auth Middleware  | JWT validado em server functions  |
| Super Admin      | Email hardcoded (bypass de roles) |
| Input Validation | Zod schemas em todas as inputs    |
| Password Hashing | bcrypt (salt rounds: 10)          |
| Audit            | Todos os actions em audit_logs    |
| XSS Prevention   | HTML escape em templates de email |

---

## 🔄 Padrões de Código

### Server Functions

\`\`\`typescript
export const myFunction = createServerFn({ method: "POST" })
.validator(inputValidator(zodSchema))
.handler(async (event) => {
const context = await requireSupabaseAuth(event);
ensureRole(context, ["admin", "coordination"]);
// ... lógica
});
\`\`\`

### Estado Local (React)

\`\`\`typescript
const [state, setState] = useState<Type>(initialValue);
const [debouncedState] = useDebounce(state, 500);
\`\`\`

### RPC Calls

\`\`\`typescript
const { data } = await supabase.rpc("function_name", { param: value });
\`\`\`

### Server Functions (Client-side call)

\`\`\`typescript
import { myFunction } from "@/lib/admin.functions";
const result = await myFunction({ param: value });
\`\`\`

---

## 🚧 Issues Conhecidos / Pendências

<!-- Lista de problemas identificados pendentes de correção -->

| Issue | Severidade | Arquivo | Descrição |
| ----- | ---------- | ------- | --------- |
| -     | -          | -       | Nenhum    |

---

## 📝 CHANGELOG

### [DATA_ATUAL]

- Início do mapeamento do sistema
- Criação da estrutura base do map.md
  \`\`\`
```
