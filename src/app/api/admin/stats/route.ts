import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import SavedDesign from "@/models/SavedDesign";

// GET /api/admin/stats — Dashboard metrics
export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      prevOrders,
      totalCustomers,
      prevCustomers,
      totalDesigns,
      prevDesigns,
      revenueResult,
      prevRevenueResult,
      revenueByDay,
      categoryBreakdown,
    ] = await Promise.all([
      // All-time totals for the metric cards
      Order.countDocuments({ status: { $ne: "cancelled" } }),
      Order.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      SavedDesign.countDocuments({}),
      SavedDesign.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
      // All-time revenue
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      // Revenue by day for chart
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", revenue: 1, _id: 0 } },
      ]),
      // Category breakdown
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.slug",
            foreignField: "slug",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$product.category", "other"] },
            value: { $sum: 1 },
          },
        },
        { $project: { name: "$_id", value: 1, _id: 0 } },
      ]),
    ]);

    const revenue = revenueResult[0]?.total || 0;
    const prevRevenue = prevRevenueResult[0]?.total || 0;

    const pctChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const pct = ((curr - prev) / prev) * 100;
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    };

    // Fill in category colors
    const categoryColors: Record<string, string> = {
      men: "hsl(270, 70%, 55%)",
      women: "hsl(300, 65%, 55%)",
      unisex: "hsl(152, 60%, 42%)",
      accessories: "hsl(38, 92%, 50%)",
      other: "hsl(220, 10%, 60%)",
    };

    const categoryData = categoryBreakdown.map((c: { name: string; value: number }) => ({
      name: c.name.charAt(0).toUpperCase() + c.name.slice(1),
      value: c.value,
      fill: categoryColors[c.name.toLowerCase()] || categoryColors.other,
    }));

    return Response.json({
      success: true,
      data: {
        metrics: {
          revenue: { value: revenue, change: pctChange(revenue, prevRevenue) },
          orders: { value: totalOrders, change: pctChange(totalOrders, prevOrders) },
          customers: { value: totalCustomers, change: pctChange(totalCustomers, prevCustomers) },
          designs: { value: totalDesigns, change: pctChange(totalDesigns, prevDesigns) },
        },
        revenueByDay,
        categoryData,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
