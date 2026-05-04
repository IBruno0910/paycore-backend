import { createTransferSchema } from "./transfers.schema.js";
import { createTransfer, getCompanyTransfers, getTransferById } from "./transfers.service.js";

export const createTransferHandler = async (req, res, next) => {
  try {

    const validatedData = createTransferSchema.parse(req.body);

    const idempotencyKey = req.headers["idempotency-key"];

    const result = await createTransfer({
      ...validatedData,
      companyId: req.user.companyId,
      createdByUserId: req.user.sub,
      idempotencyKey,
    });

    return res.status(result.replayed ? 200 : 201).json({
      success: true,
      message: result.replayed
        ? "Transfer already processed"
        : "Transfer completed successfully",
      data: result.transfer,
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyTransfersHandler = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await getCompanyTransfers({
      companyId: req.user.companyId,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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