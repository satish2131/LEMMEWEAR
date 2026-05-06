import { requireAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import Contact from "@/models/Contact";

// PATCH /api/admin/support/[id] — Update ticket status or add reply
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminPayload = await requireAdmin();
    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    // CT- prefix means it came from the Contact collection
    if (id.startsWith("CT-")) {
      // For contact-based tickets, update the Contact status
      const contactId = id.replace("CT-", "");
      const newStatus = body.status === "Resolved" || body.status === "Closed"
        ? "replied"
        : "read";

      const contact = await Contact.findByIdAndUpdate(
        contactId,
        { $set: { status: newStatus } },
        { new: true }
      ).lean();

      if (!contact) {
        return Response.json({ success: false, error: "Ticket not found" }, { status: 404 });
      }

      // Return shaped as a ticket
      return Response.json({
        success: true,
        data: {
          _id: contact._id,
          ticketNumber: id,
          customer: contact.name,
          email: contact.email,
          subject: contact.subject,
          description: contact.message,
          status: body.status || "Open",
          priority: "Medium",
          replies: body.reply
            ? [{ message: body.reply, author: adminPayload.name, authorType: "admin", createdAt: new Date() }]
            : [],
          createdAt: contact.createdAt,
        },
      });
    }

    // Regular SupportTicket
    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = body.status;
    if (body.priority) updates.priority = body.priority;

    let pushOp: Record<string, unknown> | undefined;
    if (body.reply) {
      pushOp = {
        replies: {
          message: body.reply,
          author: adminPayload.name,
          authorType: "admin",
          createdAt: new Date(),
        },
      };
    }

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys(updates).length > 0) updateQuery.$set = updates;
    if (pushOp) updateQuery.$push = pushOp;

    if (Object.keys(updateQuery).length === 0) {
      return Response.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketNumber: id },
      updateQuery,
      { new: true }
    ).lean();

    if (!ticket) {
      return Response.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: ticket });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Server error";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
