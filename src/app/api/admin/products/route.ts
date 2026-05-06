import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

// GET /api/admin/products?page=1&limit=20&search=crew&category=men
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/admin/products — Create a new product
export async function POST(request: Request) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await request.json();
    const {
      name,
      category,
      subtitle,
      price,
      oldPrice,
      description,
      features,
      colors,
      sizes,
      badge,
      image,
      gallery,
      styles,
      inStock,
    } = body;

    if (!name || !category || !price || !description || !image) {
      return Response.json(
        { success: false, error: "name, category, price, description, and image are required" },
        { status: 400 }
      );
    }

    // Generate productId and slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    const productId = `LW-${Date.now().toString(36).toUpperCase()}`;

    // Check slug uniqueness
    const existing = await Product.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const product = await Product.create({
      productId,
      slug: finalSlug,
      name,
      category: category.toLowerCase(),
      subtitle: subtitle || name,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      description,
      features: features || [],
      colors: colors || [],
      sizes: sizes || [],
      badge,
      image,
      gallery: gallery || [image],
      styles: styles || [],
      inStock: inStock !== undefined ? inStock : true,
    });

    return Response.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
