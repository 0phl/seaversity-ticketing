import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Add seed data here
  // Example: Create default admin user
  // const admin = await prisma.user.upsert({
  //   where: { email: "admin@seaversity.edu" },
  //   update: {},
  //   create: {
  //     email: "admin@seaversity.edu",
  //     name: "System Admin",
  //     password: "hashed_password_here",
  //     role: "ADMIN",
  //   },
  // });

  console.log("Seeding completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
