import { NextResponse } from 'next/server';
import type { BulkImportPayload, BulkImportResult, ImportBatch } from '@/types/database';

const VALID_ENTITY_TYPES = ['players', 'teams', 'staff', 'stadiums'] as const;

function checkRole(request: Request): boolean {
  const role = request.headers.get('x-system-role') ?? 'viewer';
  return role === 'super_admin' || role === 'global_manager' || role === 'tenant_admin';
}

function validatePayload(body: unknown): body is BulkImportPayload {
  if (!body || typeof body !== 'object') return false;
  const p = body as Record<string, unknown>;
  if (!VALID_ENTITY_TYPES.includes(p.entity_type as typeof VALID_ENTITY_TYPES[number])) return false;
  if (!Array.isArray(p.data) || p.data.length === 0) return false;
  return true;
}

function validateDataRows(rows: Record<string, unknown>[]): Array<{ row: number; message: string }> {
  const errors: Array<{ row: number; message: string }> = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row?.name as string | undefined;
    const fullName = row?.fullName as string | undefined;
    const full_name = row?.full_name as string | undefined;
    if (!name && !fullName && !full_name) {
      errors.push({ row: i + 1, message: 'Missing required field: name' });
    }
  }
  return errors;
}

export async function POST(request: Request) {
  if (!checkRole(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!validatePayload(body)) {
    return NextResponse.json({ error: 'Invalid payload. Required: entity_type + data[]' }, { status: 400 });
  }

  const payload = body as BulkImportPayload;
  const { entity_type, data, options = {} } = payload;
  const { update_existing = true, dry_run = false } = options;

  const validationErrors = validateDataRows(data as Record<string, unknown>[]);
  if (validationErrors.length > 0 && !update_existing) {
    return NextResponse.json({
      batch_id: '',
      entity_type,
      status: 'failed',
      total_records: data.length,
      processed_records: 0,
      errors: validationErrors,
      dry_run,
    } satisfies BulkImportResult, { status: 422 });
  }

  const batchId = crypto.randomUUID();

  const batch: ImportBatch = {
    id: batchId,
    tenant_id: 'ten1',
    entity_type,
    status: dry_run ? 'completed' : 'processing',
    total_records: data.length,
    processed_records: dry_run ? data.length : 0,
    error_log: validationErrors,
    created_by: 'auth0|system',
    created_at: new Date().toISOString(),
  };

  const result: BulkImportResult = {
    batch_id: batchId,
    entity_type,
    status: batch.status,
    total_records: data.length,
    processed_records: validationErrors.length > 0 ? data.length - validationErrors.length : data.length,
    errors: validationErrors,
    dry_run,
  };

  return NextResponse.json(result, { status: dry_run ? 200 : 202 });
}
