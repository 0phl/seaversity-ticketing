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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Users,
  CheckCircle,
  Loader2,
  X,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";

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

interface Assignee {
  id: string;
  userId: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  };
}

interface AssignmentControlsProps {
  ticketId: string;
  ticketNumber: string;
  currentAssigneeId: string | null;
  currentTeamId: string | null;
  currentAssignmentMode: string | null;
  currentAssignees: Assignee[];
  currentUserRole: string;
  currentUserId: string;
  onAssignmentChange: () => void;
}

type AssignmentTab = "team" | "individuals";

export function AssignmentControls({
  ticketId,
  ticketNumber,
  currentAssigneeId,
  currentTeamId,
  currentAssignmentMode,
  currentAssignees,
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
  
  // Local state for selected values
  const [selectedTeamId, setSelectedTeamId] = useState<string>(currentTeamId || "");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    currentAssignees?.map((a) => a.userId) || []
  );
  
  // Tab state
  const [activeTab, setActiveTab] = useState<AssignmentTab>(
    currentAssignmentMode === "team" ? "team" : "individuals"
  );

  const isManagerOrAdmin = ["MANAGER", "ADMIN"].includes(currentUserRole);
  const isAgent = currentUserRole === "AGENT";
  
  // User can claim if they're not already assigned
  const isAlreadyAssigned = currentAssignees?.some((a) => a.userId === currentUserId);
  const canClaim = (isAgent || isManagerOrAdmin) && !isAlreadyAssigned;

  // Update local state when props change
  useEffect(() => {
    setSelectedTeamId(currentTeamId || "");
    setSelectedAssigneeIds(currentAssignees?.map((a) => a.userId) || []);
    setActiveTab(currentAssignmentMode === "team" ? "team" : "individuals");
  }, [currentTeamId, currentAssignees, currentAssignmentMode]);

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

  // Convert agents to MultiSelect options
  const agentOptions: MultiSelectOption[] = agents.map((agent) => ({
    value: agent.id,
    label: agent.name,
    avatar: agent.avatar,
    description: agent.role,
  }));

  const handleTeamChange = async (teamId: string) => {
    if (!isManagerOrAdmin) return;

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentMode: "team",
          teamId: teamId === "unassigned" ? null : teamId,
        }),
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

  const handleAssigneesChange = async (newAssigneeIds: string[]) => {
    if (!isManagerOrAdmin) return;

    setSelectedAssigneeIds(newAssigneeIds);
    setIsAssigning(true);

    try {
      const res = await fetch(`/api/tickets/${ticketId}/assignment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentMode: "individuals",
          assigneeIds: newAssigneeIds,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update assignees");
      }

      toast({
        title: "Assignees Updated",
        description: `Updated assignees for ${ticketNumber}`,
        variant: "success",
      });
      onAssignmentChange();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update assignees",
        variant: "destructive",
      });
      // Revert on error
      setSelectedAssigneeIds(currentAssignees?.map((a) => a.userId) || []);
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
        description: `You have joined ${ticketNumber}`,
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

  const handleTabChange = (tab: AssignmentTab) => {
    setActiveTab(tab);
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
            ? "Assign this ticket to a team or individuals"
            : "Ticket assignment details"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Claim Button - for AGENT/MANAGER when not already assigned */}
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
            {currentAssignees?.length > 0 ? "Join This Ticket" : "Claim This Ticket"}
          </Button>
        )}

        {/* Current Assignees Display */}
        {currentAssignees && currentAssignees.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Current Assignees ({currentAssignees.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {currentAssignees.map((assignee) => (
                <div
                  key={assignee.id}
                  className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1"
                >
                  <Avatar
                    src={assignee.user.avatar}
                    alt={assignee.user.name}
                    fallback={assignee.user.name}
                    size="xs"
                  />
                  <span className="text-sm font-medium text-primary">
                    {assignee.user.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Team Display */}
        {currentTeamId && currentAssignmentMode === "team" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Assigned Team
            </label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {teams.find((t) => t.id === currentTeamId)?.name || "Unknown Team"}
              </span>
            </div>
          </div>
        )}

        {/* Manager/Admin Assignment Controls */}
        {isManagerOrAdmin && (
          <>
            {/* Tab Selector */}
            <div className="flex rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => handleTabChange("team")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "team"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="h-4 w-4" />
                Assign to Team
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("individuals")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "individuals"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <UserPlus className="h-4 w-4" />
                Assign to Individuals
              </button>
            </div>

            {/* Team Assignment Tab */}
            {activeTab === "team" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Assigning to a team will remove all individual assignees.
                </p>
                {isLoadingTeams ? (
                  <div className="h-10 bg-muted animate-pulse rounded-md" />
                ) : (
                  <Select
                    value={selectedTeamId || "unassigned"}
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
            )}

            {/* Individuals Assignment Tab */}
            {activeTab === "individuals" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Select multiple users to assign. This will clear any team assignment.
                </p>
                <MultiSelect
                  options={agentOptions}
                  selected={selectedAssigneeIds}
                  onChange={handleAssigneesChange}
                  placeholder="Select assignees..."
                  emptyText="No agents found."
                  disabled={isAssigning}
                  isLoading={isLoadingAgents}
                />
              </div>
            )}
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
