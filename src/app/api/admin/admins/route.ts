import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { hashPassword } from "@/lib/auth";
import { verifyAdminAuth } from "@/lib/adminAuth";

// GET /api/admin/admins — list all admin users (superadmin only)
export async function GET() {
  try {
    const auth = await verifyAdminAuth();
    if (!auth) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "superadmin") {
      return Response.json({ success: false, error: "Superadmin access required" }, { status: 403 });
    }

    await dbConnect();
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, data: admins });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/admin/admins — create a new admin user (superadmin only)
export async function POST(request: Request) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "superadmin") {
      return Response.json({ success: false, error: "Superadmin access required" }, { status: 403 });
    }

    await dbConnect();
    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return Response.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() }).lean();
    if (existing) {
      return Response.json(
        { success: false, error: "An admin with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role === "superadmin" ? "superadmin" : "admin",
    });

    return Response.json(
      {
        success: true,
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
