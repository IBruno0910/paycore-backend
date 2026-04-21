import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const companyId = "4f0c39df-c046-4d78-b995-492b53bb2324";
  const email = "ignacio@example.com";

  const existingCompany = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!existingCompany) {
    await prisma.company.create({
      data: {
        id: companyId,
        name: "PayCore Demo Company",
        taxId: "30500111222",
        status: "ACTIVE",
      },
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash("Password123", 10);

    await prisma.user.create({
      data: {
        firstName: "Ignacio",
        lastName: "Bruno",
        email,
        passwordHash,
        role: "COMPANY_ADMIN",
        status: "ACTIVE",
        companyId,
      },
    });
  }

  let mainAccount = await prisma.account.findFirst({
    where: {
      companyId,
      alias: "main-ars",
    },
  });

  if (!mainAccount) {
    mainAccount = await prisma.account.create({
      data: {
        companyId,
        alias: "main-ars",
        currency: "ARS",
        availableBalance: 10000,
        heldBalance: 0,
        status: "ACTIVE",
      },
    });
  } else {
    mainAccount = await prisma.account.update({
      where: { id: mainAccount.id },
      data: {
        availableBalance: 10000,
      },
    });
  }

  let secondaryAccount = await prisma.account.findFirst({
    where: {
      companyId,
      alias: "secondary-ars",
    },
  });

  if (!secondaryAccount) {
    secondaryAccount = await prisma.account.create({
      data: {
        companyId,
        alias: "secondary-ars",
        currency: "ARS",
        availableBalance: 0,
        heldBalance: 0,
        status: "ACTIVE",
      },
    });
  }

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });