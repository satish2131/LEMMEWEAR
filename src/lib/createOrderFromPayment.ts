/**
 * Shared logic: create a LemmeWear order after Razorpay payment is confirmed.
 * Used by both /api/payment/verify (frontend callback) and /api/payment/webhook (server-side).
 */
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { sendMail, ADMIN_EMAIL } from "@/lib/mailer";
import { customerOrderEmail, adminOrderEmail } from "@/lib/emailTemplates";

interface OrderPayload {
  items: Record<string, unknown>[];
  subtotal: number;
  discount?: number;
  couponCode?: string;
  packagingType?: string;
  packagingCost?: number;
  shippingCost?: number;
  total: number;
  giftMessage?: string;
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  payment?: { method?: string };
}

export async function createOrderFromPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  payload: OrderPayload
): Promise<{ orderNumber: string }> {
  await dbConnect();

  // Idempotency: if order already exists for this Razorpay order, return it
  const existing = await Order.findOne({
    "payment.razorpayOrderId": razorpayOrderId,
  }).lean();
  if (existing) {
    return { orderNumber: (existing as any).orderNumber };
  }

  const { items, subtotal, discount, couponCode, packagingType, packagingCost,
          shippingCost, total, giftMessage, shipping, payment } = payload;

  const sanitizedItems = (items || []).map((item, idx) => ({
    productId: String(item.productId ?? item.id ?? `item-${idx}`),
    name:      String(item.name  ?? "Custom Item"),
    slug:      String(item.slug  ?? `custom-item-${idx}`),
    image:     String(item.image ?? "/assets/hero-tshirt.jpg"),
    color:     String(item.color ?? "Custom"),
    size:      String(item.size  ?? "M"),
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
      method:            (payment?.method ?? "upi") as "upi" | "card" | "netbanking" | "cod",
      status:            "paid" as const,
      razorpayOrderId,
      razorpayPaymentId,
    },
    status: "confirmed",
    estimatedDelivery,
  });

  // Auto-save shipping address
  if (shipping?.email) {
    try {
      const user = await User.findOne({ email: shipping.email.toLowerCase() });
      if (user) {
        const exists = user.addresses.some(
          (a) => a.address === shipping.address && a.city === shipping.city && a.pincode === shipping.pincode
        );
        if (!exists) {
          user.addresses.push({
            label: "Home", fullName: shipping.fullName, phone: shipping.phone,
            address: shipping.address, city: shipping.city, state: shipping.state,
            pincode: shipping.pincode, isDefault: user.addresses.length === 0,
          });
          await user.save();
        }
      }
    } catch (err) {
      console.error("[Order] Failed to auto-save address:", err);
    }
  }

  // Send emails
  const customerMail = customerOrderEmail(order);
  const adminMail    = adminOrderEmail(order);
  await Promise.allSettled([
    shipping?.email
      ? sendMail({ to: shipping.email,
          subject: `Your LemmeWear order has been confirmed - ${orderNumber}`,
          html: customerMail.html, text: customerMail.text,
        }).catch((e) => console.error("[Email] Customer:", e?.message))
      : Promise.resolve(),
    ADMIN_EMAIL
      ? sendMail({ to: ADMIN_EMAIL,
          subject: `New order received - ${orderNumber} from ${shipping?.fullName}`,
          html: adminMail.html, text: adminMail.text,
        }).catch((e) => console.error("[Email] Admin:", e?.message))
      : Promise.resolve(),
  ]);

  return { orderNumber };
}
