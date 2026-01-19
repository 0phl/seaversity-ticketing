import { PrismaClient, Role, Priority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default SLA policies
  const slaPolicies = await Promise.all([
    prisma.slaPolicy.upsert({
      where: { name_priority: { name: "Critical Response", priority: "CRITICAL" } },
      update: {},
      create: {
        name: "Critical Response",
        priority: "CRITICAL",
        responseTime: 15, // 15 minutes
        resolutionTime: 240, // 4 hours
        isActive: true,
      },
    }),
    prisma.slaPolicy.upsert({
      where: { name_priority: { name: "High Priority", priority: "HIGH" } },
      update: {},
      create: {
        name: "High Priority",
        priority: "HIGH",
        responseTime: 60, // 1 hour
        resolutionTime: 480, // 8 hours
        isActive: true,
      },
    }),
    prisma.slaPolicy.upsert({
      where: { name_priority: { name: "Medium Priority", priority: "MEDIUM" } },
      update: {},
      create: {
        name: "Medium Priority",
        priority: "MEDIUM",
        responseTime: 240, // 4 hours
        resolutionTime: 1440, // 24 hours
        isActive: true,
      },
    }),
    prisma.slaPolicy.upsert({
      where: { name_priority: { name: "Low Priority", priority: "LOW" } },
      update: {},
      create: {
        name: "Low Priority",
        priority: "LOW",
        responseTime: 480, // 8 hours
        resolutionTime: 2880, // 48 hours
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${slaPolicies.length} SLA policies`);

  // Create default categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name_teamId: { name: "General Inquiry", teamId: null } },
      update: {},
      create: {
        name: "General Inquiry",
        description: "General questions and information requests",
        color: "#6366F1",
        icon: "help-circle",
      },
    }),
    prisma.category.upsert({
      where: { name_teamId: { name: "Technical Support", teamId: null } },
      update: {},
      create: {
        name: "Technical Support",
        description: "Technical issues and troubleshooting",
        color: "#EF4444",
        icon: "wrench",
      },
    }),
    prisma.category.upsert({
      where: { name_teamId: { name: "Account Issues", teamId: null } },
      update: {},
      create: {
        name: "Account Issues",
        description: "Account access and management",
        color: "#F59E0B",
        icon: "user",
      },
    }),
    prisma.category.upsert({
      where: { name_teamId: { name: "Feature Request", teamId: null } },
      update: {},
      create: {
        name: "Feature Request",
        description: "New feature suggestions and improvements",
        color: "#10B981",
        icon: "lightbulb",
      },
    }),
    prisma.category.upsert({
      where: { name_teamId: { name: "Bug Report", teamId: null } },
      update: {},
      create: {
        name: "Bug Report",
        description: "Software bugs and issues",
        color: "#EF4444",
        icon: "bug",
      },
    }),
  ]);
  console.log(`✅ Created ${categories.length} categories`);

  console.log("🎉 Seeding completed!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
