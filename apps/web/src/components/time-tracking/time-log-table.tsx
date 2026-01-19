"use client";

import { Clock, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/stores/timer-store";

interface TimeLogUser {
  id: string;
  name: string;
  avatar?: string | null;
}

interface TimeLog {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMins: number | null;
  notes: string | null;
  isRunning: boolean;
  user: TimeLogUser;
}

interface TimeLogTableProps {
  timeLogs: TimeLog[];
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Calculate total time logged in minutes
 */
function calculateTotalTime(timeLogs: TimeLog[]): number {
  return timeLogs.reduce((total, log) => {
    if (log.durationMins) {
      return total + log.durationMins;
    }
    if (log.isRunning) {
      // Calculate running time
      const startedAt = new Date(log.startedAt).getTime();
      const now = Date.now();
      return total + Math.floor((now - startedAt) / 60000);
    }
    return total;
  }, 0);
}

/**
 * Table displaying time logs for a work item
 */
export function TimeLogTable({ timeLogs }: TimeLogTableProps) {
  if (timeLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No time logged yet</p>
      </div>
    );
  }

  const totalTime = calculateTotalTime(timeLogs);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <span className="text-sm text-muted-foreground">Total Time Logged</span>
        <span className="font-mono font-bold text-lg">
          {formatMinutes(totalTime)}
        </span>
      </div>

      {/* Time logs list */}
      <div className="space-y-2">
        {timeLogs.map((log) => (
          <div
            key={log.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              log.isRunning
                ? "bg-primary/5 border-primary/20"
                : "bg-card border-border"
            }`}
          >
            {/* User avatar */}
            <Avatar
              src={log.user.avatar}
              alt={log.user.name}
              fallback={log.user.name}
              size="sm"
            />

            {/* Log details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{log.user.name}</span>
                {log.isRunning && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    <span className="relative flex h-2 w-2 mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>{formatDate(log.startedAt)}</span>
                {log.endedAt && (
                  <>
                    <span>→</span>
                    <span>{formatDate(log.endedAt)}</span>
                  </>
                )}
              </div>
              {log.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {log.notes}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="text-right">
              <span className="font-mono font-medium">
                {log.isRunning ? (
                  <span className="text-primary">Running...</span>
                ) : log.durationMins !== null ? (
                  formatMinutes(log.durationMins)
                ) : (
                  "-"
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
