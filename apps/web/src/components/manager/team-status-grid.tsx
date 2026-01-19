"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, calculateElapsedSeconds } from "@/stores/timer-store";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  isOnline: boolean;
  activeTimer: {
    id: string;
    workItemId: string;
    workItemNumber: string;
    workItemTitle: string;
    workItemType: "TICKET" | "TASK";
    startedAt: string;
  } | null;
  todayHours: number;
}

interface Team {
  id: string;
  name: string;
  color: string | null;
  members: TeamMember[];
}

interface TeamStatusGridProps {
  teams: Team[];
  isLoading: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatHours(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h ${minutes}m`;
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (member.activeTimer) {
      // Calculate initial elapsed
      setElapsedSeconds(calculateElapsedSeconds(member.activeTimer.startedAt));

      // Update every second
      const interval = setInterval(() => {
        setElapsedSeconds(calculateElapsedSeconds(member.activeTimer!.startedAt));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [member.activeTimer]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        member.isOnline
          ? "bg-card border-primary/20"
          : "bg-muted/30 border-transparent"
      )}
    >
      {/* Avatar with status indicator */}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={member.avatar || undefined} alt={member.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            member.isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        />
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{member.name}</p>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              member.isOnline ? "border-green-500 text-green-600" : ""
            )}
          >
            {member.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Active timer */}
        {member.activeTimer && (
          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-primary font-medium">
              {member.activeTimer.workItemNumber}
            </span>
            <span className="font-mono text-primary">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>
        )}

        {/* Today's hours */}
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Today: {formatHours(member.todayHours)}</span>
        </div>
      </div>
    </div>
  );
}

export function TeamStatusGrid({ teams, isLoading }: TeamStatusGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No teams found. Create IT and LMS teams to see member status.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {teams.map((team) => (
        <div key={team.id}>
          {/* Team Header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: team.color || "#0099FF" }}
            />
            <h3 className="font-semibold text-sm">{team.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {team.members.filter((m) => m.isOnline).length}/
              {team.members.length} online
            </Badge>
          </div>

          {/* Members Grid */}
          {team.members.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {team.members.map((member) => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              No members in this team
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
