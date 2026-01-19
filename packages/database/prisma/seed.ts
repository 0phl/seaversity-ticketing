import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding database...");

  // ==========================================================================
  // CREATE TEST USERS (4 Roles)
  // ==========================================================================

  // 1. ADMIN - System Administrator with full control
  const adminPassword = await hashPassword("admin123");
  const admin = await prisma.user.upsert({
    where: { email: "admin@seaversity.edu" },
    update: {},
    create: {
      email: "admin@seaversity.edu",
      name: "System Administrator",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Created ADMIN user: ${admin.email}`);

  // 2. MANAGER - Team lead who monitors WFH activity and team performance
  const managerPassword = await hashPassword("manager123");
  const manager = await prisma.user.upsert({
    where: { email: "manager@seaversity.edu" },
    update: {},
    create: {
      email: "manager@seaversity.edu",
      name: "IT Team Manager",
      password: managerPassword,
      role: "MANAGER",
      isActive: true,
    },
  });
  console.log(`✅ Created MANAGER user: ${manager.email}`);

  // 3. AGENT - IT Support who resolves tickets and tracks time
  const agentPassword = await hashPassword("agent123");
  const agent = await prisma.user.upsert({
    where: { email: "agent@seaversity.edu" },
    update: {},
    create: {
      email: "agent@seaversity.edu",
      name: "IT Support Agent",
      password: agentPassword,
      role: "AGENT",
      isActive: true,
    },
  });
  console.log(`✅ Created AGENT user: ${agent.email}`);

  // 4. USER - Standard employee (LMS Team) who submits tickets
  const userPassword = await hashPassword("user123");
  const user = await prisma.user.upsert({
    where: { email: "user@seaversity.edu" },
    update: {},
    create: {
      email: "user@seaversity.edu",
      name: "LMS Team Member",
      password: userPassword,
      role: "USER",
      isActive: true,
    },
  });
  console.log(`✅ Created USER user: ${user.email}`);

  // ==========================================================================
  // CREATE TEAMS
  // ==========================================================================

  // IT Support Team
  const itTeam = await prisma.team.upsert({
    where: { name: "IT Support Team" },
    update: {},
    create: {
      name: "IT Support Team",
      description: "Handles all IT support tickets and technical issues",
      color: "#0099FF", // Seaversity Blue
      managerId: manager.id,
    },
  });
  console.log(`✅ Created team: ${itTeam.name}`);

  // LMS Team
  const lmsTeam = await prisma.team.upsert({
    where: { name: "LMS Team" },
    update: {},
    create: {
      name: "LMS Team",
      description: "Learning Management System team",
      color: "#10B981", // Green
    },
  });
  console.log(`✅ Created team: ${lmsTeam.name}`);

  // Assign users to teams
  await prisma.user.update({
    where: { id: agent.id },
    data: { teamId: itTeam.id },
  });
  console.log(`✅ Assigned ${agent.name} to ${itTeam.name}`);

  await prisma.user.update({
    where: { id: user.id },
    data: { teamId: lmsTeam.id },
  });
  console.log(`✅ Assigned ${user.name} to ${lmsTeam.name}`);

  // Create default SLA policies
  const slaPolicyData = [
    { name: "Critical Response", priority: "CRITICAL" as const, responseTime: 15, resolutionTime: 240 },
    { name: "High Priority", priority: "HIGH" as const, responseTime: 60, resolutionTime: 480 },
    { name: "Medium Priority", priority: "MEDIUM" as const, responseTime: 240, resolutionTime: 1440 },
    { name: "Low Priority", priority: "LOW" as const, responseTime: 480, resolutionTime: 2880 },
  ];

  for (const policy of slaPolicyData) {
    await prisma.slaPolicy.upsert({
      where: { name_priority: { name: policy.name, priority: policy.priority } },
      update: {},
      create: {
        name: policy.name,
        priority: policy.priority,
        responseTime: policy.responseTime,
        resolutionTime: policy.resolutionTime,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${slaPolicyData.length} SLA policies`);

  // Create default categories (without team - global categories)
  const categoryData = [
    { name: "General Inquiry", description: "General questions and information requests", color: "#6366F1", icon: "help-circle" },
    { name: "Technical Support", description: "Technical issues and troubleshooting", color: "#EF4444", icon: "wrench" },
    { name: "Account Issues", description: "Account access and management", color: "#F59E0B", icon: "user" },
    { name: "Feature Request", description: "New feature suggestions and improvements", color: "#10B981", icon: "lightbulb" },
    { name: "Bug Report", description: "Software bugs and issues", color: "#EF4444", icon: "bug" },
  ];

  for (const cat of categoryData) {
    // Check if category exists first (since teamId is null, we need to handle this differently)
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, teamId: null },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          teamId: null,
        },
      });
    }
  }
  console.log(`✅ Created ${categoryData.length} categories`);

  console.log("");
  console.log("🎉 Seeding completed!");
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("📝 TEST CREDENTIALS");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("");
  console.log("  ADMIN (Full system control):");
  console.log("    Email:    admin@seaversity.edu");
  console.log("    Password: admin123");
  console.log("");
  console.log("  MANAGER (Team oversight & reports):");
  console.log("    Email:    manager@seaversity.edu");
  console.log("    Password: manager123");
  console.log("");
  console.log("  AGENT (Ticket handling & time tracking):");
  console.log("    Email:    agent@seaversity.edu");
  console.log("    Password: agent123");
  console.log("");
  console.log("  USER (Submit tickets & view own requests):");
  console.log("    Email:    user@seaversity.edu");
  console.log("    Password: user123");
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════");
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
