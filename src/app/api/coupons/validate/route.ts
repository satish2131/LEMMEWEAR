import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Coupon from "@/models/Coupon";

// POST /api/coupons/validate
// Body: { code: string, cartTotal: number }
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { code, cartTotal = 0 } = await request.json();

    if (!code) {
      return Response.json({ success: false, error: "Code is required" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    }).lean();

    if (!coupon) {
      return Response.json({ success: false, error: "Invalid or expired coupon code" }, { status: 404 });
    }

    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return Response.json({ success: false, error: "This coupon has expired" }, { status: 400 });
    }

    // Check max uses
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return Response.json({ success: false, error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    // Check minimum order value
    if (coupon.minOrderValue > 0 && cartTotal < coupon.minOrderValue) {
      return Response.json({
        success: false,
        error: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString("en-IN")} required`,
      }, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = Math.round(cartTotal * (coupon.value / 100));
    } else {
      discountAmount = Math.min(coupon.value, cartTotal);
    }

    return Response.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        description: coupon.description,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
