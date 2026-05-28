import { query } from '@/lib/db';
import type { Player } from '@/types/database';

export async function getPlayers(opts?: {
  sport?: string;
  search?: string;
  includeRetired?: boolean;
}): Promise<Player[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (opts?.sport) {
    conditions.push(`sport_id = $${idx++}`);
    params.push(opts.sport);
  }
  if (opts?.search) {
    conditions.push(`full_name ILIKE $${idx++}`);
    params.push(`%${opts.search}%`);
  }
  if (!opts?.includeRetired) {
    conditions.push('retired = false');
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query<Player>(`SELECT * FROM players ${where} ORDER BY full_name`);
  return result.rows;
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const result = await query<Player>('SELECT * FROM players WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function getLegends(opts?: { sport?: string }): Promise<Player[]> {
  const conditions: string[] = ['is_legend = true'];
  const params: unknown[] = [];
  let idx = 1;

  if (opts?.sport) {
    conditions.push(`sport_id = $${idx++}`);
    params.push(opts.sport);
  }

  const where = conditions.join(' AND ');
  const result = await query<Player>(`SELECT * FROM players WHERE ${where} ORDER BY legend_rating DESC`);
  return result.rows;
}
