import crypto from "crypto";
import dbConnect from "@/lib/db";
import PendingPayment from "@/models/PendingPayment";
import { createOrderFromPayment } from "@/lib/createOrderFromPayment";

// POST /api/payment/verify
// Called by the Razorpay frontend handler after payment popup completes.
// Verifies signature then creates the DB order.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items, subtotal, discount, couponCode,
      packagingType, packagingCost, shippingCost,
      total, giftMessage, shipping,
      payment,
    } = body;

    // ── 1. Verify Razorpay signature ──────────────────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.json(
        { success: false, error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // ── 2. Create order (idempotent — webhook may have already done this) ─
    const { orderNumber } = await createOrderFromPayment(
      razorpay_order_id,
      razorpay_payment_id,
      { items, subtotal, discount, couponCode, packagingType, packagingCost,
        shippingCost, total, giftMessage, shipping, payment }
    );

    // Clean up pending record (webhook may have already done this)
    try {
      await dbConnect();
      await PendingPayment.deleteOne({ razorpayOrderId: razorpay_order_id });
    } catch { /* non-fatal */ }

    return Response.json({ success: true, data: { orderNumber } }, { status: 201 });

  } catch (error: unknown) {
    console.error("[Payment] verify error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
