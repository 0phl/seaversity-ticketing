"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

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

interface TicketChartsProps {
  stats: ManagerStats | undefined;
  isLoading: boolean;
}

// Seaversity color palette
const COLORS = {
  primary: "#0099FF",
  accent: "#0080DD",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  muted: "#6B7280",
};

const TEAM_COLORS = ["#0099FF", "#0080DD", "#10B981", "#F59E0B", "#8B5CF6"];

export function TicketCharts({ stats, isLoading }: TicketChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Flow Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for pie chart (Open vs Resolved today)
  const ticketFlowData = [
    {
      name: "Open Today",
      value: stats?.ticketStats.openToday || 0,
      color: COLORS.warning,
    },
    {
      name: "Resolved Today",
      value: stats?.ticketStats.resolvedToday || 0,
      color: COLORS.success,
    },
  ];

  // Prepare team workload data for bar chart
  const workloadData =
    stats?.teamWorkload.map((team) => ({
      name: team.teamName,
      open: team.open,
      inProgress: team.inProgress,
      resolved: team.resolvedToday,
    })) || [];

  // Filter hourly data to show only hours with activity or recent hours
  const hourlyData = stats?.hourlyData || [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Today's Ticket Flow - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Open vs Resolved Today</CardTitle>
        </CardHeader>
        <CardContent>
          {ticketFlowData[0].value === 0 && ticketFlowData[1].value === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No ticket activity today yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ticketFlowData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {ticketFlowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Team Workload Distribution - Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Workload Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {workloadData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No team data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="open" name="Open" fill={COLORS.warning} stackId="a" />
                <Bar
                  dataKey="inProgress"
                  name="In Progress"
                  fill={COLORS.primary}
                  stackId="a"
                />
                <Bar
                  dataKey="resolved"
                  name="Resolved Today"
                  fill={COLORS.success}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Hourly Activity - Line Chart (Full Width) */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Hourly Ticket Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {hourlyData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No hourly data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="hour"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke={COLORS.warning}
                  strokeWidth={2}
                  dot={{ fill: COLORS.warning }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ fill: COLORS.success }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
