import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";
import { hashPassword } from "@/lib/auth";
import { verifyAdminAuth } from "@/lib/adminAuth";

// PATCH /api/admin/admins/[id] — update name, email, role, or password
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "superadmin") {
      return Response.json({ success: false, error: "Superadmin access required" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Prevent demoting yourself
    if (id === auth.userId && body.role && body.role !== "superadmin") {
      return Response.json(
        { success: false, error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name.trim();
    if (body.email) updates.email = body.email.toLowerCase().trim();
    if (body.role) updates.role = body.role;
    if (body.password) {
      if (body.password.length < 8) {
        return Response.json(
          { success: false, error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      updates.password = await hashPassword(body.password);
    }

    const admin = await Admin.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select("-password")
      .lean();

    if (!admin) {
      return Response.json({ success: false, error: "Admin not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: admin });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/admin/admins/[id] — remove an admin user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAuth();
    if (!auth) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (auth.role !== "superadmin") {
      return Response.json({ success: false, error: "Superadmin access required" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    // Prevent self-deletion
    if (id === auth.userId) {
      return Response.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const admin = await Admin.findByIdAndDelete(id).lean();
    if (!admin) {
      return Response.json({ success: false, error: "Admin not found" }, { status: 404 });
    }

    return Response.json({ success: true, message: "Admin deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
