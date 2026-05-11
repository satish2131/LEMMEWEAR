import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import SavedDesign from "@/models/SavedDesign";

// GET /api/users/designs?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const email = request.nextUrl.searchParams.get("email");
    if (!email) return Response.json({ success: false, error: "Email is required" }, { status: 400 });

    const designs = await SavedDesign.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
    return Response.json({ success: true, data: designs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/users/designs — Save a new design
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { userEmail, userName, name, preview, config } = await request.json();

    if (!userEmail || !name) {
      return Response.json({ success: false, error: "Email and design name are required" }, { status: 400 });
    }

    const design = await SavedDesign.create({
      userEmail, userName: userName || "Designer",
      name, preview: preview || "", config: config || {},
    });

    return Response.json({ success: true, data: design }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/users/designs — Toggle public/private or update
export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const { designId, userEmail, isPublic } = await request.json();

    if (!designId || !userEmail) {
      return Response.json({ success: false, error: "designId and userEmail required" }, { status: 400 });
    }

    const design = await SavedDesign.findOneAndUpdate(
      { _id: designId, userEmail },
      { $set: { isPublic } },
      { new: true }
    ).lean();

    if (!design) return Response.json({ success: false, error: "Design not found" }, { status: 404 });
    return Response.json({ success: true, data: design });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/users/designs
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { designId } = await request.json();
    if (!designId) return Response.json({ success: false, error: "Design ID is required" }, { status: 400 });
    await SavedDesign.findByIdAndDelete(designId);
    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
