---
name: ripgrep
description: Use when the user wants to search for text/patterns in files using ripgrep (rg). Covers installation on Windows, PowerShell equivalents, and usage examples. Trigger with keywords like "grep", "buscar", "procurar", "search", "find in files", "rg".
---

# ripgrep (rg)

Ferramenta de busca de texto ultrarrápida, disponível via comando `rg`.

## Instalação

### Windows (via winget)

```powershell
winget install BurntSushi.ripgrep.MSVC
```

### Linux/macOS

```bash
# Linux
sudo apt install ripgrep   # Debian/Ubuntu
sudo dnf install ripgrep   # Fedora
# macOS
brew install ripgrep
```

Reinicie o terminal após instalar para o PATH atualizar.

## Uso Básico

```bash
# Busca simples
rg "termo"

# Busca case-insensitive
rg -i "termo"

# Busca recursiva em todos os arquivos
rg "termo" .

# Busca em arquivos de tipo específico
rg "termo" --type ts
rg "termo" --type tsx
rg "termo" "src/**/*.tsx"

# Apenas nomes de arquivos (sem contexto)
rg -l "termo"
```

## Opções Úteis

| Flag            | Descrição                                  |
| --------------- | ------------------------------------------ |
| `-i`            | Case insensitive                           |
| `-l`            | Lista apenas nomes de arquivos             |
| `-n`            | Mostra número da linha                     |
| `-C <n>`        | Mostra n linhas de contexto antes e depois |
| `-B <n>`        | Linhas antes do match                      |
| `-A <n>`        | Linhas depois do match                     |
| `-v`            | Inverte (busca linhas que NÃO contêm)      |
| `--glob`        | Filtra por padrão de arquivo               |
| `--ignore-case` | Mesmo que `-i`                             |
| `-t <type>`     | Filtra por tipo (ts, tsx, js, etc.)        |
| `-w`            | Match whole words only                     |

## Exemplos Práticos

```bash
# Buscar função em todo o projeto
rg "useState"

# Buscar com contexto (3 linhas antes e depois)
rg -C 3 "useState"

# Apenas arquivos TypeScript
rg -t ts "async"

# Excluir node_modules
rg "query" --glob '!node_modules/**'

# Buscar e mostrar apenas matches
rg -o "import.*from"

# Count matches por arquivo
rg -c "useEffect"

# Buscar palavra inteira
rg -w "class"

# Buscar em múltiplos padrões
rg -g "*.{ts,tsx}" "export"

# Buscar em arquivo específico
rg "minha_busca" "src/routes/admin.index.tsx"
```

## PowerShell (Windows) - Alternativa Nativa

Se `rg` não estiver disponível:

```powershell
# Busca básica
Select-String -Path "*.ts" -Pattern "termo" -Recurse

# Case insensitive
Select-String -Path "*.ts" -Pattern "termo" -Recurse -CaseSensitive:$false

# Apenas nomes de arquivo
Select-String -Path "*.ts" -Pattern "termo" -Recurse | Select-Object -ExpandProperty Filename
```

## Scripts de Exemplo

```bash
# Buscar todos os imports de um componente
rg "^import .*from" --type tsx

# Buscar todos os console.log (para remover)
rg "console\.log"

# Buscar TODOs e FIXMEs
rg -i "TODO|FIXME"

# Buscar APIs/funções assíncronas
rg "async function|await" -t ts

# Buscar tipos específicos
rg "interface \w+|type \w+ =" --type ts

# Buscar em arquivos de styling
rg "\.css|\.module\." --glob "src/**"
```
