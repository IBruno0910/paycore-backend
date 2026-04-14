import { createTransferSchema } from "./transfers.schema.js";
import { createTransfer, getCompanyTransfers } from "./transfers.service.js";

export const createTransferHandler = async (req, res, next) => {
  try {
    const validatedData = createTransferSchema.parse(req.body);

    const transfer = await createTransfer({
      ...validatedData,
      companyId: req.user.companyId,
      createdByUserId: req.user.sub,
    });

    return res.status(201).json({
      success: true,
      message: "Transfer completed successfully",
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyTransfersHandler = async (req, res, next) => {
  try {
    const transfers = await getCompanyTransfers(req.user.companyId);

    return res.status(200).json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    next(error);
  }
};