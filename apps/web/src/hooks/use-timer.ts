"use client";

import { useEffect, useCallback, useRef } from "react";
import { useTimerStore, type ActiveTimer } from "@/stores/timer-store";

interface WorkItem {
  id: string;
  title: string;
  ticketNumber: string | null;
  taskNumber: string | null;
  type: "TICKET" | "TASK";
}

interface TimeLogResponse {
  id: string;
  workItemId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationMins: number | null;
  isRunning: boolean;
  workItem: WorkItem;
  user: {
    id: string;
    name: string;
  };
}

export function useTimer() {
  const {
    activeTimer,
    elapsedSeconds,
    isLoading,
    setActiveTimer,
    setElapsedSeconds,
    incrementElapsed,
    setLoading,
    clearTimer,
  } = useTimerStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Calculate elapsed seconds from startedAt time
   */
  const calculateElapsed = useCallback((startedAt: string): number => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1000);
  }, []);

  /**
   * Fetch the active timer from the server
   */
  const fetchActiveTimer = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/time-logs/active");
      if (!res.ok) {
        throw new Error("Failed to fetch active timer");
      }

      const data: TimeLogResponse | null = await res.json();

      if (data && data.isRunning) {
        const timer: ActiveTimer = {
          id: data.id,
          workItemId: data.workItem.id,
          workItemTitle: data.workItem.title,
          workItemNumber:
            data.workItem.ticketNumber || data.workItem.taskNumber || "",
          workItemType: data.workItem.type,
          startedAt: data.startedAt,
          userId: data.userId,
        };
        setActiveTimer(timer);
        setElapsedSeconds(calculateElapsed(data.startedAt));
      } else {
        clearTimer();
      }
    } catch (error) {
      console.error("Error fetching active timer:", error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setActiveTimer, setElapsedSeconds, calculateElapsed, clearTimer]);

  /**
   * Start a timer for a work item
   */
  const startTimer = useCallback(
    async (workItemId: string, notes?: string): Promise<boolean> => {
      try {
        setLoading(true);
        const res = await fetch("/api/time-logs/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workItemId, notes }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to start timer");
        }

        const data: TimeLogResponse = await res.json();

        const timer: ActiveTimer = {
          id: data.id,
          workItemId: data.workItem.id,
          workItemTitle: data.workItem.title,
          workItemNumber:
            data.workItem.ticketNumber || data.workItem.taskNumber || "",
          workItemType: data.workItem.type,
          startedAt: data.startedAt,
          userId: data.userId,
        };

        setActiveTimer(timer);
        setElapsedSeconds(0);
        return true;
      } catch (error) {
        console.error("Error starting timer:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setActiveTimer, setElapsedSeconds]
  );

  /**
   * Stop the currently running timer
   */
  const stopTimer = useCallback(
    async (notes?: string): Promise<boolean> => {
      if (!activeTimer) return false;

      try {
        setLoading(true);
        const res = await fetch("/api/time-logs/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timeLogId: activeTimer.id, notes }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to stop timer");
        }

        clearTimer();
        return true;
      } catch (error) {
        console.error("Error stopping timer:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [activeTimer, setLoading, clearTimer]
  );

  /**
   * Check if timer is running for a specific work item
   */
  const isTimerRunningFor = useCallback(
    (workItemId: string): boolean => {
      return activeTimer?.workItemId === workItemId;
    },
    [activeTimer]
  );

  // Set up the interval to increment elapsed time
  useEffect(() => {
    if (activeTimer) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start new interval
      intervalRef.current = setInterval(() => {
        incrementElapsed();
      }, 1000);

      // Calculate initial elapsed time
      setElapsedSeconds(calculateElapsed(activeTimer.startedAt));
    } else {
      // Clear interval when no active timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer, incrementElapsed, setElapsedSeconds, calculateElapsed]);

  // Fetch active timer on mount
  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  return {
    activeTimer,
    elapsedSeconds,
    isLoading,
    startTimer,
    stopTimer,
    fetchActiveTimer,
    isTimerRunningFor,
  };
}
