import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { hashPassword } from "@/lib/auth";

// POST /api/admin/seed — Create the first admin account
// Protected by SEED_SECRET env variable
export async function POST(request: Request) {
  try {
    const { secret, name, email, password } = await request.json();

    if (secret !== process.env.SEED_SECRET) {
      return Response.json(
        { success: false, error: "Invalid seed secret" },
        { status: 403 }
      );
    }

    if (!name || !email || !password) {
      return Response.json(
        { success: false, error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return Response.json(
        { success: false, error: "Admin with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: "superadmin",
    });

    return Response.json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
