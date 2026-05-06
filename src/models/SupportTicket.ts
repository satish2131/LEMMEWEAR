import mongoose, { Schema, Document, Model } from "mongoose";

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export interface IReply {
  message: string;
  author: string;
  authorType: "admin" | "customer";
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketNumber: string;
  customer: string;
  email: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    message: { type: String, required: true },
    author: { type: String, required: true },
    authorType: { type: String, enum: ["admin", "customer"], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: String, required: true },
    email: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    replies: [ReplySchema],
  },
  {
    timestamps: true,
  }
);

const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export default SupportTicket;
