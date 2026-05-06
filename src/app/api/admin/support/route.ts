import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import Contact from "@/models/Contact";

// GET /api/admin/support?page=1&limit=20&status=Open&search=TK-
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await dbConnect();

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { ticketNumber: { $regex: search, $options: "i" } },
        { customer: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch SupportTickets
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SupportTicket.countDocuments(filter),
    ]);

    // If no status filter and no search, also pull Contact submissions
    // that haven't been converted to tickets yet (for backwards compatibility)
    let contactTickets: unknown[] = [];
    if (!status || status === "all") {
      const existingEmails = tickets.map((t) => t.email);
      const contactFilter: Record<string, unknown> = {};
      if (search) {
        contactFilter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
        ];
      }
      // Only pull contacts whose email doesn't already have a ticket
      if (existingEmails.length > 0) {
        contactFilter.email = { $nin: existingEmails };
      }

      const contacts = await Contact.find(contactFilter)
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      // Shape contacts to look like tickets
      contactTickets = contacts.map((c) => ({
        _id: c._id,
        ticketNumber: `CT-${c._id.toString().slice(-6).toUpperCase()}`,
        customer: c.name,
        email: c.email,
        subject: c.subject || "General Enquiry",
        description: c.message,
        status: c.status === "replied" ? "Resolved" : "Open",
        priority: "Medium",
        replies: [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        _isContact: true,
        _contactId: c._id,
      }));
    }

    const allTickets = [...tickets, ...contactTickets].sort(
      (a, b) =>
        new Date((b as { createdAt: Date }).createdAt).getTime() -
        new Date((a as { createdAt: Date }).createdAt).getTime()
    );

    return Response.json({
      success: true,
      data: allTickets,
      pagination: {
        page,
        limit,
        total: total + contactTickets.length,
        totalPages: Math.ceil((total + contactTickets.length) / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/admin/support — Create a new ticket manually
export async function POST(request: Request) {
  try {
    await requireAdmin();
    await dbConnect();

    const body = await request.json();
    const { customer, email, subject, description, priority } = body;

    if (!customer || !email || !subject || !description) {
      return Response.json(
        { success: false, error: "customer, email, subject, and description are required" },
        { status: 400 }
      );
    }

    const ticketNumber = `TK-${Date.now().toString(36).toUpperCase()}`;

    const ticket = await SupportTicket.create({
      ticketNumber,
      customer,
      email,
      subject,
      description,
      priority: priority || "Medium",
      status: "Open",
    });

    return Response.json({ success: true, data: ticket }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
