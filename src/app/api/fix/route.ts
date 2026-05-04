import { type NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    let count = 0;
    
    const oversizedProducts = await Product.find({
      $or: [
        { name: /oversize/i },
        { subtitle: /oversize/i },
        { description: /oversize/i }
      ]
    });

    for (const p of oversizedProducts) {
      if (!p.styles) p.styles = [];
      if (!p.styles.includes('Oversized T-Shirts')) {
        p.styles.push('Oversized T-Shirts');
        await p.save();
        count++;
      }
    }
    
    return Response.json({ success: true, updated: count });
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
