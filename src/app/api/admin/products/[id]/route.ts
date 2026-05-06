import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

// PATCH /api/admin/products/[id] — Update a product
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "name", "category", "subtitle", "price", "oldPrice",
      "description", "features", "colors", "sizes", "badge",
      "image", "gallery", "styles", "inStock",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Normalize category to lowercase
    if (updates.category) {
      updates.category = (updates.category as string).toLowerCase();
    }

    const product = await Product.findOneAndUpdate(
      { $or: [{ productId: id }, { slug: id }] },
      { $set: updates },
      { new: true }
    ).lean();

    if (!product) {
      return Response.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: product });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — Delete a product
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await dbConnect();

    const { id } = await params;

    const product = await Product.findOneAndDelete({
      $or: [{ productId: id }, { slug: id }],
    }).lean();

    if (!product) {
      return Response.json(
        { success: false, error: "Product not found" },
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
