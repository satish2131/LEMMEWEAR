import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";

// GET /api/users/wishlist?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return Response.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();
    if (!user || !user.wishlist?.length) {
      return Response.json({ success: true, data: [] });
    }

    // Fetch full product details for wishlist slugs
    const products = await Product.find({ slug: { $in: user.wishlist } }).lean();

    return Response.json({ success: true, data: products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/users/wishlist — Add to wishlist
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, slug } = await request.json();

    if (!email || !slug) {
      return Response.json({ success: false, error: "Email and slug are required" }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $addToSet: { wishlist: slug } },
      { new: true, upsert: true }
    ).lean();

    return Response.json({ success: true, data: user?.wishlist || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/users/wishlist — Remove from wishlist
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { email, slug } = await request.json();

    if (!email || !slug) {
      return Response.json({ success: false, error: "Email and slug are required" }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $pull: { wishlist: slug } },
      { new: true }
    ).lean();

    return Response.json({ success: true, data: user?.wishlist || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
