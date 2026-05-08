import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/payment/create-order
// Creates a Razorpay order and returns the order_id for the frontend checkout
export async function POST(request: Request) {
  try {
    const { amount, currency = "INR", receipt } = await request.json();

    if (!amount || amount <= 0) {
      return Response.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    return Response.json({
      success: true,
      data: {
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
      },
    });
  } catch (error: unknown) {
    console.error("[Razorpay] create-order error:", error);
    const message = error instanceof Error ? error.message : "Payment gateway error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
