"use client";

import { useEffect, useCallback, useState } from "react";
import { useTimerStore, calculateElapsedSeconds, type ActiveTimer } from "@/stores/timer-store";

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
    isLoading,
    setActiveTimer,
    setLoading,
    clearTimer,
  } = useTimerStore();

  // Local state for elapsed seconds - calculated from startedAt
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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
      } else {
        clearTimer();
      }
    } catch (error) {
      console.error("Error fetching active timer:", error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setActiveTimer, clearTimer]);

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
        return true;
      } catch (error) {
        console.error("Error starting timer:", error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setActiveTimer]
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

  // Set up interval to update elapsed seconds based on startedAt
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (activeTimer) {
      // Calculate initial elapsed time immediately
      setElapsedSeconds(calculateElapsedSeconds(activeTimer.startedAt));

      // Update every second by recalculating from startedAt
      intervalId = setInterval(() => {
        setElapsedSeconds(calculateElapsedSeconds(activeTimer.startedAt));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeTimer]);

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
