import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";

// PATCH /api/admin/reviews/[id] — Approve or flag a review
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.verified !== undefined) {
      updates.verified = body.verified;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();

    if (!review) {
      return Response.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: review });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/admin/reviews/[id] — Delete a review
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await params;

    const review = await Review.findByIdAndDelete(id).lean();

    if (!review) {
      return Response.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
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
