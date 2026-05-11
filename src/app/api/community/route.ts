import { type NextRequest } from "next/server";
import { type SortOrder } from "mongoose";
import dbConnect from "@/lib/db";
import SavedDesign from "@/models/SavedDesign";

// GET /api/community?sort=trending|new|top&search=&page=1&limit=12
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = request.nextUrl;
    const sort   = searchParams.get("sort")   || "trending";
    const search = searchParams.get("search") || "";
    const page   = parseInt(searchParams.get("page")  || "1", 10);
    const limit  = parseInt(searchParams.get("limit") || "12", 10);

    const filter: Record<string, unknown> = { isPublic: true };
    if (search) {
      filter.$or = [
        { name:     { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    const sortMap: Record<string, Record<string, SortOrder>> = {
      trending: { likes: -1, createdAt: -1 },
      new:      { createdAt: -1 },
      top:      { likes: -1 },
    };

    const skip = (page - 1) * limit;
    const [designs, total] = await Promise.all([
      SavedDesign.find(filter)
        .sort(sortMap[sort] || sortMap.trending)
        .skip(skip)
        .limit(limit)
        .select("-config -likedBy") // don't send heavy config or likedBy array
        .lean(),
      SavedDesign.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      data: designs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
