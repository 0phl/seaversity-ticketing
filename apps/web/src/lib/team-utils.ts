import { prisma } from "@seaversity/database";

/**
 * Team utility functions for auto-assignment logic
 * 
 * These functions find teams by name pattern to support
 * role-based ticket/task routing.
 */

// Cache team IDs to avoid repeated database lookups
let cachedITTeamId: string | null | undefined = undefined;
let cachedLMSTeamId: string | null | undefined = undefined;

/**
 * Find the IT Support Team ID
 * Used when USER creates a ticket - routes to IT for support
 */
export async function getITTeamId(): Promise<string | null> {
    if (cachedITTeamId !== undefined) {
        return cachedITTeamId;
    }

    const team = await prisma.team.findFirst({
        where: {
            OR: [
                { name: { contains: "IT Support", mode: "insensitive" } },
                { name: { contains: "IT Team", mode: "insensitive" } },
                { name: { equals: "IT", mode: "insensitive" } },
            ],
        },
        select: { id: true },
    });

    cachedITTeamId = team?.id ?? null;
    return cachedITTeamId;
}

/**
 * Find the LMS Team ID
 * Used when AGENT creates a ticket - routes to LMS team
 */
export async function getLMSTeamId(): Promise<string | null> {
    if (cachedLMSTeamId !== undefined) {
        return cachedLMSTeamId;
    }

    const team = await prisma.team.findFirst({
        where: {
            OR: [
                { name: { contains: "LMS", mode: "insensitive" } },
                { name: { contains: "Learning Management", mode: "insensitive" } },
            ],
        },
        select: { id: true },
    });

    cachedLMSTeamId = team?.id ?? null;
    return cachedLMSTeamId;
}

/**
 * Clear cached team IDs (useful for testing or after team updates)
 */
export function clearTeamCache(): void {
    cachedITTeamId = undefined;
    cachedLMSTeamId = undefined;
}

/**
 * Determine the target team for a new ticket based on creator's role
 * 
 * Rules:
 * - USER creates ticket → assign to IT Support Team
 * - AGENT creates ticket → assign to LMS Team
 * - MANAGER/ADMIN creates ticket → leave unassigned (null)
 */
export async function getAutoAssignTeamForTicket(
    creatorRole: string
): Promise<string | null> {
    switch (creatorRole) {
        case "USER":
            // LMS users report issues to IT
            return await getITTeamId();
        case "AGENT":
            // IT agents create tickets for LMS team to handle
            return await getLMSTeamId();
        case "MANAGER":
        case "ADMIN":
            // Managers/Admins manually assign tickets
            return null;
        default:
            return null;
    }
}
