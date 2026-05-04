import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/users/profile?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return Response.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ email }).lean();

    // Auto-create guest user if not found
    if (!user) {
      const newUser = await User.create({
        name: "Guest User",
        email,
        rewardPoints: 0,
      });
      user = newUser.toObject();
    }

    return Response.json({ success: true, data: user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/users/profile — Update user profile
export async function PATCH(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { email, name, phone, city, addresses, wishlist } = body;

    if (!email) {
      return Response.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (city !== undefined) updates.city = city;
    if (addresses !== undefined) updates.addresses = addresses;
    if (wishlist !== undefined) updates.wishlist = wishlist;

    const user = await User.findOneAndUpdate(
      { email },
      { $set: updates },
      { new: true, upsert: true }
    ).lean();

    return Response.json({ success: true, data: user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
