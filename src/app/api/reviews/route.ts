import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";
import Product from "@/models/Product";

// GET /api/reviews?slug=noctura-crew&page=1&limit=10
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const slug = request.nextUrl.searchParams.get("slug");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1", 10);
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10", 10);

    if (!slug) {
      return Response.json(
        { success: false, error: "Product slug is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ productSlug: slug })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productSlug: slug }),
    ]);

    // Calculate average rating
    const avgResult = await Review.aggregate([
      { $match: { productSlug: slug } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    const stats = avgResult[0] || { avgRating: 0, count: 0 };

    return Response.json({
      success: true,
      data: reviews,
      stats: {
        averageRating: Math.round(stats.avgRating * 10) / 10,
        totalReviews: stats.count,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/reviews — Create a new review
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { productSlug, userName, userEmail, rating, title, comment } = body;

    if (!productSlug || !userName || !userEmail || !rating || !title || !comment) {
      return Response.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return Response.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await Product.findOne({ slug: productSlug });
    if (!product) {
      return Response.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const review = await Review.create({
      productSlug,
      userName,
      userEmail,
      rating,
      title,
      comment,
    });

    // Update product review count and average rating
    const avgResult = await Review.aggregate([
      { $match: { productSlug } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (avgResult[0]) {
      await Product.updateOne(
        { slug: productSlug },
        {
          rating: Math.round(avgResult[0].avgRating * 10) / 10,
          reviews: avgResult[0].count,
        }
      );
    }

    return Response.json({ success: true, data: review }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
