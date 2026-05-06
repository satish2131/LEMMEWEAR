/**
 * Admin authentication middleware and utilities
 */
import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./auth";
import dbConnect from "./db";
import Admin from "@/models/Admin";

export interface AdminJwtPayload extends JwtPayload {
  role: "admin" | "superadmin";
  isAdmin: true;
}

/**
 * Verify admin authentication from request cookies
 * Returns admin data if authenticated, null otherwise
 */
export async function verifyAdminAuth(): Promise<AdminJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("lw_admin_token")?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Verify this is an admin token
    await dbConnect();
    const admin = await Admin.findById(payload.userId).lean();

    if (!admin) {
      return null;
    }

    return {
      ...payload,
      role: admin.role,
      isAdmin: true,
    };
  } catch {
    return null;
  }
}

/**
 * Require admin authentication - returns 401 if not authenticated
 */
export async function requireAdmin(): Promise<AdminJwtPayload> {
  const admin = await verifyAdminAuth();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  return admin;
}
