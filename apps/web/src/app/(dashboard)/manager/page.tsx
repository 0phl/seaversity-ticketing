"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamStatusGrid } from "@/components/manager/team-status-grid";
import { StatsCards } from "@/components/manager/stats-cards";
import { TicketCharts } from "@/components/manager/ticket-charts";
import { ActivityFeed } from "@/components/manager/activity-feed";
import { Loader2, ShieldAlert } from "lucide-react";

// Types for the API responses
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

interface ManagerStats {
  ticketStats: {
    openToday: number;
    resolvedToday: number;
    totalOpen: number;
    totalInProgress: number;
  };
  taskStats: {
    openToday: number;
    resolvedToday: number;
    totalOpen: number;
    totalInProgress: number;
  };
  combinedStats: {
    totalOpen: number;
    totalInProgress: number;
    openToday: number;
    resolvedToday: number;
  };
  slaCompliance: number;
  teamWorkload: {
    teamId: string;
    teamName: string;
    teamColor: string;
    // Stacked bar data
    ticketsOpen: number;
    ticketsInProgress: number;
    tasksOpen: number;
    tasksInProgress: number;
    // Legacy combined fields
    open: number;
    inProgress: number;
    resolvedToday: number;
    total: number;
  }[];
  hourlyData: {
    hour: string;
    created: number;
    resolved: number;
  }[];
}

interface ActivityItem {
  id: string;
  type: "activity" | "comment" | "attachment";
  action: string;
  changes?: unknown;
  content?: string;
  isInternal?: boolean;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  workItem: {
    id: string;
    title: string;
    ticketNumber: string | null;
    taskNumber: string | null;
    type: "TICKET" | "TASK";
  } | null;
  createdAt: string;
}

// API fetchers
async function fetchTeamStatus(): Promise<Team[]> {
  const res = await fetch("/api/manager/team-status");
  if (!res.ok) throw new Error("Failed to fetch team status");
  return res.json();
}

async function fetchStats(): Promise<ManagerStats> {
  const res = await fetch("/api/manager/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

async function fetchActivityFeed(): Promise<ActivityItem[]> {
  const res = await fetch("/api/manager/activity-feed?limit=15");
  if (!res.ok) throw new Error("Failed to fetch activity feed");
  return res.json();
}

export default function ManagerDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Redirect if not authorized
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      if (!["MANAGER", "ADMIN"].includes(session?.user?.role || "")) {
        router.push("/dashboard");
      }
    } else if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, session, router]);

  // Fetch team status with auto-refresh every 60 seconds
  const {
    data: teams,
    isLoading: teamsLoading,
    error: teamsError,
  } = useQuery({
    queryKey: ["manager-team-status"],
    queryFn: fetchTeamStatus,
    refetchInterval: 60000, // 60 seconds
    enabled: sessionStatus === "authenticated" && ["MANAGER", "ADMIN"].includes(session?.user?.role || ""),
  });

  // Fetch stats with auto-refresh every 60 seconds
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["manager-stats"],
    queryFn: fetchStats,
    refetchInterval: 60000, // 60 seconds
    enabled: sessionStatus === "authenticated" && ["MANAGER", "ADMIN"].includes(session?.user?.role || ""),
  });

  // Fetch activity feed with auto-refresh every 60 seconds
  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useQuery({
    queryKey: ["manager-activity-feed"],
    queryFn: fetchActivityFeed,
    refetchInterval: 60000, // 60 seconds
    enabled: sessionStatus === "authenticated" && ["MANAGER", "ADMIN"].includes(session?.user?.role || ""),
  });

  // Loading state
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authorization
  if (
    sessionStatus === "authenticated" &&
    !["MANAGER", "ADMIN"].includes(session?.user?.role || "")
  ) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <div className="text-center">
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground mt-2">
                You don&apos;t have permission to access the Manager Dashboard.
                This page is only available to Managers and Administrators.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = teamsLoading || statsLoading || activitiesLoading;
  const hasError = teamsError || statsError || activitiesError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time overview of team activity and performance
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Auto-refreshing every 60s
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">
              Error loading dashboard data. Please refresh the page.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Global Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Status Grid - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamStatusGrid teams={teams || []} isLoading={teamsLoading} />
            </CardContent>
          </Card>

          {/* Charts Section */}
          <TicketCharts stats={stats} isLoading={statsLoading} />
        </div>

        {/* Activity Feed - Takes 1 column */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ActivityFeed
                activities={activities || []}
                isLoading={activitiesLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
