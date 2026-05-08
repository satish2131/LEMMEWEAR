import crypto from "crypto";
import dbConnect from "@/lib/db";
import PendingPayment from "@/models/PendingPayment";
import { createOrderFromPayment } from "@/lib/createOrderFromPayment";

/**
 * POST /api/payment/webhook
 *
 * Razorpay calls this server-side when a payment is captured/authorized.
 * This handles async UPI payments where the popup closes before confirmation.
 *
 * Setup in Razorpay Dashboard:
 *   Settings → Webhooks → Add webhook URL:
 *   https://your-domain.vercel.app/api/payment/webhook
 *   Events: payment.captured
 *   Secret: set RAZORPAY_WEBHOOK_SECRET in env
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    // ── 1. Verify webhook signature ───────────────────────────────────────
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not set");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSig !== signature) {
      console.error("[Webhook] Invalid signature");
      return new Response("Invalid signature", { status: 400 });
    }

    // ── 2. Parse event ────────────────────────────────────────────────────
    const event = JSON.parse(rawBody);
    console.log(`[Webhook] Event: ${event.event}`);

    if (event.event !== "payment.captured") {
      // Acknowledge but don't process other events
      return new Response("OK", { status: 200 });
    }

    const payment = event.payload?.payment?.entity;
    if (!payment) {
      return new Response("No payment entity", { status: 400 });
    }

    const razorpayOrderId   = payment.order_id;
    const razorpayPaymentId = payment.id;
    const paymentMethod     = payment.method; // "upi", "card", "netbanking"

    if (!razorpayOrderId || !razorpayPaymentId) {
      return new Response("Missing payment IDs", { status: 400 });
    }

    // ── 3. Retrieve pending payload ───────────────────────────────────────
    await dbConnect();
    const pending = await PendingPayment.findOne({ razorpayOrderId }).lean();

    if (!pending) {
      // Payload not found — order may have already been created via verify endpoint
      console.log(`[Webhook] No pending payload for ${razorpayOrderId} — may already be processed`);
      return new Response("OK", { status: 200 });
    }

    // ── 4. Create order ───────────────────────────────────────────────────
    const payload = {
      ...pending.payload,
      payment: { method: paymentMethod },
    } as Parameters<typeof createOrderFromPayment>[2];

    const { orderNumber } = await createOrderFromPayment(
      razorpayOrderId,
      razorpayPaymentId,
      payload
    );

    // Clean up pending record
    await PendingPayment.deleteOne({ razorpayOrderId });

    console.log(`[Webhook] Order created: ${orderNumber} for payment ${razorpayPaymentId}`);
    return new Response("OK", { status: 200 });

  } catch (error: unknown) {
    console.error("[Webhook] Error:", error);
    return new Response("Internal error", { status: 500 });
  }
}
