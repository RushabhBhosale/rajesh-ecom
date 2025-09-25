import crypto from "node:crypto";

import Razorpay from "razorpay";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

let cachedClient: Razorpay | null = null;

export function getRazorpayClient() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  if (!cachedClient) {
    cachedClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }

  return cachedClient;
}

export function getRazorpayKeyId() {
  if (!RAZORPAY_KEY_ID) {
    throw new Error("RAZORPAY_KEY_ID is not set");
  }
  return RAZORPAY_KEY_ID;
}

export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  if (!RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET is not set");
  }
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET).update(payload).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(razorpaySignature);
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
