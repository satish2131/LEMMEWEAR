import dbConnect from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

const EMPTY_BUILDER = { tshirts: [], accessories: [], chocolates: [], packagings: [] };

// GET /api/site/settings — Public endpoint for frontend components
export async function GET() {
  try {
    await dbConnect();

    const settings = await SiteSettings.findOne({ key: "main" })
      .select("-__v -_id -key")
      .lean();

    if (!settings) {
      return Response.json({
        success: true,
        data: {
          contact: {
            email: process.env.NEXT_PUBLIC_STORE_EMAIL || "hello@lemmewear.in",
            phone: process.env.NEXT_PUBLIC_STORE_PHONE || "+91 98765 43210",
            address: process.env.NEXT_PUBLIC_STORE_ADDRESS || "Andheri West, Mumbai, Maharashtra 400058",
            hours: process.env.NEXT_PUBLIC_STORE_HOURS || "Mon–Sat 10am–7pm IST",
            whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
          },
          social: {
            instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
            twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "",
            facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
            youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
          },
          trending: { sectionTitle: "Trending Now", sectionSubtitle: "Our most-loved pieces this season", productSlugs: [], displayCount: 4 },
          giftPacks: {
            sectionTitle: "Gifts they'll never forget.",
            sectionSubtitle: "Thoughtfully curated boxes featuring our signature tees, premium accessories, artisan chocolates, and elegant packaging.",
            packs: [
              { name: "Romantic Edit", description: "For the one who lights up your world", price: 2999 },
              { name: "Birthday Bliss", description: "Make their day unforgettable", price: 2499 },
              { name: "Corporate Premium", description: "Gift your team in style", price: 3499 },
            ],
          },
          giftBuilder: EMPTY_BUILDER,
        },
      });
    }

    // Ensure giftBuilder is always present even if the DB doc predates this field
    const data = {
      ...settings,
      giftBuilder: (settings as Record<string, unknown>).giftBuilder ?? EMPTY_BUILDER,
    };

    return Response.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
