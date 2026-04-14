import { createAccountSchema } from "./accounts.schema.js";
import {
  createAccount,
  getAccountById,
  getCompanyAccounts,
} from "./accounts.service.js";

export const createAccountHandler = async (req, res, next) => {
  try {
    const validatedData = createAccountSchema.parse(req.body);

    const account = await createAccount({
      ...validatedData,
      companyId: req.user.companyId,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyAccountsHandler = async (req, res, next) => {
  try {
    const accounts = await getCompanyAccounts(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};

export const getAccountByIdHandler = async (req, res, next) => {
  try {
    const account = await getAccountById({
      accountId: req.params.accountId,
      companyId: req.user.companyId,
    });

    return res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};