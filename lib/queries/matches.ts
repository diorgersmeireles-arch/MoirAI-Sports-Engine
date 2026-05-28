import { query } from '@/lib/db';
import type { Match } from '@/types/database';

export async function getMatches(opts?: {
  sport?: string;
  status?: string;
  competitionId?: string;
}): Promise<Match[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (opts?.sport) {
    conditions.push(`sport_id = $${idx++}`);
    params.push(opts.sport);
  }
  if (opts?.status) {
    conditions.push(`status = $${idx++}`);
    params.push(opts.status);
  }
  if (opts?.competitionId) {
    conditions.push(`competition_id = $${idx++}`);
    params.push(opts.competitionId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<Match>(
    `SELECT * FROM matches ${where} ORDER BY scheduled_at DESC LIMIT 50`,
    params,
  );
  return result.rows;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const result = await query<Match>('SELECT * FROM matches WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function getLiveMatches(): Promise<Match[]> {
  const result = await query<Match>(
    "SELECT * FROM matches WHERE status = 'live' ORDER BY started_at DESC",
  );
  return result.rows;
}
