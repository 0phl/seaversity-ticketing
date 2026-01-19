import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActiveTimer {
  id: string;
  workItemId: string;
  workItemTitle: string;
  workItemNumber: string;
  workItemType: "TICKET" | "TASK";
  startedAt: string;
  userId: string;
}

interface TimerState {
  activeTimer: ActiveTimer | null;
  isLoading: boolean;
  intervalId: NodeJS.Timeout | null;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  setLoading: (loading: boolean) => void;
  clearTimer: () => void;
  setIntervalId: (id: NodeJS.Timeout | null) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTimer: null,
      isLoading: false,
      intervalId: null,
      setActiveTimer: (timer) => set({ activeTimer: timer }),
      setLoading: (loading) => set({ isLoading: loading }),
      clearTimer: () => {
        const { intervalId } = get();
        if (intervalId) {
          clearInterval(intervalId);
        }
        set({ activeTimer: null, intervalId: null });
      },
      setIntervalId: (id) => set({ intervalId: id }),
    }),
    {
      name: "seaversity-timer-storage",
      partialize: (state) => ({
        activeTimer: state.activeTimer,
      }),
    }
  )
);

/**
 * Calculate elapsed seconds from startedAt time
 * This should be used instead of storing elapsed in state
 */
export function calculateElapsedSeconds(startedAt: string): number {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 1000);
}

/**
 * Format seconds to HH:MM:SS display
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) {
    parts.push(hours.toString().padStart(2, "0"));
  }
  parts.push(minutes.toString().padStart(2, "0"));
  parts.push(seconds.toString().padStart(2, "0"));

  return parts.join(":");
}

/**
 * Format minutes to human-readable string
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
