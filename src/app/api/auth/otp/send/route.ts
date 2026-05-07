import dbConnect from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import { sendMail } from "@/lib/mailer";
import { otpEmail } from "@/lib/emailTemplates";

// POST /api/auth/otp/send
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, name } = await request.json();

    if (!email) {
      return Response.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return Response.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Rate-limit: max 3 OTPs per email per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await Otp.countDocuments({
      email: normalizedEmail,
      createdAt: { $gte: tenMinutesAgo },
    });
    if (recentCount >= 3) {
      return Response.json(
        { success: false, error: "Too many attempts. Please wait 10 minutes before trying again." },
        { status: 429 }
      );
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store hashed? For simplicity store plain — expires in 10 min and is single-use
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await Otp.create({ email: normalizedEmail, otp: code, expiresAt });

    // Send email
    const { html, text } = otpEmail({ email: normalizedEmail, name: name || "there", otp: code });
    await sendMail({
      to: normalizedEmail,
      subject: `${code} is your LemmeWear verification code`,
      html,
      text,
    });

    return Response.json({ success: true, message: "OTP sent to your email" });
  } catch (error: unknown) {
    console.error("[POST /api/auth/otp/send] Error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
