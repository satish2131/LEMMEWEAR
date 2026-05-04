import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

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
