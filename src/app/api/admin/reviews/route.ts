import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Review from "@/models/Review";

// GET /api/admin/reviews?page=1&limit=20&search=arjun&status=pending
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // "verified" | "unverified"

    const filter: Record<string, unknown> = {};

    if (status === "verified") {
      filter.verified = true;
    } else if (status === "pending") {
      filter.verified = false;
    }

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { comment: { $regex: search, $options: "i" } },
        { productSlug: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      data: reviews,
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
