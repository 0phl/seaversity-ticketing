"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Ticket,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ManagerStats {
  ticketStats: {
    openToday: number;
    resolvedToday: number;
    totalOpen: number;
    totalInProgress: number;
  };
  slaCompliance: number;
  teamWorkload: {
    teamId: string;
    teamName: string;
    teamColor: string;
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
  variant?: "default" | "success" | "warning" | "danger";
  isLoading?: boolean;
}) {
  const variantColors = {
    default: "text-primary",
    success: "text-green-600",
    warning: "text-amber-500",
    danger: "text-red-500",
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

  // Calculate total workload across teams
  const totalWorkload = stats?.teamWorkload.reduce(
    (acc, team) => ({
      open: acc.open + team.open,
      inProgress: acc.inProgress + team.inProgress,
      resolvedToday: acc.resolvedToday + team.resolvedToday,
    }),
    { open: 0, inProgress: 0, resolvedToday: 0 }
  ) || { open: 0, inProgress: 0, resolvedToday: 0 };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Open Tickets"
        value={stats?.ticketStats.totalOpen || 0}
        subtitle="Total unresolved"
        icon={Ticket}
        variant="default"
        isLoading={isLoading}
      />
      <StatCard
        title="In Progress"
        value={stats?.ticketStats.totalInProgress || 0}
        subtitle="Being worked on"
        icon={Clock}
        variant="warning"
        isLoading={isLoading}
      />
      <StatCard
        title="Resolved Today"
        value={stats?.ticketStats.resolvedToday || 0}
        subtitle={`${stats?.ticketStats.openToday || 0} new today`}
        icon={CheckCircle}
        variant="success"
        trend={
          (stats?.ticketStats.resolvedToday || 0) >=
          (stats?.ticketStats.openToday || 0)
            ? "up"
            : "down"
        }
        trendLabel={
          (stats?.ticketStats.resolvedToday || 0) >=
          (stats?.ticketStats.openToday || 0)
            ? "Positive flow"
            : "Backlog growing"
        }
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
