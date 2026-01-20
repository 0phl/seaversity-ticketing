"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ticket,
  CheckCircle,
  Clock,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    ticketsOpen: number;
    ticketsInProgress: number;
    tasksOpen: number;
    tasksInProgress: number;
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

interface StatsCardsProps {
  stats: ManagerStats | undefined;
  isLoading: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = "default",
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  isLoading?: boolean;
}) {
  const variantColors = {
    default: "text-primary",
    success: "text-green-600",
    warning: "text-amber-500",
    danger: "text-red-500",
    info: "text-blue-500",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-7 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", variantColors[variant])} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", variantColors[variant])}>
          {value}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend && trendLabel && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-500",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trendLabel}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const slaVariant: "success" | "warning" | "danger" =
    (stats?.slaCompliance || 0) >= 90
      ? "success"
      : (stats?.slaCompliance || 0) >= 75
        ? "warning"
        : "danger";

  // Use combined stats for main cards
  const combinedOpen = stats?.combinedStats?.totalOpen || 0;
  const combinedInProgress = stats?.combinedStats?.totalInProgress || 0;
  const combinedOpenToday = stats?.combinedStats?.openToday || 0;
  const combinedResolvedToday = stats?.combinedStats?.resolvedToday || 0;

  // Task-specific stats
  const totalTasks =
    (stats?.taskStats?.totalOpen || 0) +
    (stats?.taskStats?.totalInProgress || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Open Work Items"
        value={combinedOpen}
        subtitle="Tickets + Tasks"
        icon={Ticket}
        variant="default"
        isLoading={isLoading}
      />
      <StatCard
        title="In Progress"
        value={combinedInProgress}
        subtitle="Being worked on"
        icon={Clock}
        variant="warning"
        isLoading={isLoading}
      />
      <StatCard
        title="Resolved Today"
        value={combinedResolvedToday}
        subtitle={`${combinedOpenToday} new today`}
        icon={CheckCircle}
        variant="success"
        trend={combinedResolvedToday >= combinedOpenToday ? "up" : "down"}
        trendLabel={
          combinedResolvedToday >= combinedOpenToday
            ? "Positive flow"
            : "Backlog growing"
        }
        isLoading={isLoading}
      />
      <StatCard
        title="Total Tasks"
        value={totalTasks}
        subtitle={`${stats?.taskStats?.totalOpen || 0} open, ${stats?.taskStats?.totalInProgress || 0} in progress`}
        icon={ClipboardList}
        variant="info"
        isLoading={isLoading}
      />
      <StatCard
        title="SLA Compliance"
        value={`${stats?.slaCompliance || 0}%`}
        subtitle="Within target"
        icon={ShieldCheck}
        variant={slaVariant}
        isLoading={isLoading}
      />
    </div>
  );
}
