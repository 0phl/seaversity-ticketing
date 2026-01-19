"use client";

import Link from "next/link";
import { Play, Square, Clock, Ticket, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/use-timer";
import { formatDuration } from "@/stores/timer-store";

/**
 * Global timer bar that shows the currently running timer
 * Appears at the top of the dashboard when a timer is active
 */
export function ActiveTimerBar() {
  const { activeTimer, elapsedSeconds, isLoading, stopTimer } = useTimer();

  if (!activeTimer) {
    return null;
  }

  const handleStop = async () => {
    await stopTimer();
  };

  const workItemUrl =
    activeTimer.workItemType === "TICKET"
      ? `/tickets/${activeTimer.workItemId}`
      : `/tasks/${activeTimer.workItemId}`;

  const WorkItemIcon =
    activeTimer.workItemType === "TICKET" ? Ticket : ListTodo;

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          {/* Pulsing indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <Clock className="h-4 w-4" />
          </div>

          {/* Timer display */}
          <span className="font-mono text-lg font-bold">
            {formatDuration(elapsedSeconds)}
          </span>

          {/* Work item link */}
          <Link
            href={workItemUrl}
            className="flex items-center gap-2 hover:underline"
          >
            <WorkItemIcon className="h-4 w-4" />
            <span className="font-mono text-sm opacity-80">
              {activeTimer.workItemNumber}
            </span>
            <span className="text-sm max-w-[300px] truncate">
              {activeTimer.workItemTitle}
            </span>
          </Link>
        </div>

        {/* Stop button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleStop}
          disabled={isLoading}
          className="bg-white/20 hover:bg-white/30 text-white border-0"
        >
          <Square className="h-4 w-4 mr-2 fill-current" />
          Stop Timer
        </Button>
      </div>
    </div>
  );
}
