import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

// GET /api/products?category=men&search=crew&sort=price_asc&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "createdAt_desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const style = searchParams.get("style");
    const badge = searchParams.get("badge");

    // Build filter
    const filter: Record<string, unknown> = { inStock: true };

    if (category) {
      filter.category = category;
    }

    if (style) {
      filter.styles = { $in: [style] };
    }

    if (badge) {
      filter.badge = badge;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating_desc: { rating: -1 },
      newest: { createdAt: -1 },
      name_asc: { name: 1 },
      createdAt_desc: { createdAt: -1 },
    };

    const sortObj = sortMap[sort] || sortMap.createdAt_desc;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
