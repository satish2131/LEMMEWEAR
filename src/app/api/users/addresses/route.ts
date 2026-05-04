import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/users/addresses?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return Response.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();
    return Response.json({ success: true, data: user?.addresses || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/users/addresses — Add new address
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, address } = await request.json();

    if (!email || !address) {
      return Response.json({ success: false, error: "Email and address are required" }, { status: 400 });
    }

    const { fullName, phone, city, state, pincode } = address;
    if (!fullName || !phone || !address.address || !city || !state || !pincode) {
      return Response.json({ success: false, error: "All address fields are required" }, { status: 400 });
    }

    // If this is set as default, unset others
    if (address.isDefault) {
      await User.updateOne(
        { email },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $push: { addresses: address } },
      { new: true, upsert: true }
    ).lean();

    return Response.json({ success: true, data: user?.addresses || [] }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/users/addresses — Update an address
export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const { email, addressId, address } = await request.json();

    if (!email || !addressId || !address) {
      return Response.json({ success: false, error: "Email, addressId, and address data are required" }, { status: 400 });
    }

    // If setting as default, unset others first
    if (address.isDefault) {
      await User.updateOne(
        { email },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }

    const updateFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(address)) {
      updateFields[`addresses.$.${key}`] = value;
    }

    const user = await User.findOneAndUpdate(
      { email, "addresses._id": addressId },
      { $set: updateFields },
      { new: true }
    ).lean();

    return Response.json({ success: true, data: user?.addresses || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/users/addresses — Remove an address
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { email, addressId } = await request.json();

    if (!email || !addressId) {
      return Response.json({ success: false, error: "Email and addressId are required" }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    ).lean();

    return Response.json({ success: true, data: user?.addresses || [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
