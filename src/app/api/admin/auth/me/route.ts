import { verifyAdminAuth } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";

// GET /api/admin/auth/me
export async function GET() {
  try {
    const payload = await verifyAdminAuth();

    if (!payload) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const admin = await Admin.findById(payload.userId).select("-password").lean();

    if (!admin) {
      return Response.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

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
