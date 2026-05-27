---
name: biblioteca
description: Atualiza e mantém a documentação do projeto sincronizada com o código-fonte. Age como um bibliotecário que organiza, revisa e versiona todos os documentos. Keywords: documentação, doc, docs, wiki, biblioteca, bibliotecário, README, map, pastas, atualizar docs, sincronizar docs, md, markdown.
---

# Skill Biblioteca

Mantém toda a documentação do projeto atualizada e sincronizada com o código.

## Acervo de Documentos

### Documentos Raiz
| Arquivo | Conteúdo | Quando Atualizar |
|---------|----------|------------------|
| `README.md` | Visão geral, stack, setup, deploy | Nova funcionalidade, mudança de stack, novo script |
| `SECURITY.md` | Política de segurança | Nova medida de segurança, mudança de auth/RLS |
| `plano.md` | Planos de correção de bugs | Após corrigir bugs documentados |

### WORKSPACE/
| Arquivo | Conteúdo | Quando Atualizar |
|---------|----------|------------------|
| `WORKSPACE/map.md` | Mapa da arquitetura (blueprint vivo) | **SEMPRE** após qualquer mudança estrutural |
| `WORKSPACE/pastas.md` | Análise completa do codebase | Após adicionar/remover arquivos ou pastas |
| `WORKSPACE/prompt_sistema_completo.md` | Prompt de recriação do sistema | Mudanças significativas de schema ou API |
| `WORKSPACE/perfis.md` | Perfis de usuário e dashboards | Novos papéis ou mudanças de permissão |
| `WORKSPACE/diretoria.md` | Apresentação para diretoria | Mudanças de escopo, roadmap, ou go-live |

### wiki/
| Arquivo | Conteúdo | Quando Atualizar |
|---------|----------|------------------|
| `wiki/home.md` | Página inicial da wiki | Qualquer mudança estrutural |
| `wiki/arquitetura.md` | Diagrama e decisões arquiteturais | Nova rota, server function, ou decisão técnica |
| `wiki/banco-de-dados.md` | Schema do banco (tabelas, RPCs, triggers) | **SEMPRE** após migração no banco |
| `wiki/papeis-permissoes.md` | Matriz RBAC | Novo papel, tabela, ou regra de acesso |
| `wiki/autenticacao-seguranca.md` | Fluxo de auth e segurança | Mudança em login, JWT, RLS, ou bcrypt |
| `wiki/modulos.md` | Módulos e funcionalidades | Nova feature, aba, ou funcionalidade |
| `wiki/api.md` | Server functions e endpoints | Nova server function, endpoint público, ou schema |
| `wiki/implantacao.md` | Deploy e DevOps | Novo script, variável de ambiente, ou provedor |
| `wiki/guia-desenvolvedor.md` | Guia de desenvolvimento | Mudança de convenção, padrão, ou setup |
| `wiki/testes.md` | Testes e coverage | Novo teste, suite, ou framework |

### docs/
| Arquivo | Conteúdo | Quando Atualizar |
|---------|----------|------------------|
| `docs/ui-ux-decisions.md` | Decisões de UI/UX | Novo componente, cor, ou padrão visual |

## Fluxo de Trabalho do Bibliotecário

### 1. Após Cada Mudança no Código

Identifique o tipo de mudança e atualize os documentos correspondentes:

**Mudança de banco de dados** (schema, RPC, trigger):
→ `wiki/banco-de-dados.md`, `WORKSPACE/map.md`

**Mudança de autenticação/autorização** (login, RLS, role):
→ `wiki/autenticacao-seguranca.md`, `wiki/papeis-permissoes.md`, `SECURITY.md`

**Nova funcionalidade/rota/server function:**
→ `wiki/modulos.md`, `wiki/api.md`, `wiki/arquitetura.md`, `README.md`

**Mudança de UI/UX** (componente, layout, cor):
→ `docs/ui-ux-decisions.md`

**Mudança de setup/scripts/deploy:**
→ `README.md`, `wiki/implantacao.md`, `wiki/guia-desenvolvedor.md`

**Mudança de testes:**
→ `wiki/testes.md`

### 2. Sincronização do MAP

`WORKSPACE/map.md` é o documento central. Deve ser atualizado SEMPRE que:

- Uma nova rota é criada ou removida
- Uma server function é adicionada ou modificada
- Uma tabela/coluna do banco é alterada
- Um fluxo principal do sistema muda
- Uma entidade ou relação é adicionada

### 3. Verificação de Consistência

Após atualizar um documento, verifique:

- Os links entre documentos ainda funcionam (referências a `wiki/*.md`, `WORKSPACE/*.md`)
- Os exemplos de código estão atualizados com a API real
- As listas de funções/tabelas/rotas refletem o código atual
- O changelog em `WORKSPACE/map.md` foi atualizado

## Padrões de Documentação

### Estilo
- Português (pt-BR) para documentação de domínio
- Tabelas para listar funções, rotas, permissões
- Diagramas ASCII ou Mermaid para fluxos
- Code snippets em TypeScript com sintaxe destacada

### Metadados
- Datas nos changelogs no formato `DD/MM/AAAA`
- Seção de "Última Atualização" no topo de documentos longos
- Tabela de conteúdos em documentos com mais de 3 seções

### Versionamento
- Alterações documentadas na seção CHANGELOG de `map.md`
- Mudanças grandes (nova funcionalidade completa) devem ter entrada descritiva
- Mudanças pequenas (correção de typo, atualização de link) apenas mencionadas
