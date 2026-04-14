import { prisma } from "../../config/db.js";
import { AppError } from "../../shared/errors/AppError.js";

export const createAccount = async ({ alias, currency, companyId }) => {
  const existingAccount = await prisma.account.findFirst({
    where: {
      companyId,
      alias,
    },
  });

  if (existingAccount) {
    throw new AppError("An account with this alias already exists for this company", 409);
  }

  const account = await prisma.account.create({
    data: {
      alias,
      currency,
      companyId,
    },
  });

  return account;
};

export const getCompanyAccounts = async (companyId) => {
  const accounts = await prisma.account.findMany({
    where: { companyId },
    orderBy: {
      createdAt: "desc",
    },
  });

  return accounts;
};

export const getAccountById = async ({ accountId, companyId }) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      companyId,
    },
  });

  if (!account) {
    throw new AppError("Account not found", 404);
  }

  return account;
};