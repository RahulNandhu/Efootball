import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      role: "ADMIN",
      isDefaultAdmin: true,
    },
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
      teamName: "Admin",
      photoUrl: "/default-avatar.svg",
      isDefaultAdmin: true,
    },
  });

  console.log("Default admin ensured (username: admin / password: Admin123)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
