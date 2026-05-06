import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";

// GET /api/admin/customers?page=1&limit=20&search=arjun
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -addresses -wishlist")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Enrich with order stats
    const emails = users.map((u) => u.email);
    const orderStats = await Order.aggregate([
      { $match: { "shipping.email": { $in: emails } } },
      {
        $group: {
          _id: "$shipping.email",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
    ]);

    const statsMap = new Map(
      orderStats.map((s: { _id: string; orderCount: number; totalSpent: number }) => [
        s._id,
        { orderCount: s.orderCount, totalSpent: s.totalSpent },
      ])
    );

    const enriched = users.map((u) => {
      const stats = statsMap.get(u.email) || { orderCount: 0, totalSpent: 0 };
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        city: u.city,
        rewardPoints: u.rewardPoints,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
        joinDate: u.createdAt,
      };
    });

    return Response.json({
      success: true,
      data: enriched,
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
