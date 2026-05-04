import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import Review from "@/models/Review";
import { products as seedProducts } from "@/data/products";

// POST /api/seed — Seed the database with product data
export async function POST(request: Request) {
  try {
    // Protect with secret
    const body = await request.json().catch(() => ({}));
    const secret = body.secret;
    const expectedSecret = process.env.SEED_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
      return Response.json(
        { success: false, error: "Invalid seed secret" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Clear existing products
    await Product.deleteMany({});

    // Transform and insert products
    const productDocs = seedProducts.map((p) => ({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      subtitle: p.subtitle,
      price: p.price,
      oldPrice: p.oldPrice,
      rating: p.rating,
      reviews: p.reviews,
      image: p.image,
      gallery: p.gallery,
      colors: p.colors,
      sizes: p.sizes,
      badge: p.badge,
      description: p.description,
      features: p.features,
      styles: p.styles,
      inStock: true,
    }));

    const inserted = await Product.insertMany(productDocs);

    // Seed some sample reviews
    await Review.deleteMany({});

    const sampleReviews = [
      {
        productSlug: "noctura-crew",
        userName: "Arjun M.",
        userEmail: "arjun@example.com",
        rating: 5,
        title: "Best tee I own!",
        comment: "The fabric quality is incredible. 240 GSM feels premium and the plum color is stunning. Already ordered two more.",
        verified: true,
      },
      {
        productSlug: "noctura-crew",
        userName: "Sneha R.",
        userEmail: "sneha@example.com",
        rating: 5,
        title: "Perfect fit",
        comment: "Fits exactly as described. The crew neckline is well-constructed and doesn't stretch out. Love it!",
        verified: true,
      },
      {
        productSlug: "onyx-essential",
        userName: "Karthik S.",
        userEmail: "karthik@example.com",
        rating: 5,
        title: "My go-to black tee",
        comment: "This is the black tee everyone needs. Heavyweight but comfortable. Color doesn't fade after washes.",
        verified: true,
      },
      {
        productSlug: "horizon-classic",
        userName: "Priya V.",
        userEmail: "priya@example.com",
        rating: 4,
        title: "Great quality, slightly large",
        comment: "Beautiful purple color and great cotton quality. Runs slightly large — consider sizing down.",
        verified: true,
      },
      {
        productSlug: "meme-culture-tee",
        userName: "Vikram D.",
        userEmail: "vikram@example.com",
        rating: 5,
        title: "Everyone asks about this shirt 😂",
        comment: "The print quality is top-notch and the reactions I get are priceless. Comfortable unisex fit too.",
        verified: true,
      },
      {
        productSlug: "anime-oversized-unisex",
        userName: "Riya K.",
        userEmail: "riya@example.com",
        rating: 5,
        title: "Anime lovers must buy!",
        comment: "The oversized drop is perfect and the anime art on the back is beautifully printed. 260 GSM is hefty but feels so luxe.",
        verified: true,
      },
      {
        productSlug: "plain-solid-unisex",
        userName: "Aditya P.",
        userEmail: "aditya@example.com",
        rating: 5,
        title: "Bought in every color",
        comment: "Not kidding — I have this in all 4 colors. At ₹999, this is the best value premium tee in India.",
        verified: true,
      },
      {
        productSlug: "lavender-crop-women",
        userName: "Meera T.",
        userEmail: "meera@example.com",
        rating: 5,
        title: "So soft and flattering",
        comment: "The modal fabric is butter soft. The lavender color is exactly like the photos. Perfect crop length!",
        verified: true,
      },
      {
        productSlug: "minimalist-white-women",
        userName: "Ananya G.",
        userEmail: "ananya@example.com",
        rating: 5,
        title: "The perfect white tee exists",
        comment: "Finally a white tee that's not see-through! The slim fit is flattering and it goes with everything.",
        verified: true,
      },
      {
        productSlug: "lume-bifold-wallet",
        userName: "Rahul S.",
        userEmail: "rahul@example.com",
        rating: 5,
        title: "Premium leather quality",
        comment: "The leather quality is outstanding. RFID blocking is a nice touch. Bought one as a gift too.",
        verified: true,
      },
    ];

    await Review.insertMany(sampleReviews);

    return Response.json({
      success: true,
      message: `Seeded ${inserted.length} products and ${sampleReviews.length} reviews`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
