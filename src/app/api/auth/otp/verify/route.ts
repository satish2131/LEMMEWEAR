import dbConnect from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import { hashPassword, signToken } from "@/lib/auth";

// POST /api/auth/otp/verify — verify OTP then create the account
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { name, email, password, otp } = await request.json();

    if (!name || !email || !password || !otp) {
      return Response.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find OTP record
    const record = await Otp.findOne({ email: normalizedEmail });

    if (!record) {
      return Response.json(
        { success: false, error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return Response.json(
        { success: false, error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check OTP value
    if (record.otp !== otp.trim()) {
      return Response.json(
        { success: false, error: "Incorrect OTP. Please try again." },
        { status: 400 }
      );
    }

    // OTP is valid — delete it (single use)
    await Otp.deleteOne({ _id: record._id });

    // Double-check account doesn't exist (race condition guard)
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return Response.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create the account
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      rewardPoints: 100, // welcome bonus
    });

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = Response.json(
      {
        success: true,
        data: {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            rewardPoints: user.rewardPoints,
          },
        },
      },
      { status: 201 }
    );

    response.headers.set(
      "Set-Cookie",
      `lw_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
    );

    return response;
  } catch (error: unknown) {
    console.error("[POST /api/auth/otp/verify] Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
