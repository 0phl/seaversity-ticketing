"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Users, CheckCircle, Loader2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  _count: {
    members: number;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  teamId: string | null;
  team: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface AssignmentControlsProps {
  ticketId: string;
  ticketNumber: string;
  currentAssigneeId: string | null;
  currentTeamId: string | null;
  currentUserRole: string;
  currentUserId: string;
  onAssignmentChange: () => void;
}

export function AssignmentControls({
  ticketId,
  ticketNumber,
  currentAssigneeId,
  currentTeamId,
  currentUserRole,
  currentUserId,
  onAssignmentChange,
}: AssignmentControlsProps) {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const isManagerOrAdmin = ["MANAGER", "ADMIN"].includes(currentUserRole);
  const isAgent = currentUserRole === "AGENT";
  const canClaim =
    (isAgent || isManagerOrAdmin) && !currentAssigneeId;

  // Fetch teams
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await fetch("/api/teams");
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setIsLoadingTeams(false);
      }
    }
    fetchTeams();
  }, []);

  // Fetch agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/users/agents");
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch (error) {
        console.error("Error fetching agents:", error);
      } finally {
        setIsLoadingAgents(false);
      }
    }
    fetchAgents();
  }, []);

  const handleTeamChange = async (teamId: string) => {
    if (!isManagerOrAdmin) return;

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: teamId === "unassigned" ? null : teamId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to assign team");
      }

      toast({
        title: "Team Updated",
        description:
          teamId === "unassigned"
            ? `Removed team assignment from ${ticketNumber}`
            : `Assigned ${ticketNumber} to team`,
        variant: "success",
      });
      onAssignmentChange();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update team",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    if (!isManagerOrAdmin) return;

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to assign user");
      }

      toast({
        title: "Assignee Updated",
        description:
          assigneeId === "unassigned"
            ? `Unassigned ${ticketNumber}`
            : `Assigned ${ticketNumber} to agent`,
        variant: "success",
      });
      onAssignmentChange();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update assignee",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClaimTicket = async () => {
    setIsClaiming(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimTicket: true }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to claim ticket");
      }

      toast({
        title: "Ticket Claimed",
        description: `You are now working on ${ticketNumber}`,
        variant: "success",
      });
      onAssignmentChange();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to claim ticket",
        variant: "destructive",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Assignment
        </CardTitle>
        <CardDescription>
          {isManagerOrAdmin
            ? "Assign this ticket to a team or agent"
            : "Ticket assignment details"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Claim Button - for AGENT when unassigned */}
        {canClaim && (
          <Button
            onClick={handleClaimTicket}
            disabled={isClaiming}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isClaiming ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Claim This Ticket
          </Button>
        )}

        {/* Manager/Admin Assignment Controls */}
        {isManagerOrAdmin && (
          <>
            {/* Team Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assign to Team
              </label>
              {isLoadingTeams ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <Select
                  value={currentTeamId || "unassigned"}
                  onValueChange={handleTeamChange}
                  disabled={isAssigning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <span className="text-muted-foreground">Unassigned</span>
                    </SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: team.color || "#6B7280",
                            }}
                          />
                          <span>{team.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({team._count.members} members)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* User Assignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Assign to User
              </label>
              {isLoadingAgents ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <Select
                  value={currentAssigneeId || "unassigned"}
                  onValueChange={handleAssigneeChange}
                  disabled={isAssigning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">
                      <span className="text-muted-foreground">Unassigned</span>
                    </SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={agent.avatar}
                            alt={agent.name}
                            fallback={agent.name}
                            size="xs"
                          />
                          <span>{agent.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({agent.role})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </>
        )}

        {/* Loading indicator */}
        {isAssigning && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Updating assignment...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
