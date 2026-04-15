import { createTransferSchema } from "./transfers.schema.js";
import { createTransfer, getCompanyTransfers, getTransferById } from "./transfers.service.js";

export const createTransferHandler = async (req, res, next) => {
  try {

    console.log("HEADERS:", req.headers);
    console.log("IDEMPOTENCY HEADER:", req.headers["idempotency-key"]);

    const validatedData = createTransferSchema.parse(req.body);

    const idempotencyKey = req.headers["idempotency-key"];

    const transfer = await createTransfer({
      ...validatedData,
      companyId: req.user.companyId,
      createdByUserId: req.user.sub,
      idempotencyKey,
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

export const getTransferByIdHandler = async (req, res, next) => {
  try {
    const transfer = await getTransferById({
      transferId: req.params.transferId,
      companyId: req.user.companyId,
    });

    return res.status(200).json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    next(error);
  }
};