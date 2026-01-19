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
  elapsedSeconds: number;
  isLoading: boolean;
  setActiveTimer: (timer: ActiveTimer | null) => void;
  setElapsedSeconds: (seconds: number) => void;
  incrementElapsed: () => void;
  setLoading: (loading: boolean) => void;
  clearTimer: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      activeTimer: null,
      elapsedSeconds: 0,
      isLoading: false,
      setActiveTimer: (timer) => set({ activeTimer: timer }),
      setElapsedSeconds: (seconds) => set({ elapsedSeconds: seconds }),
      incrementElapsed: () =>
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
      setLoading: (loading) => set({ isLoading: loading }),
      clearTimer: () => set({ activeTimer: null, elapsedSeconds: 0 }),
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
