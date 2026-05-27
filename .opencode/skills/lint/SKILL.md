---
name: lint
description: Run linting, formatting, and type-checking on the codebase. Use before committing or after any code change. Keywords: lint, eslint, prettier, format, tsc, typecheck, check, estilo, código, padronizar.
---

# Lint Skill

Executa lint, formatação e verificação de tipos no projeto.

## Comandos Disponíveis

```bash
# ESLint — verifica erros e warnings
npm run lint

# Prettier — formata todo o código
npm run format

# TypeScript — verificação de tipos (sem emitir arquivos)
npx tsc --noEmit
```

## Configuração

### ESLint (`eslint.config.js`)

- **Formato**: Flat config (ESLint 9)
- **Plugins**: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-prettier`
- **Regras notáveis**:
  - `no-restricted-imports`: Bloqueia `server-only` (TanStack Start usa `.server.ts`)
  - `react-refresh/only-export-components`: Warn
  - `@typescript-eslint/no-unused-vars`: Off
- **Ignora**: `dist`, `.output`, `.vinxi`
- **Alvos**: `**/*.{ts,tsx}`

### Prettier (`.prettierrc`)

| Opção           | Valor   |
|-----------------|---------|
| `printWidth`    | 100     |
| `semi`          | true    |
| `singleQuote`   | false   |
| `trailingComma` | "all"   |

### TypeScript (`tsconfig.json`)

- **strict**: true
- **target**: ES2022
- **moduleResolution**: Bundler
- **skipLibCheck**: true
- **noUnusedLocals/Parameters**: false
- **Paths**: `@/*` → `./src/*`

## Fluxo de Trabalho

SEMPRE execute antes de finalizar uma tarefa:

1. **Lint**: `npm run lint` — corrija erros, warnings são aceitáveis
2. **TypeScript** (se houver mudanças significativas): `npx tsc --noEmit` — garanta zero erros de tipo
3. **Format** (opcional): `npm run format` — padroniza formatação

### Correção Automática

```bash
# ESLint com auto-fix
npx eslint . --fix
```

### Dicas

- O ESLint já integra o Prettier via `eslint-plugin-prettier/recommended` — não precisa rodar ambos separadamente na maioria dos casos.
- Se o `tsc --noEmit` falhar por erros de tipo em libs externas, use `"skipLibCheck": true` (já configurado).
- O `routeTree.gen.ts` é ignorado pelo Prettier — não edite manualmente.
