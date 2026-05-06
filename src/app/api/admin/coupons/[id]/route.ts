import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

// PATCH /api/admin/coupons/[id] — Toggle active / update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const allowed = ["isActive", "value", "minOrderValue", "maxUses", "expiresAt", "description"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const coupon = await Coupon.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();

    if (!coupon) {
      return Response.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: coupon });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/admin/coupons/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const coupon = await Coupon.findByIdAndDelete(id).lean();

    if (!coupon) {
      return Response.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
