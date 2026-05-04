import dbConnect from "@/lib/db";
import Order from "@/models/Order";

// GET /api/orders/[id] — Get single order by orderNumber
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const order = await Order.findOne({ orderNumber: id }).lean();

    if (!order) {
      return Response.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/orders/[id] — Update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const allowedUpdates = ["status", "trackingId", "payment.status"];
    const updates: Record<string, unknown> = {};

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const order = await Order.findOneAndUpdate(
      { orderNumber: id },
      { $set: updates },
      { new: true }
    ).lean();

    if (!order) {
      return Response.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
