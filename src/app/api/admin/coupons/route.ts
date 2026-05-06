import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

// GET /api/admin/coupons
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};
    if (search) {
      filter.code = { $regex: search, $options: "i" };
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 }).lean();

    return Response.json({ success: true, data: coupons });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/admin/coupons — Create a coupon
export async function POST(request: Request) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await request.json();
    const { code, type, value, minOrderValue, maxUses, expiresAt, description } = body;

    if (!code || !type || !value) {
      return Response.json(
        { success: false, error: "code, type, and value are required" },
        { status: 400 }
      );
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return Response.json(
        { success: false, error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      minOrderValue: Number(minOrderValue) || 0,
      maxUses: Number(maxUses) || 0,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      description,
      isActive: true,
    });

    return Response.json({ success: true, data: coupon }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
