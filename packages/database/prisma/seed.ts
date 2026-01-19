import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Create default admin user
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
  console.log(`✅ Created admin user: ${admin.email}`);

  // Create test agent user
  const agentPassword = await hashPassword("agent123");
  const agent = await prisma.user.upsert({
    where: { email: "agent@seaversity.edu" },
    update: {},
    create: {
      email: "agent@seaversity.edu",
      name: "Test Agent",
      password: agentPassword,
      role: "AGENT",
      isActive: true,
    },
  });
  console.log(`✅ Created agent user: ${agent.email}`);

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

  console.log("🎉 Seeding completed!");
  console.log("");
  console.log("📝 Test credentials:");
  console.log("   Admin: admin@seaversity.edu / admin123");
  console.log("   Agent: agent@seaversity.edu / agent123");
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
