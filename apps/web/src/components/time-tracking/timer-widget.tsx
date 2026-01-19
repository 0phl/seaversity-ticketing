"use client";

import { useState } from "react";
import { Play, Square, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/use-timer";
import { formatDuration } from "@/stores/timer-store";
import { useToast } from "@/hooks/use-toast";

interface TimerWidgetProps {
  workItemId: string;
  workItemTitle: string;
  workItemNumber: string;
  workItemType: "TICKET" | "TASK";
}

/**
 * Timer widget for starting/stopping time tracking on a work item
 */
export function TimerWidget({
  workItemId,
  workItemTitle,
  workItemNumber,
  workItemType,
}: TimerWidgetProps) {
  const { activeTimer, elapsedSeconds, isLoading, startTimer, stopTimer, isTimerRunningFor } =
    useTimer();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const isRunningOnThis = isTimerRunningFor(workItemId);
  const isRunningOnOther = activeTimer && !isRunningOnThis;

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      const success = await startTimer(workItemId);
      if (success) {
        toast({
          title: "Timer started",
          description: `Now tracking time on ${workItemNumber}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to start timer",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = async () => {
    setIsProcessing(true);
    try {
      const success = await stopTimer();
      if (success) {
        toast({
          title: "Timer stopped",
          description: `Time logged for ${workItemNumber}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Failed to stop timer",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const loading = isLoading || isProcessing;

  if (isRunningOnThis) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
        {/* Pulsing indicator */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>

        {/* Timer display */}
        <div className="flex items-center gap-2 flex-1">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-mono text-lg font-bold text-primary">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>

        {/* Stop button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={handleStop}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Square className="h-4 w-4 mr-2 fill-current" />
              Stop
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={isRunningOnOther ? "outline" : "default"}
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Play className="h-4 w-4 mr-2 fill-current" />
        )}
        {isRunningOnOther ? "Switch Timer" : "Start Timer"}
      </Button>

      {isRunningOnOther && (
        <p className="text-xs text-muted-foreground">
          Timer running on another item
        </p>
      )}
    </div>
  );
}
