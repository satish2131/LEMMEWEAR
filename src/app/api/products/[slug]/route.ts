import dbConnect from "@/lib/db";
import Product from "@/models/Product";

// GET /api/products/[slug]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const product = await Product.findOne({ slug }).lean();

    if (!product) {
      return Response.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch related products (same category, different product)
    const related = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      inStock: true,
    })
      .limit(4)
      .lean();

    return Response.json({
      success: true,
      data: product,
      related,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
