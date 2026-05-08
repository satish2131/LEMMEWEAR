import Razorpay from "razorpay";
import dbConnect from "@/lib/db";
import PendingPayment from "@/models/PendingPayment";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/payment/create-order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "INR", receipt, payload } = body;

    if (!amount || amount <= 0) {
      return Response.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),
      currency,
      receipt:  receipt || `rcpt_${Date.now()}`,
    });

    // Store the cart/shipping payload so the webhook can create the DB order
    // even if the frontend popup closes before payment confirmation
    if (payload) {
      try {
        await dbConnect();
        await PendingPayment.findOneAndUpdate(
          { razorpayOrderId: order.id },
          { razorpayOrderId: order.id, payload },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("[create-order] Failed to save pending payload:", err);
        // Non-fatal — webhook will still work if payload was saved
      }
    }

    return Response.json({
      success: true,
      data: { orderId: order.id, amount: order.amount, currency: order.currency },
    });
  } catch (error: unknown) {
    console.error("[Razorpay] create-order error:", error);
    const message = error instanceof Error ? error.message : "Payment gateway error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
