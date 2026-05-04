import dbConnect from "@/lib/db";
import Contact from "@/models/Contact";

// POST /api/contact — Submit contact form
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return Response.json(
        { success: false, error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const contact = await Contact.create({
      name,
      email,
      subject: subject || "other",
      message,
      status: "new",
    });

    return Response.json(
      { success: true, data: { id: contact._id } },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
