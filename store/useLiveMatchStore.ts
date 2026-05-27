// MADev Core - Gerenciamento de estado de baixíssima latência via Zustand Slice Pattern
// Evita re-renders massivos ao receber telemetria espacial de 25 FPS
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface SpatialCoordinate {
  playerId?: string;
  teamSide?: 'home' | 'away';
  xPos: number;
  yPos: number;
  zPos?: number;
  speed?: number;
  shirtNumber?: number;
}

interface LiveMatchState {
  activeMatchId: string | null;
  currentSequence: number;
  possession: number;
  offensivePressure: number;
  liveXg: { home: number; away: number };
  spatialCoordinates: { players: SpatialCoordinate[]; ball: SpatialCoordinate | null };
  eventTicker: Record<string, unknown>[];
  isIngesting: boolean;
  setActiveMatch: (matchId: string) => void;
  setLiveFrame: (frame: {
    event_sequence_realtime: number;
    possession_percentage: number;
    offensive_pressure_index: number;
    live_xg_home: number;
    live_xg_away: number;
    players: SpatialCoordinate[];
    ball: SpatialCoordinate | null;
  }) => void;
  pushEvent: (event: Record<string, unknown>) => void;
}

export const useLiveMatchStore = create<LiveMatchState>()(
  devtools(
    (set) => ({
      activeMatchId: null,
      currentSequence: 0,
      possession: 50.0,
      offensivePressure: 0,
      liveXg: { home: 0.0, away: 0.0 },
      spatialCoordinates: { players: [], ball: null },
      eventTicker: [],
      isIngesting: true,
      setActiveMatch: (matchId) => set({ activeMatchId: matchId }),
      setLiveFrame: (frame) =>
        set({
          currentSequence: frame.event_sequence_realtime,
          possession: frame.possession_percentage,
          offensivePressure: frame.offensive_pressure_index,
          liveXg: { home: frame.live_xg_home, away: frame.live_xg_away },
          spatialCoordinates: { players: frame.players, ball: frame.ball },
        }),
      pushEvent: (event) =>
        set((state) => ({
          eventTicker: [event, ...state.eventTicker.slice(0, 49)],
        })),
    }),
    { name: 'LiveMatchStore' },
  ),
);
