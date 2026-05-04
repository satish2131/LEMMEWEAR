import dbConnect from "@/lib/db";
import Product from "@/models/Product";

// GET /api/products/trending?limit=4
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "4", 10);

    // Get top-rated products with badges like Bestseller, Trending, Top Rated
    const trending = await Product.find({
      inStock: true,
      $or: [
        { badge: { $in: ["Bestseller", "Trending", "Top Rated"] } },
        { rating: { $gte: 4.7 } },
      ],
    })
      .sort({ rating: -1, reviews: -1 })
      .limit(limit)
      .lean();

    return Response.json({ success: true, data: trending });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
