import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@seaversity/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, CheckCircle, Users, ListTodo } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

interface DashboardStats {
  openCount: number;
  inProgressCount: number;
  completedTodayCount: number;
  teamMembersCount: number;
  breakdown: {
    openTickets: number;
    openTasks: number;
    inProgressTickets: number;
    inProgressTasks: number;
  };
}

async function getDashboardStats(userId: string, userTeamId: string | null, userRole: string): Promise<DashboardStats> {
  const isManagerOrAdmin = ["MANAGER", "ADMIN"].includes(userRole);

  // Calculate start of today (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build base filter for work items assigned to user
  const assignedToUserFilter = {
    OR: [
      { assigneeId: userId },
      { assignees: { some: { userId } } },
      ...(userTeamId ? [{ teamId: userTeamId, assignmentMode: "team" }] : []),
    ],
  };

  // For managers/admins, show all counts for their team
  const scopeFilter = isManagerOrAdmin && userTeamId
    ? { OR: [{ teamId: userTeamId }, ...assignedToUserFilter.OR] }
    : assignedToUserFilter;

  const [
    openCount,
    inProgressCount,
    completedTodayCount,
    teamMembersCount,
    openTickets,
    openTasks,
    inProgressTickets,
    inProgressTasks,
  ] = await Promise.all([
    prisma.workItem.count({
      where: { ...scopeFilter, status: "OPEN" },
    }),
    prisma.workItem.count({
      where: { ...scopeFilter, status: "IN_PROGRESS" },
    }),
    prisma.workItem.count({
      where: {
        ...scopeFilter,
        status: { in: ["RESOLVED", "CLOSED"] },
        completedAt: { gte: today },
      },
    }),
    userTeamId
      ? prisma.user.count({ where: { teamId: userTeamId, isActive: true } })
      : Promise.resolve(0),
    prisma.workItem.count({
      where: { ...scopeFilter, type: "TICKET", status: "OPEN" },
    }),
    prisma.workItem.count({
      where: { ...scopeFilter, type: "TASK", status: "OPEN" },
    }),
    prisma.workItem.count({
      where: { ...scopeFilter, type: "TICKET", status: "IN_PROGRESS" },
    }),
    prisma.workItem.count({
      where: { ...scopeFilter, type: "TASK", status: "IN_PROGRESS" },
    }),
  ]);

  return {
    openCount,
    inProgressCount,
    completedTodayCount,
    teamMembersCount,
    breakdown: {
      openTickets,
      openTasks,
      inProgressTickets,
      inProgressTasks,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const stats = await getDashboardStats(
    session.user.id,
    session.user.teamId || null,
    session.user.role
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session.user.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s an overview of your work today.
          </p>
        </div>
        <SignOutButton />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Items</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.breakdown.openTickets} tickets, {stats.breakdown.openTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.breakdown.inProgressTickets} tickets, {stats.breakdown.inProgressTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTodayCount}</div>
            <p className="text-xs text-muted-foreground">
              Work items finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembersCount}</div>
            <p className="text-xs text-muted-foreground">
              Active in your team
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Session</CardTitle>
          <CardDescription>
            Current authentication details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Email:</span> {session.user.email}
            </p>
            <p>
              <span className="font-medium">Role:</span> {session.user.role}
            </p>
            <p>
              <span className="font-medium">Team ID:</span>{" "}
              {session.user.teamId || "Not assigned"}
            </p>
            <p>
              <span className="font-medium">User ID:</span> {session.user.id}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
