'use client';

import { useState, useRef, useCallback } from 'react';
import type { BulkImportResult } from '@/types/database';

const ENTITY_TYPES = ['players', 'teams', 'staff', 'stadiums'] as const;
const ACCEPTED_FORMATS = ['.json', '.csv'];

interface ParsedFile {
  name: string;
  size: number;
  rows: Record<string, unknown>[];
}

export default function DataImportWizard() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'progress' | 'review'>('upload');
  const [entityType, setEntityType] = useState<typeof ENTITY_TYPES[number]>('players');
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      setError('Formato não suportado. Use JSON ou CSV.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        let rows: Record<string, unknown>[];
        if (ext === '.json') {
          const data = JSON.parse(text);
          rows = Array.isArray(data) ? data : data.data ?? [data];
        } else {
          const lines = text.split('\n').filter(Boolean);
          const first = lines[0];
          if (!first) { setError('Arquivo CSV vazio.'); return; }
          const headers = first.split(',').map(h => h.trim());
          rows = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim());
            return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
          });
        }
        setParsedFile({ name: file.name, size: file.size, rows });
        setErrors([]);
        setResult(null);
        setError('');
        setStep('mapping');
      } catch {
        setError('Falha ao processar o arquivo.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (!parsedFile) return;
    setImporting(true);
    setError('');
    try {
      const res = await fetch('/api/v1/import/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-system-role': 'super_admin' },
        body: JSON.stringify({
          entity_type: entityType,
          data: parsedFile.rows,
          options: { update_existing: true, dry_run: dryRun },
        }),
      });
      const body: BulkImportResult & { error?: string } = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Erro na importação');
      setResult(body);
      setErrors(body.errors ?? []);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setImporting(false);
    }
  }, [parsedFile, entityType, dryRun]);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-sport-gold">📥 Importação em Massa</h1>
      <p className="text-sport-dim text-sm">Sistema Unificado de Importação MoirAI (MOI-IMP)</p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded text-sm">{error}</div>}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div
          ref={dropRef}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-sport-border rounded-xl p-12 text-center hover:border-sport-accent transition-colors cursor-pointer"
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sport-dim mb-2">Arraste um arquivo JSON ou CSV aqui</p>
          <p className="text-xs text-sport-dim/60">Formatos aceitos: JSON, CSV</p>
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value as typeof ENTITY_TYPES[number])}
            className="mt-4 bg-sport-surface border border-sport-border rounded px-3 py-1.5 text-sm"
          >
            {ENTITY_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
          </select>
        </div>
      )}

      {/* Step 2: Mapping preview */}
      {step === 'mapping' && parsedFile && (
        <div className="space-y-4">
          <div className="bg-sport-surface border border-sport-border rounded-xl p-4">
            <p className="text-sm text-sport-dim">
              Arquivo: <span className="text-sport-text font-medium">{parsedFile.name}</span> &middot;
              {parsedFile.rows.length} registros
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-sport-dim border-b border-sport-border">
                    {Object.keys(parsedFile.rows[0] ?? {}).slice(0, 6).map(k => (
                      <th key={k} className="text-left px-2 py-1 font-medium">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedFile.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-sport-border/50">
                      {Object.values(row).slice(0, 6).map((v, j) => (
                        <td key={j} className="px-2 py-1 text-sport-text">{String(v).slice(0, 30)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedFile.rows.length > 5 && (
              <p className="text-xs text-sport-dim/60 mt-2">+{parsedFile.rows.length - 5} linhas</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} className="rounded" />
            <span className="text-sport-dim">Dry run (apenas validar, não importar)</span>
          </label>

          <div className="flex gap-3">
            <button onClick={() => { setStep('upload'); setParsedFile(null); }} className="px-4 py-2 text-sm bg-sport-border rounded hover:bg-sport-border/70 transition-colors">
              Voltar
            </button>
            <button onClick={handleImport} disabled={importing} className="px-4 py-2 text-sm bg-sport-accent text-black font-medium rounded hover:opacity-80 transition-opacity disabled:opacity-50">
              {importing ? 'Importando...' : dryRun ? 'Validar' : 'Importar'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Progress */}
      {step === 'progress' && (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-sport-dim">Processando importação...</p>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && result && (
        <div className="space-y-4">
          <div className="bg-sport-surface border border-sport-border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Resultado da Importação</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-sport-dim">Status:</span> <span className={result.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}>{result.status}</span></div>
              <div><span className="text-sport-dim">Tipo:</span> {result.entity_type}</div>
              <div><span className="text-sport-dim">Total:</span> {result.total_records}</div>
              <div><span className="text-sport-dim">Processados:</span> {result.processed_records}</div>
              <div><span className="text-sport-dim">Dry run:</span> {result.dry_run ? 'Sim' : 'Não'}</div>
              <div><span className="text-sport-dim">Batch ID:</span> <code className="text-xs">{result.batch_id.slice(0, 8)}...</code></div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-sport-surface border border-red-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Erros ({errors.length})</h3>
              <table className="text-xs w-full">
                <thead>
                  <tr className="text-sport-dim border-b border-sport-border">
                    <th className="text-left px-2 py-1">Linha</th>
                    <th className="text-left px-2 py-1">Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e, i) => (
                    <tr key={i} className="border-b border-sport-border/50">
                      <td className="px-2 py-1">{e.row}</td>
                      <td className="px-2 py-1 text-red-300">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button onClick={() => { setStep('upload'); setParsedFile(null); setResult(null); setErrors([]); }} className="px-4 py-2 text-sm bg-sport-accent text-black font-medium rounded hover:opacity-80 transition-opacity">
            Nova Importação
          </button>
        </div>
      )}
    </main>
  );
}
