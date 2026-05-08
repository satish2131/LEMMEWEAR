import crypto from "crypto";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { sendMail, ADMIN_EMAIL } from "@/lib/mailer";
import { customerOrderEmail, adminOrderEmail } from "@/lib/emailTemplates";

// POST /api/payment/verify
// Verifies Razorpay signature, then creates the order in our DB
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Our order payload
      items,
      subtotal,
      discount,
      couponCode,
      packagingType,
      packagingCost,
      shippingCost,
      total,
      giftMessage,
      shipping,
      payment, // contains { method: "upi" | "card" | "netbanking" }
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

    // ── 2. Create order in DB ─────────────────────────────────────────────
    await dbConnect();

    const sanitizedItems = (items || []).map((item: Record<string, unknown>, idx: number) => ({
      productId: item.productId || item.id?.toString() || `item-${idx}`,
      name:      item.name     || "Custom Item",
      slug:      item.slug     || `custom-item-${idx}`,
      image:     item.image    || "/assets/hero-tshirt.jpg",
      color:     item.color    || "Custom",
      size:      item.size     || "M",
      price:     Number(item.price)    || 0,
      quantity:  Number(item.quantity) || Number(item.qty) || 1,
    }));

    const orderNumber = `LW-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const order = await Order.create({
      orderNumber,
      items: sanitizedItems,
      subtotal,
      discount:      discount      || 0,
      couponCode,
      packagingType: packagingType || "standard",
      packagingCost: packagingCost || 0,
      shippingCost:  shippingCost  || 0,
      total,
      giftMessage,
      shipping,
      payment: {
        method:            payment?.method || "upi", // use actual method selected by user
        status:            "paid",
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      status: "confirmed",
      estimatedDelivery,
    });

    // ── 3. Auto-save shipping address ─────────────────────────────────────
    if (shipping?.email) {
      try {
        const user = await User.findOne({ email: shipping.email.toLowerCase() });
        if (user) {
          const exists = user.addresses.some(
            (a) => a.address === shipping.address && a.city === shipping.city && a.pincode === shipping.pincode
          );
          if (!exists) {
            user.addresses.push({
              label:     "Home",
              fullName:  shipping.fullName,
              phone:     shipping.phone,
              address:   shipping.address,
              city:      shipping.city,
              state:     shipping.state,
              pincode:   shipping.pincode,
              isDefault: user.addresses.length === 0,
            });
            await user.save();
          }
        }
      } catch (err) {
        console.error("[Payment] Failed to auto-save address:", err);
      }
    }

    // ── 4. Send confirmation emails ───────────────────────────────────────
    const customerMail = customerOrderEmail(order);
    const adminMail    = adminOrderEmail(order);

    await Promise.allSettled([
      shipping?.email
        ? sendMail({
            to:      shipping.email,
            subject: `Your LemmeWear order has been confirmed - ${orderNumber}`,
            html:    customerMail.html,
            text:    customerMail.text,
          }).catch((e) => console.error("[Email] Customer:", e?.message))
        : Promise.resolve(),
      ADMIN_EMAIL
        ? sendMail({
            to:      ADMIN_EMAIL,
            subject: `New order received - ${orderNumber} from ${shipping?.fullName}`,
            html:    adminMail.html,
            text:    adminMail.text,
          }).catch((e) => console.error("[Email] Admin:", e?.message))
        : Promise.resolve(),
    ]);

    return Response.json(
      { success: true, data: { orderNumber } },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Payment] verify error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
