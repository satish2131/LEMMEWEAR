import dbConnect from "@/lib/db";
import SavedDesign from "@/models/SavedDesign";

// POST /api/community/like — toggle like on a public design
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { designId, userEmail } = await request.json();

    if (!designId || !userEmail) {
      return Response.json({ success: false, error: "designId and userEmail required" }, { status: 400 });
    }

    const design = await SavedDesign.findOne({ _id: designId, isPublic: true });
    if (!design) return Response.json({ success: false, error: "Design not found" }, { status: 404 });

    const alreadyLiked = design.likedBy.includes(userEmail);

    if (alreadyLiked) {
      design.likedBy = design.likedBy.filter((e: string) => e !== userEmail);
      design.likes   = Math.max(0, design.likes - 1);
    } else {
      design.likedBy.push(userEmail);
      design.likes += 1;
    }

    await design.save();

    return Response.json({
      success: true,
      data: { likes: design.likes, liked: !alreadyLiked },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
