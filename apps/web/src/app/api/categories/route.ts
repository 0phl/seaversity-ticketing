import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@seaversity/database";

/**
 * GET /api/categories - List all categories
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { teamId: null }, // Global categories
          { teamId: session.user.teamId }, // Team-specific categories
        ],
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        icon: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
