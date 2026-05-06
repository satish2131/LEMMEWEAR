import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

// GET /api/admin/settings
export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    let settings = await SiteSettings.findOne({ key: "main" }).lean();

    // Auto-create defaults if not exists
    if (!settings) {
      settings = await SiteSettings.create({
        key: "main",
        giftPacks: {
          sectionTitle: "Gifts they'll never forget.",
          sectionSubtitle:
            "Thoughtfully curated boxes featuring our signature tees, premium accessories, artisan chocolates, and elegant packaging.",
          packs: [
            { name: "Romantic Edit", description: "For the one who lights up your world", price: 2999 },
            { name: "Birthday Bliss", description: "Make their day unforgettable", price: 2499 },
            { name: "Corporate Premium", description: "Gift your team in style", price: 3499 },
          ],
        },
      });
    }

    // Ensure giftBuilder is always present even if the DB doc predates this field
    const settingsObj = settings as unknown as Record<string, unknown>;
    const data = {
      ...settingsObj,
      giftBuilder: settingsObj.giftBuilder ?? { tshirts: [], accessories: [], chocolates: [], packagings: [] },
    };

    return Response.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/admin/settings — Upsert settings
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await request.json();

    // Build a flat $set object to handle nested fields correctly
    // e.g. { giftBuilder: { tshirts: [...] } } → { "giftBuilder.tshirts": [...] }
    const flatSet: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
          flatSet[`${key}.${subKey}`] = subValue;
        }
      } else {
        flatSet[key] = value;
      }
    }

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      { $set: flatSet },
      { new: true, upsert: true, strict: false }
    ).lean();

    return Response.json({ success: true, data: settings });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
