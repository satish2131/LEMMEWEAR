import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

// GET /api/search?q=crew&limit=10
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const q = request.nextUrl.searchParams.get("q");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);

    if (!q || q.trim().length < 2) {
      return Response.json(
        { success: false, error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    let products: any[] = [];
    try {
      products = await Product.find(
        { $text: { $search: q }, inStock: true },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
    } catch (e) {
      // Text index might not be ready or another error
    }

    if (!products || products.length === 0) {
      // Fallback: regex search on name, description, subtitle, category, styles, features
      const regex = new RegExp(q, "i");
      products = await Product.find({
        inStock: true,
        $or: [
          { name: regex },
          { description: regex },
          { subtitle: regex },
          { category: regex },
          { styles: regex },
          { features: regex },
        ],
      })
        .limit(limit)
        .lean();
    }

    return Response.json({
      success: true,
      data: products,
      query: q,
      count: products.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
