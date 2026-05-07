import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { sendMail, ADMIN_EMAIL } from "@/lib/mailer";
import { customerOrderEmail, adminOrderEmail } from "@/lib/emailTemplates";

// GET /api/orders?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return Response.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const orders = await Order.find({ "shipping.email": email })
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ success: true, data: orders });
  } catch (error: unknown) {
    console.error("[GET /api/orders] Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/orders — Create a new order
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    const {
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
      payment,
    } = body;

    // Validate required fields
    if (!items?.length || !shipping || !payment?.method || !total) {
      return Response.json(
        { success: false, error: "Missing required order fields" },
        { status: 400 }
      );
    }

    // Sanitize items — ensure all fields are present (custom/gift items may lack some)
    const sanitizedItems = items.map((item: Record<string, unknown>, idx: number) => ({
      productId: item.productId || item.id?.toString() || `item-${idx}`,
      name: item.name || "Custom Item",
      slug: item.slug || `custom-item-${idx}`,
      image: item.image || "/assets/hero-tshirt.jpg",
      color: item.color || "Custom",
      size: item.size || "M",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || Number(item.qty) || 1,
    }));

    // Generate order number
    const orderNumber = `LW-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // Set estimated delivery (5-7 business days)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const order = await Order.create({
      orderNumber,
      items: sanitizedItems,
      subtotal,
      discount: discount || 0,
      couponCode,
      packagingType: packagingType || "standard",
      packagingCost: packagingCost || 0,
      shippingCost: shippingCost || 0,
      total,
      giftMessage,
      shipping,
      payment: {
        method: payment.method,
        status: payment.method === "cod" ? "pending" : "paid",
      },
      status: "confirmed",
      estimatedDelivery,
    });

    // ── Send order confirmation emails ────────────────────────────────────
    // Run both in parallel; log failures but never let them break the response.
    const customerEmail = order.shipping?.email;
    console.log(`[Order] Sending emails for ${orderNumber} — customer: ${customerEmail}, admin: ${ADMIN_EMAIL}`);

    const customerMail = customerOrderEmail(order);
    const adminMail = adminOrderEmail(order);

    await Promise.allSettled([
      // 1. Customer confirmation
      customerEmail
        ? sendMail({
            to: customerEmail,
            subject: `Your LemmeWear order has been confirmed - ${orderNumber}`,
            html: customerMail.html,
            text: customerMail.text,
          }).catch((err) =>
            console.error(`[Email] Customer email FAILED (${customerEmail}):`, err?.message ?? err)
          )
        : Promise.resolve(),

      // 2. Admin notification
      ADMIN_EMAIL
        ? sendMail({
            to: ADMIN_EMAIL,
            subject: `New order received - ${orderNumber} from ${order.shipping.fullName}`,
            html: adminMail.html,
            text: adminMail.text,
          }).catch((err) =>
            console.error(`[Email] Admin email FAILED (${ADMIN_EMAIL}):`, err?.message ?? err)
          )
        : Promise.resolve(),
    ]);

    // ── Auto-save shipping address to user profile ────────────────────────
    // If user exists, save this address if it's not already saved
    if (shipping.email) {
      try {
        const user = await User.findOne({ email: shipping.email.toLowerCase() });
        if (user) {
          // Check if this exact address already exists
          const exists = user.addresses.some(
            (addr) =>
              addr.address === shipping.address &&
              addr.city === shipping.city &&
              addr.pincode === shipping.pincode
          );

          if (!exists) {
            // If user has no addresses, make this the default
            const isFirstAddress = user.addresses.length === 0;

            user.addresses.push({
              label: "Home",
              fullName: shipping.fullName,
              phone: shipping.phone,
              address: shipping.address,
              city: shipping.city,
              state: shipping.state,
              pincode: shipping.pincode,
              isDefault: isFirstAddress,
            });

            await user.save();
            console.log(`[Order] Auto-saved shipping address for ${shipping.email}`);
          }
        }
      } catch (err) {
        // Don't fail the order if address save fails
        console.error("[Order] Failed to auto-save address:", err);
      }
    }

    return Response.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[POST /api/orders] Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
