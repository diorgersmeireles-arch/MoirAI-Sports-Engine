// MADev Core - Hook de conexão resiliente com o MoirAI API Gateway WebSocket
// Implementa auto-reconnect com backoff exponencial e validação de Tenant em nível de Handshake
'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useLiveMatchStore } from '../store/useLiveMatchStore';

interface WebSocketPayload {
  event_type: 'tracking_frame' | 'score_update' | 'event_ticker' | 'match_status';
  event_sequence_realtime?: number;
  possession_percentage?: number;
  offensive_pressure_index?: number;
  live_xg_home?: number;
  live_xg_away?: number;
  players?: unknown[];
  ball?: unknown;
}

const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;

export const useMatchWebSocket = (matchId: string, tenantId: string) => {
  const ws = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setLiveFrame, pushEvent } = useLiveMatchStore();

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const gatewayUrl = `ws://localhost:8000/live/match/${matchId}?tenant_id=${tenantId}`;
    ws.current = new WebSocket(gatewayUrl);

    ws.current.onopen = () => {
      retryCount.current = 0;
    };

    ws.current.onmessage = (messageEvent: MessageEvent) => {
      try {
        const payload: WebSocketPayload = JSON.parse(messageEvent.data);
        if (payload.event_type === 'tracking_frame') {
          setLiveFrame({
            event_sequence_realtime: payload.event_sequence_realtime ?? 0,
            possession_percentage: payload.possession_percentage ?? 50,
            offensive_pressure_index: payload.offensive_pressure_index ?? 0,
            live_xg_home: payload.live_xg_home ?? 0,
            live_xg_away: payload.live_xg_away ?? 0,
            players: (payload.players ?? []) as never[],
            ball: (payload.ball ?? null) as never,
          });
        } else {
          pushEvent(payload as unknown as Record<string, unknown>);
        }
      } catch {
        console.error('[MoirAI WS] Falha ao parsear payload de telemetria.');
      }
    };

    ws.current.onerror = () => {
      console.error('[MoirAI WS] Falha na telemetria em tempo real.');
    };

    ws.current.onclose = () => {
      if (retryCount.current < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount.current);
        retryTimeout.current = setTimeout(() => {
          retryCount.current += 1;
          connect();
        }, delayMs);
      }
    };
  }, [matchId, tenantId, setLiveFrame, pushEvent]);

  useEffect(() => {
    connect();
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      if (ws.current) ws.current.close();
    };
  }, [connect]);
};
