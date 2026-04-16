import crypto from "crypto";

export const generateWebhookSignature = (payload, secret) => {
  const stringifiedPayload = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", secret)
    .update(stringifiedPayload)
    .digest("hex");

  return signature;
};