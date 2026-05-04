import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/auth/me — Get current user from cookie
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("lw_token")?.value;

    if (!token) {
      return Response.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(payload.userId)
      .select("-password")
      .lean();

    if (!user) {
      return Response.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        rewardPoints: user.rewardPoints,
        wishlist: user.wishlist,
        addresses: user.addresses,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
